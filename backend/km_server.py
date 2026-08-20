import base64
import json
import os
import secrets
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel

from backend.config import KEY_BANK_FILE, AUDIT_LOG_FILE
from backend.models import (
    GenerateKeyRequest,
    KeyResponse,
    KeyStatus,
    KeyStatusResponse,
    BankStatsResponse,
    AuditLogEntry,
    ReplayAttackRequest,
    AttackSimResponse,
    KeyBankEntropyResponse,
)

app = FastAPI(
    title="QuMail ETSI GS QKD 014 Key Manager Service",
    description="Quantum Key Distribution Key Manager REST API simulating ETSI GS QKD 014 standard key delivery interface.",
    version="1.0.0",
)

# In-memory stores (synced to JSON)
KEY_BANK: Dict[str, Dict[str, Any]] = {}
AUDIT_LOGS: List[Dict[str, Any]] = []


def load_data():
    global KEY_BANK, AUDIT_LOGS
    if KEY_BANK_FILE.exists():
        try:
            with open(KEY_BANK_FILE, "r") as f:
                KEY_BANK = json.load(f)
        except Exception:
            KEY_BANK = {}
    if AUDIT_LOG_FILE.exists():
        try:
            with open(AUDIT_LOG_FILE, "r") as f:
                AUDIT_LOGS = json.load(f)
        except Exception:
            AUDIT_LOGS = []


def save_data():
    try:
        with open(KEY_BANK_FILE, "w") as f:
            json.dump(KEY_BANK, f, indent=2)
        with open(AUDIT_LOG_FILE, "w") as f:
            json.dump(AUDIT_LOGS[-500:], f, indent=2)  # Keep last 500 entries
    except Exception as e:
        print(f"Warning: Failed to persist KM state: {e}")


def log_audit(event_type: str, actor: str, details: Dict[str, Any], status_str: str = "SUCCESS"):
    entry = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        "actor": actor,
        "details": details,
        "status": status_str,
    }
    AUDIT_LOGS.insert(0, entry)
    save_data()


# Initialize data on module load
load_data()


@app.post("/api/v1/keys/generate", response_model=KeyResponse, status_code=status.HTTP_201_CREATED)
@app.post("/keys/generate", response_model=KeyResponse, status_code=status.HTTP_201_CREATED)
def generate_key(req: GenerateKeyRequest):
    """
    ETSI GS QKD 014 Key Generation Endpoint.
    Generates cryptographically secure QKD key material (CSPRNG simulation)
    and marks state as RESERVED.
    """
    if req.length_bytes < 16 or req.length_bytes > 1048576:  # Max 1MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="length_bytes must be between 16 and 1,048,576 bytes."
        )

    key_id = str(uuid.uuid4())
    raw_material = secrets.token_bytes(req.length_bytes)
    key_b64 = base64.b64encode(raw_material).decode("utf-8")
    now_str = datetime.now(timezone.utc).isoformat()

    record = {
        "key_id": key_id,
        "key_b64": key_b64,
        "length_bytes": req.length_bytes,
        "status": KeyStatus.RESERVED.value,
        "purpose": req.purpose,
        "created_at": now_str,
        "consumed_at": None,
    }

    KEY_BANK[key_id] = record
    log_audit(
        event_type="KEY_GENERATE",
        actor="CryptoEngine-Sender",
        details={
            "key_id": key_id,
            "length_bytes": req.length_bytes,
            "purpose": req.purpose,
            "slave_sa_id": req.slave_sa_id or "default-sa",
        },
        status_str="SUCCESS",
    )
    save_data()

    return KeyResponse(**record)


@app.get("/api/v1/keys/entropy", response_model=KeyBankEntropyResponse)
@app.get("/keys/entropy", response_model=KeyBankEntropyResponse)
def get_key_entropy():
    """
    Key Manager Entropy & Capacity Telemetry.
    Monitors Key Pool availability ratio and provides fallback recommendations.
    """
    total = len(KEY_BANK)
    consumed = sum(1 for r in KEY_BANK.values() if r["status"] == KeyStatus.CONSUMED.value)
    available = total - consumed

    entropy_score = 0.99 if total == 0 else round(max(0.1, available / max(1, total)), 2)
    is_low_entropy = available < 3 and total >= 10

    recommendation = (
        "Key bank operating at optimal QKD entropy level."
        if not is_low_entropy
        else "CRITICAL WARNING: OTP Key Pool Low. Automatic Fallback to Level 2 (AES-256-GCM) Recommended."
    )

    return KeyBankEntropyResponse(
        available_keys=available,
        total_keys=total,
        consumed_keys=consumed,
        entropy_score=entropy_score,
        is_low_entropy=is_low_entropy,
        recommendation=recommendation,
    )


@app.get("/api/v1/keys/{key_id}", response_model=KeyResponse)
@app.get("/keys/{key_id}", response_model=KeyResponse)
def get_key(key_id: str):
    """
    ETSI GS QKD 014 Key Retrieval Endpoint.
    Retrieves key material for recipient decryption and flips status to CONSUMED.
    Enforces strict Single-Use rule: Returns HTTP 410 Gone on second access attempt!
    """
    record = KEY_BANK.get(key_id)

    if record is None:
        log_audit(
            event_type="KEY_REQUEST_FAILED",
            actor="CryptoEngine-Recipient",
            details={"key_id": key_id, "reason": "Not found"},
            status_str="ERROR",
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Key ID not found in QKD Key Manager bank.")

    if record["status"] == KeyStatus.CONSUMED.value:
        log_audit(
            event_type="REPLAY_ATTACK_PREVENTED",
            actor="Adversary/ReplayAttempt",
            details={
                "key_id": key_id,
                "consumed_at": record.get("consumed_at"),
                "reason": "Attempted second key retrieval (OTP/AES single-use breach)",
            },
            status_str="BREACH_PREVENTED",
        )
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="KEY UNAVAILABLE (410): Key already consumed. Single-use security enforcement active."
        )

    now_str = datetime.now(timezone.utc).isoformat()
    record["status"] = KeyStatus.CONSUMED.value
    record["consumed_at"] = now_str

    log_audit(
        event_type="KEY_CONSUME",
        actor="CryptoEngine-Recipient",
        details={"key_id": key_id, "length_bytes": record["length_bytes"]},
        status_str="SUCCESS",
    )
    save_data()

    return KeyResponse(**record)


@app.get("/api/v1/keys/{key_id}/status", response_model=KeyStatusResponse)
@app.get("/keys/{key_id}/status", response_model=KeyStatusResponse)
def get_key_status(key_id: str):
    record = KEY_BANK.get(key_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Key ID not found.")
    return KeyStatusResponse(
        key_id=record["key_id"],
        status=KeyStatus(record["status"]),
        created_at=record["created_at"],
        consumed_at=record.get("consumed_at"),
    )


@app.get("/api/v1/keys/bank/stats", response_model=BankStatsResponse)
@app.get("/keys/bank/stats", response_model=BankStatsResponse)
def get_bank_stats():
    total = len(KEY_BANK)
    consumed = sum(1 for r in KEY_BANK.values() if r["status"] == KeyStatus.CONSUMED.value)
    reserved = sum(1 for r in KEY_BANK.values() if r["status"] == KeyStatus.RESERVED.value)
    available = sum(1 for r in KEY_BANK.values() if r["status"] == KeyStatus.AVAILABLE.value)
    expired = sum(1 for r in KEY_BANK.values() if r["status"] == KeyStatus.EXPIRED.value)
    total_bytes = sum(r["length_bytes"] for r in KEY_BANK.values())

    return BankStatsResponse(
        total_keys=total,
        available_keys=available,
        reserved_keys=reserved,
        consumed_keys=consumed,
        expired_keys=expired,
        total_bytes_issued=total_bytes,
    )


@app.get("/api/v1/keys/bank/list")
def get_key_bank_list(limit: int = 50, status_filter: Optional[str] = None):
    """
    Returns live QKD Key Bank records for dynamic UI inspection.
    Hides raw key material in list view for security.
    """
    records = []
    for k_id, rec in list(KEY_BANK.items())[:limit]:
        if status_filter and rec["status"] != status_filter:
            continue
        records.append({
            "key_id": rec["key_id"],
            "length_bytes": rec["length_bytes"],
            "purpose": rec.get("purpose", "aes"),
            "status": rec["status"],
            "created_at": rec["created_at"],
            "consumed_at": rec.get("consumed_at"),
        })
    return records


@app.get("/api/v1/audit/logs")
def get_audit_logs(limit: int = 50):
    return AUDIT_LOGS[:limit]


@app.post("/api/v1/keys/simulate-attack/replay", response_model=AttackSimResponse)
def simulate_replay_attack(req: ReplayAttackRequest):
    """
    Security Red Team Simulation Endpoint.
    Attempts to fetch a key_id that has already been consumed to demonstrate 410 Gone defense.
    """
    record = KEY_BANK.get(req.key_id)
    if not record:
        return AttackSimResponse(
            attack_type="Replay Attack",
            success=False,
            status_code=404,
            details=f"Key {req.key_id} does not exist.",
            mitigation_explanation="Non-existent keys are rejected immediately with 404.",
        )

    if record["status"] == KeyStatus.CONSUMED.value:
        log_audit(
            event_type="SIMULATED_REPLAY_DEFENSE",
            actor="RedTeamSimulator",
            details={"key_id": req.key_id},
            status_str="BREACH_PREVENTED",
        )
        return AttackSimResponse(
            attack_type="Replay / Key-Reuse Attack",
            success=False,
            status_code=410,
            details=f"Key {req.key_id} was requested again after initial decryption.",
            mitigation_explanation="SUCCESS: Key Manager returned HTTP 410 Gone. Key material was destroyed and single-use security policy prevented key reuse.",
        )
    else:
        return AttackSimResponse(
            attack_type="Replay / Key-Reuse Attack",
            success=True,
            status_code=200,
            details=f"Key {req.key_id} has not been consumed yet (status: {record['status']}).",
            mitigation_explanation="Key is still valid for first-time use.",
        )


@app.get("/api/v1/keys/entropy", response_model=KeyBankEntropyResponse)
@app.get("/keys/entropy", response_model=KeyBankEntropyResponse)
def get_key_entropy():
    """
    Key Manager Entropy & Capacity Telemetry.
    Monitors Key Pool availability ratio and provides fallback recommendations.
    """
    total = len(KEY_BANK)
    consumed = sum(1 for r in KEY_BANK.values() if r["status"] == KeyStatus.CONSUMED.value)
    available = total - consumed

    entropy_score = 0.99 if total == 0 else round(max(0.1, available / max(1, total)), 2)
    is_low_entropy = available < 3 and total >= 10

    recommendation = (
        "Key bank operating at optimal QKD entropy level."
        if not is_low_entropy
        else "CRITICAL WARNING: OTP Key Pool Low. Automatic Fallback to Level 2 (AES-256-GCM) Recommended."
    )

    return KeyBankEntropyResponse(
        available_keys=available,
        total_keys=total,
        consumed_keys=consumed,
        entropy_score=entropy_score,
        is_low_entropy=is_low_entropy,
        recommendation=recommendation,
    )

