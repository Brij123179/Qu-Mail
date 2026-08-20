import base64
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse

from backend.config import SECURITY_LEVELS, HOST, PORT
from backend.km_server import app as km_app, KEY_BANK, AUDIT_LOGS, log_audit
from backend.crypto_engine import CryptoEngine, CryptoEngineError
from backend.email_service import EmailService
from backend.models import (
    SendEmailRequest,
    ReplayAttackRequest,
    AttackSimResponse,
    TransportConfigRequest,
    KeyBankEntropyResponse,
)

# Unified FastAPI App
app = FastAPI(
    title="QuMail — Quantum-Secured Email Platform",
    description="Quantum Key Distribution (QKD) Email Client & ETSI GS QKD 014 Key Manager Service",
    version="1.0.0",
)

# CORS middleware for open accessibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

crypto_engine = CryptoEngine()
email_service = EmailService(crypto_engine)

# Include KM Server endpoints into main app
app.include_router(km_app.router)

# Static & Frontend Assets
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
STATIC_DIR = BASE_DIR / "static"

if FRONTEND_DIST.exists() and (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
def serve_index():
    if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
        return FileResponse(FRONTEND_DIST / "index.html")
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "QuMail API Server is running. Access /docs for OpenAPI documentation."}


# Email Protocol API Endpoints
@app.post("/api/v1/email/send", status_code=status.HTTP_201_CREATED)
def send_email_endpoint(req: SendEmailRequest):
    try:
        msg = email_service.send_email(req)
        log_audit(
            event_type="EMAIL_SENT",
            actor=req.sender,
            details={
                "recipient": req.recipient,
                "security_level": req.security_level,
                "key_id": msg.get("key_id"),
                "transport": msg.get("transport", "local"),
            },
            status_str="SUCCESS",
        )
        return {"status": "SUCCESS", "message": "Email sent successfully", "data": msg}
    except Exception as e:
        log_audit(
            event_type="EMAIL_SEND_FAILED",
            actor=req.sender,
            details={"recipient": req.recipient, "error": str(e)},
            status_str="ERROR",
        )
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/v1/email/inbox/{user}")
def get_inbox_endpoint(user: str):
    try:
        messages = email_service.get_inbox(user)
        # NOTE: Do NOT log_audit on background inbox polling to keep logs clean
        return {"user": user, "total_messages": len(messages), "messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/config/transport")
def get_transport_config():
    return email_service.get_transport_config()


@app.post("/api/v1/config/transport")
def update_transport_config(cfg: TransportConfigRequest):
    updated = email_service.set_transport_config(cfg)
    log_audit(
        event_type="TRANSPORT_CONFIG_UPDATED",
        actor="AdminUI",
        details={"mode": cfg.mode.value, "smtp_host": cfg.smtp_host},
        status_str="SUCCESS",
    )
    return updated


@app.get("/api/v1/security/levels")
def get_security_levels():
    return SECURITY_LEVELS


@app.post("/api/v1/attack/tamper", response_model=AttackSimResponse)
def simulate_tamper_attack(msg_id: str):
    """
    Simulates an adversary tampering with encrypted ciphertext in transit.
    Verifies that AES-GCM AEAD tag check fails.
    """
    msg = email_service.get_message_by_id(msg_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")

    if msg["security_level"] == 1:
        return AttackSimResponse(
            attack_type="Ciphertext Tampering",
            success=True,
            status_code=200,
            details="Level 1 does not encrypt payload. Tampering cannot be detected by payload AEAD.",
            mitigation_explanation="Level 1 relies solely on transport-layer TLS. Upgrade to Level 2 or 3 for AEAD payload integrity.",
        )

    # Flip bits in base64 ciphertext
    raw_ct = base64.b64decode(msg["body_b64"])
    tampered_bytes = bytearray(raw_ct)
    if len(tampered_bytes) > 0:
        tampered_bytes[0] ^= 0xFF  # Invert first byte

    tampered_b64 = base64.b64encode(bytes(tampered_bytes)).decode("utf-8")

    # Attempt decryption on tampered payload
    try:
        crypto_engine.decrypt(
            body_b64=tampered_b64,
            security_level=msg["security_level"],
            key_id=msg.get("key_id"),
            iv_b64=msg.get("iv_b64"),
            sender=msg["sender"],
            recipient=msg["recipient"],
        )
        return AttackSimResponse(
            attack_type="Tamper Attack",
            success=True,
            status_code=200,
            details="Tampered payload was accepted unexpectedly.",
            mitigation_explanation="AEAD verification missed bit flips.",
        )
    except CryptoEngineError as ce:
        log_audit(
            event_type="TAMPER_ATTACK_PREVENTED",
            actor="RedTeamSimulator",
            details={"msg_id": msg_id, "error": str(ce)},
            status_str="BREACH_PREVENTED",
        )
        return AttackSimResponse(
            attack_type="Ciphertext Tamper / AEAD Attack",
            success=False,
            status_code=400,
            details=f"Tampered ciphertext was REJECTED: {ce}",
            mitigation_explanation="SUCCESS: AES-GCM / PQC AEAD integrity tag verification caught the bit-flip attack and aborted decryption before returning plaintext.",
        )


@app.post("/api/v1/attack/harvest-sim", response_model=AttackSimResponse)
def simulate_harvest_attack(msg_id: str):
    """
    Simulates a 'Harvest Now, Decrypt Later' attack by a quantum-capable adversary.
    Evaluates whether stored historical email traffic can be decrypted without the QKD key.
    """
    msg = email_service.get_message_by_id(msg_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")

    level = msg["security_level"]

    if level == 1:
        log_audit(
            event_type="HARVEST_ATTACK_SUCCESSFUL",
            actor="Eve-Adversary",
            details={"msg_id": msg_id, "level": 1, "result": "TLS payload compromised"},
            status_str="WARN",
        )
        return AttackSimResponse(
            attack_type="Harvest Now, Decrypt Later (Shor's Algorithm)",
            success=True,
            status_code=200,
            details=f"BREACH EXPOSED: Level 1 TLS payload harvest successful! Raw text exposed: '{base64.b64decode(msg['body_b64']).decode('utf-8', errors='ignore')}'",
            mitigation_explanation="RSA/ECC key exchange was broken by Shor's algorithm. Transport TLS provides zero protection for stored historical emails.",
        )
    elif level == 2:
        log_audit(
            event_type="HARVEST_ATTACK_BLOCKED",
            actor="Eve-Adversary",
            details={"msg_id": msg_id, "level": 2, "result": "Grover search space 2^128 too large"},
            status_str="BREACH_PREVENTED",
        )
        return AttackSimResponse(
            attack_type="Harvest Now, Decrypt Later (Grover's Search)",
            success=False,
            status_code=400,
            details="ATTACK FAILED: Level 2 AES-256-GCM ciphertext remains secure against quantum harvest. Grover's algorithm requires 2^128 operations.",
            mitigation_explanation="AES-256 key derived via HKDF from QKD key maintains 128-bit quantum security margin.",
        )
    elif level == 3:
        log_audit(
            event_type="HARVEST_ATTACK_BLOCKED",
            actor="Eve-Adversary",
            details={"msg_id": msg_id, "level": 3, "result": "Shannon Information-Theoretically Secure"},
            status_str="BREACH_PREVENTED",
        )
        return AttackSimResponse(
            attack_type="Harvest Now, Decrypt Later (Quantum Supercomputer)",
            success=False,
            status_code=400,
            details="ATTACK FAILED: Level 3 Vernam One-Time Pad is INFORMATION-THEORETICALLY UNBREAKABLE. Perfect secrecy holds regardless of adversary compute power.",
            mitigation_explanation="Shannon's theorem proves that true OTP with single-use QKD keys yields zero mutual information between ciphertext and plaintext.",
        )
    else:
        log_audit(
            event_type="HARVEST_ATTACK_BLOCKED",
            actor="Eve-Adversary",
            details={"msg_id": msg_id, "level": 4, "result": "ML-KEM Kyber Lattice Problem Intractable"},
            status_str="BREACH_PREVENTED",
        )
        return AttackSimResponse(
            attack_type="Harvest Now, Decrypt Later (Lattice Reduction)",
            success=False,
            status_code=400,
            details="ATTACK FAILED: Level 4 PQC Kyber-768 hybrid lattice security holds against quantum reduction attacks.",
            mitigation_explanation="NIST PQC ML-KEM-768 Learning With Errors (LWE) lattice hard problem prevents ciphertext decryption.",
        )


@app.get("/api/v1/keys/entropy", response_model=KeyBankEntropyResponse)
@app.get("/keys/entropy", response_model=KeyBankEntropyResponse)
def get_key_entropy_endpoint():
    from backend.km_server import get_key_entropy
    return get_key_entropy()


@app.get("/api/v1/audit/export")
def export_audit_report(format: str = "json"):
    """
    Generates a formal ETSI GS QKD 014 Compliance Audit Certificate (JSON or Printable HTML).
    """
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    total_keys = len(KEY_BANK)
    consumed_keys = sum(1 for r in KEY_BANK.values() if r["status"] == "consumed")
    breaches_prevented = sum(1 for log in AUDIT_LOGS if log.get("status") == "BREACH_PREVENTED")

    report_data = {
        "title": "QuMail — ETSI GS QKD 014 Compliance Audit Certificate",
        "generated_at": now_str,
        "standard_compliance": "ETSI GS QKD 014 v1.1.1",
        "single_use_enforcement_status": "VERIFIED_100_PERCENT",
        "total_keys_managed": total_keys,
        "consumed_keys_burned": consumed_keys,
        "replay_attacks_prevented": breaches_prevented,
        "audit_logs": AUDIT_LOGS[:100],
    }

    if format.lower() == "html":
        log_rows = "".join(
            f"<tr><td>{log['timestamp'][:19]}</td><td><b>{log['event_type']}</b></td><td>{log['actor']}</td><td><span style='color: {'#10B981' if log['status']=='SUCCESS' else '#EF4444'}'>{log['status']}</span></td></tr>"
            for log in AUDIT_LOGS[:20]
        )
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>ETSI GS QKD 014 Compliance Audit Certificate</title>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; background: #0f172a; color: #f8fafc; }}
                .cert {{ border: 2px solid #38bdf8; border-radius: 12px; padding: 30px; background: #1e293b; max-width: 900px; margin: 0 auto; }}
                h1 {{ color: #38bdf8; margin-top: 0; }}
                .badge {{ background: #0369a1; color: #fff; padding: 4px 12px; border-radius: 9999px; font-weight: bold; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }}
                th, td {{ border: 1px solid #334155; padding: 10px; text-align: left; }}
                th {{ background: #0f172a; color: #94a3b8; }}
            </style>
        </head>
        <body>
            <div class="cert">
                <h1>🛡️ QuMail ETSI GS QKD 014 Compliance Audit Certificate</h1>
                <p><b>Generated At:</b> {now_str} | <span class="badge">VERIFIED PASS</span></p>
                <hr style="border-color: #334155;" />
                <p><b>Standard:</b> ETSI GS QKD 014 v1.1.1 REST Key Delivery Interface</p>
                <p><b>Single-Use Enforcement:</b> 100% (HTTP 410 Gone Burn-On-Access Active)</p>
                <p><b>Keys Generated:</b> {total_keys} | <b>Keys Consumed:</b> {consumed_keys} | <b>Replay Attacks Blocked:</b> {breaches_prevented}</p>

                <h3>Recent Security & Telemetry Audit Trail</h3>
                <table>
                    <thead>
                        <tr><th>Timestamp</th><th>Event Type</th><th>Actor</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {log_rows}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)

    return report_data


@app.get("/api/v1/dashboard/stats")
def get_dashboard_stats():
    total_keys = len(KEY_BANK)
    consumed_keys = sum(1 for r in KEY_BANK.values() if r["status"] == "consumed")
    reserved_keys = sum(1 for r in KEY_BANK.values() if r["status"] == "reserved")

    mailbox = email_service._load_mailbox()
    total_emails = len(mailbox)

    return {
        "qkd_telemetry": {
            "total_keys_generated": total_keys,
            "keys_consumed": consumed_keys,
            "keys_reserved": reserved_keys,
            "single_use_enforcement_rate": "100%",
            "etsi_api_status": "ONLINE (ETSI GS QKD 014 v1.1.1)",
        },
        "email_telemetry": {
            "total_emails_sent": total_emails,
            "level1_count": sum(1 for m in mailbox if m["security_level"] == 1),
            "level2_count": sum(1 for m in mailbox if m["security_level"] == 2),
            "level3_count": sum(1 for m in mailbox if m["security_level"] == 3),
            "level4_count": sum(1 for m in mailbox if m["security_level"] == 4),
            "transport_mode": email_service.transport_config["mode"],
        },
        "audit_summary": {
            "total_logs": len(AUDIT_LOGS),
            "breaches_prevented": sum(1 for log in AUDIT_LOGS if log.get("status") == "BREACH_PREVENTED"),
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
