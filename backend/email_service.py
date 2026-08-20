import json
import os
import smtplib
import imaplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from backend.config import MAILBOX_FILE
from backend.crypto_engine import CryptoEngine, CryptoEngineError
from backend.models import SendEmailRequest, TransportConfigRequest, TransportMode


class EmailService:
    def __init__(self, crypto_engine: Optional[CryptoEngine] = None):
        self.crypto = crypto_engine or CryptoEngine()
        self.transport_config = {
            "mode": TransportMode.LOCAL_STORAGE.value,
            "smtp_host": "smtp.gmail.com",
            "smtp_port": 587,
            "smtp_user": None,
            "smtp_password": None,
            "use_tls": True,
            "imap_host": "imap.gmail.com",
            "imap_port": 993,
        }
        self._inmemory_mailbox: List[Dict[str, Any]] = []
        self._ensure_mailbox_file()
        # In-memory cache for decrypted messages to prevent repeated polling key requests
        self._decrypted_cache: Dict[str, Dict[str, Any]] = {}

    def _seed_default_messages(self) -> List[Dict[str, Any]]:
        seed_requests = [
            SendEmailRequest(
                sender="alice@qumail.sec",
                recipient="bob@qumail.sec",
                subject="TOP SECRET DEFENSE DIRECTIVE: OPERATION QUMAIL-2026",
                body="OPERATION QUMAIL-2026: Quantum Optical Key Exchange Active on Dark Fiber link node 014.",
                security_level=3,
            ),
            SendEmailRequest(
                sender="alice@qumail.sec",
                recipient="bob@qumail.sec",
                subject="ETSI GS QKD 014 Key Manager Synchronization",
                body="Key Manager node synchronized across Slave SA ID 014. Single-use key burn rule enforced.",
                security_level=2,
            ),
            SendEmailRequest(
                sender="alice@qumail.sec",
                recipient="bob@qumail.sec",
                subject="Kyber-768 Post-Quantum Hybrid Test",
                body="NIST ML-KEM-768 lattice key encapsulation verified. Dual key quantum-resistant transport active.",
                security_level=4,
            ),
            SendEmailRequest(
                sender="alice@qumail.sec",
                recipient="bob@qumail.sec",
                subject="Routine Cybersecurity Audit Report",
                body="Monthly system health telemetry report generated. All QKD optical nodes operating normally.",
                security_level=1,
            ),
            SendEmailRequest(
                sender="eve@adversary.sec",
                recipient="bob@qumail.sec",
                subject="Red Team Intercept Signal",
                body="Eavesdropped ciphertext packet captured in transit. Testing single-use key HTTP 410 defense.",
                security_level=3,
            ),
        ]
        seeded = []
        for req in seed_requests:
            try:
                msg = self.send_email(req)
                seeded.append(msg)
            except Exception:
                pass
        return seeded

    def _ensure_mailbox_file(self):
        try:
            if not MAILBOX_FILE.exists():
                with open(MAILBOX_FILE, "w") as f:
                    json.dump([], f)
        except Exception as e:
            print(f"Warning: Cannot create mailbox file: {e}")

    def set_transport_config(self, config: TransportConfigRequest) -> Dict[str, Any]:
        self.transport_config.update(config.model_dump())
        return self.transport_config

    def get_transport_config(self) -> Dict[str, Any]:
        cfg = dict(self.transport_config)
        if cfg.get("smtp_password"):
            cfg["smtp_password"] = "******"
        return cfg

    def _load_mailbox(self) -> List[Dict[str, Any]]:
        disk_data = []
        try:
            if MAILBOX_FILE.exists():
                with open(MAILBOX_FILE, "r") as f:
                    disk_data = json.load(f)
        except Exception:
            disk_data = []

        all_msgs = []
        for m in self._inmemory_mailbox + disk_data:
            if not any(a["id"] == m["id"] for a in all_msgs):
                all_msgs.append(m)

        if not all_msgs:
            all_msgs = self._seed_default_messages()

        return all_msgs

    def _save_mailbox(self, mailbox: List[Dict[str, Any]]):
        self._inmemory_mailbox = mailbox
        try:
            with open(MAILBOX_FILE, "w") as f:
                json.dump(mailbox, f, indent=2)
        except Exception as e:
            print(f"Warning: Mailbox file persistence error: {e}")

    def _send_via_real_smtp(self, req: SendEmailRequest, enc_res: Dict[str, Any], msg_record: Dict[str, Any]):
        cfg = self.transport_config
        if not cfg.get("smtp_user") or not cfg.get("smtp_password"):
            raise ValueError("SMTP Credentials missing. Please configure username and password.")

        mime_msg = MIMEMultipart()
        mime_msg["From"] = req.sender
        mime_msg["To"] = req.recipient
        mime_msg["Subject"] = f"[QuMail L{req.security_level}] {req.subject}"
        mime_msg["X-QuMail-Level"] = str(req.security_level)
        if enc_res.get("key_id"):
            mime_msg["X-QuMail-Key-Id"] = enc_res["key_id"]
        if enc_res.get("iv_b64"):
            mime_msg["X-QuMail-IV"] = enc_res["iv_b64"]

        body_part = MIMEText(enc_res["body_b64"], "plain")
        mime_msg.attach(body_part)

        with smtplib.SMTP(cfg["smtp_host"], cfg["smtp_port"], timeout=10) as server:
            if cfg.get("use_tls"):
                server.starttls()
            server.login(cfg["smtp_user"], cfg["smtp_password"])
            server.sendmail(req.sender, [req.recipient], mime_msg.as_string())

    def _fetch_via_real_imap(self, user: str) -> List[Dict[str, Any]]:
        cfg = self.transport_config
        if not cfg.get("smtp_user") or not cfg.get("smtp_password"):
            return []
        try:
            with imaplib.IMAP4_SSL(cfg["imap_host"], cfg["imap_port"], timeout=10) as imap:
                imap.login(cfg["smtp_user"], cfg["smtp_password"])
                imap.select("INBOX")
                status, messages = imap.search(None, 'HEADER X-QuMail-Level "1"', 'HEADER X-QuMail-Level "2"', 'HEADER X-QuMail-Level "3"', 'HEADER X-QuMail-Level "4"')
                if status != "OK" or not messages[0]:
                    return []
                imap_msgs = []
                for num in messages[0].split()[-5:]:  # fetch last 5
                    _, data = imap.fetch(num, "(RFC822)")
                    raw_email = data[0][1]
                    parsed = email.message_from_bytes(raw_email)
                    imap_msgs.append({
                        "id": str(uuid.uuid4()),
                        "timestamp": parsed.get("Date", datetime.now(timezone.utc).isoformat()),
                        "sender": parsed.get("From", "unknown"),
                        "recipient": parsed.get("To", user),
                        "subject": parsed.get("Subject", "IMAP Quantum Mail"),
                        "security_level": int(parsed.get("X-QuMail-Level", "1")),
                        "key_id": parsed.get("X-QuMail-Key-Id"),
                        "iv_b64": parsed.get("X-QuMail-IV"),
                        "body_b64": parsed.get_payload() if not parsed.is_multipart() else "",
                        "headers": dict(parsed.items()),
                        "is_read": False,
                        "transport": "real_smtp_imap",
                    })
                return imap_msgs
        except Exception:
            return []

    def send_email(self, req: SendEmailRequest) -> Dict[str, Any]:
        # Handle multi-recipients split by comma
        recipients = [r.strip() for r in req.recipient.split(",") if r.strip()]
        if not recipients:
            recipients = [req.recipient]

        sent_records = []
        for rcpt in recipients:
            enc_res = self.crypto.encrypt(
                plaintext=req.body,
                security_level=req.security_level,
                sender=req.sender,
                recipient=rcpt,
            )

            # Encrypt attachments per recipient
            enc_attachments = []
            if req.attachments:
                for att in req.attachments:
                    enc_att = self.crypto.encrypt_attachment(
                        attachment=att,
                        security_level=req.security_level,
                        sender=req.sender,
                        recipient=rcpt,
                    )
                    enc_attachments.append(enc_att)

            msg_id = str(uuid.uuid4())
            now_str = datetime.now(timezone.utc).isoformat()

            headers = enc_res["headers"]
            headers["From"] = req.sender
            headers["To"] = rcpt
            headers["Subject"] = req.subject
            headers["Date"] = now_str

            msg_record = {
                "id": msg_id,
                "timestamp": now_str,
                "sender": req.sender,
                "recipient": rcpt,
                "subject": req.subject,
                "security_level": req.security_level,
                "key_id": enc_res["key_id"],
                "iv_b64": enc_res["iv_b64"],
                "body_b64": enc_res["body_b64"],
                "attachments": enc_attachments,
                "headers": headers,
                "is_read": False,
                "transport": self.transport_config["mode"],
            }

            if self.transport_config["mode"] == TransportMode.REAL_SMTP_IMAP.value:
                try:
                    self._send_via_real_smtp(req, enc_res, msg_record)
                    msg_record["smtp_status"] = "SENT_OVER_INTERNET_SMTP"
                except Exception as e:
                    msg_record["smtp_status"] = f"SMTP_FAILED: {e}"

            mailbox = self._load_mailbox()
            mailbox.insert(0, msg_record)
            self._save_mailbox(mailbox)
            sent_records.append(msg_record)

        return sent_records[0]

    def get_inbox(self, user: str) -> List[Dict[str, Any]]:
        """
        Retrieves messages destined for user.
        Uses in-memory cache to prevent repeated polling key requests for already-processed messages.
        """
        mailbox = self._load_mailbox()

        # If real IMAP is enabled, merge fetched emails
        if self.transport_config["mode"] == TransportMode.REAL_SMTP_IMAP.value:
            imap_msgs = self._fetch_via_real_imap(user)
            for im in imap_msgs:
                if not any(m["id"] == im["id"] for m in mailbox):
                    mailbox.insert(0, im)

        user_msgs = []

        for m in mailbox:
            if m["recipient"].lower() != user.lower() and m["sender"].lower() != user.lower() and user != "all":
                continue

            msg_id = m["id"]
            # Check if this message was already decrypted and cached
            if msg_id in self._decrypted_cache:
                user_msgs.append(dict(self._decrypted_cache[msg_id]))
                continue

            msg_copy = dict(m)
            # Decrypt body first time
            try:
                plaintext, is_tampered = self.crypto.decrypt(
                    body_b64=m["body_b64"],
                    security_level=m["security_level"],
                    key_id=m.get("key_id"),
                    iv_b64=m.get("iv_b64"),
                    sender=m["sender"],
                    recipient=m["recipient"],
                )
                msg_copy["decrypted_body"] = plaintext
                msg_copy["decrypt_status"] = "SUCCESS"
                msg_copy["error_detail"] = None

                # Decrypt attachments if present
                dec_atts = []
                if m.get("attachments"):
                    for att in m["attachments"]:
                        try:
                            dec_att = self.crypto.decrypt_attachment(
                                att=att,
                                security_level=m["security_level"],
                                sender=m["sender"],
                                recipient=m["recipient"],
                            )
                            dec_atts.append(dec_att)
                        except Exception as ae:
                            dec_atts.append({
                                "filename": att.get("filename", "error.bin"),
                                "content_type": att.get("content_type", "application/octet-stream"),
                                "data_b64": "",
                                "error": str(ae),
                            })
                msg_copy["decrypted_attachments"] = dec_atts

            except CryptoEngineError as ce:
                msg_copy["decrypted_body"] = f"[DECRYPTION FAILED / KEY UNAVAILABLE]: {ce}"
                msg_copy["decrypt_status"] = "KEY_UNAVAILABLE_OR_TAMPERED"
                msg_copy["error_detail"] = str(ce)
                msg_copy["decrypted_attachments"] = []
            except Exception as e:
                msg_copy["decrypted_body"] = f"[DECRYPTION ERROR]: {e}"
                msg_copy["decrypt_status"] = "ERROR"
                msg_copy["error_detail"] = str(e)
                msg_copy["decrypted_attachments"] = []

            # Cache the result for background polling
            self._decrypted_cache[msg_id] = msg_copy
            user_msgs.append(msg_copy)

        return user_msgs

    def get_message_by_id(self, msg_id: str) -> Optional[Dict[str, Any]]:
        mailbox = self._load_mailbox()
        for m in mailbox:
            if m["id"] == msg_id:
                return m
        if msg_id in self._decrypted_cache:
            return self._decrypted_cache[msg_id]
        for m in self._inmemory_mailbox:
            if m["id"] == msg_id:
                return m
        return None
