from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class KeyStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    CONSUMED = "consumed"
    EXPIRED = "expired"


class GenerateKeyRequest(BaseModel):
    length_bytes: int = Field(default=32, description="Key length in bytes (32 for AES-256, variable for OTP)")
    purpose: str = Field(default="aes", description="Target cipher purpose (aes, otp, pqc)")
    slave_sa_id: Optional[str] = Field(default=None, description="ETSI GS QKD 014 Slave SA Identifier")


class KeyResponse(BaseModel):
    key_id: str
    key_b64: str
    length_bytes: int
    status: KeyStatus
    purpose: str
    created_at: str
    consumed_at: Optional[str] = None


class KeyStatusResponse(BaseModel):
    key_id: str
    status: KeyStatus
    created_at: str
    consumed_at: Optional[str] = None


class BankStatsResponse(BaseModel):
    total_keys: int
    available_keys: int
    reserved_keys: int
    consumed_keys: int
    expired_keys: int
    total_bytes_issued: int


class SendEmailRequest(BaseModel):
    sender: str = Field(..., json_schema_extra={"example": "alice@qumail.sec"})
    recipient: str = Field(..., json_schema_extra={"example": "bob@qumail.sec"})
    subject: str = Field(default="Quantum Encrypted Message", json_schema_extra={"example": "QKD Status Update"})
    body: str = Field(..., json_schema_extra={"example": "This email body is protected by QKD keys."})
    security_level: int = Field(default=2, ge=1, le=4, description="Security Level (1: TLS, 2: AES-GCM, 3: OTP, 4: PQC)")
    attachments: Optional[List[Dict[str, str]]] = Field(default_factory=list, description="List of base64 attachments")


class EmailAttachment(BaseModel):
    filename: str
    content_type: str = "application/octet-stream"
    data_b64: str
    key_id: Optional[str] = None
    iv_b64: Optional[str] = None


class KeyBankEntropyResponse(BaseModel):
    available_keys: int
    total_keys: int
    consumed_keys: int
    entropy_score: float
    is_low_entropy: bool
    recommendation: str


class TransportMode(str, Enum):
    LOCAL_STORAGE = "local_storage"
    REAL_SMTP_IMAP = "real_smtp_imap"


class TransportConfigRequest(BaseModel):
    mode: TransportMode = TransportMode.LOCAL_STORAGE
    smtp_host: Optional[str] = Field(default="smtp.gmail.com", description="SMTP server host")
    smtp_port: Optional[int] = Field(default=587, description="SMTP server port (587 for TLS, 465 for SSL)")
    smtp_user: Optional[str] = Field(default=None, description="SMTP authentication username/email")
    smtp_password: Optional[str] = Field(default=None, description="SMTP app password or OAuth token")
    use_tls: bool = True
    imap_host: Optional[str] = Field(default="imap.gmail.com", description="IMAP server host")
    imap_port: Optional[int] = Field(default=993, description="IMAP server port")


class EmailMessage(BaseModel):
    id: str
    timestamp: str
    sender: str
    recipient: str
    subject: str
    security_level: int
    key_id: Optional[str] = None
    iv_b64: Optional[str] = None
    body_b64: str
    attachments: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    headers: Dict[str, str]
    is_read: bool = False


class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    event_type: str  # KEY_GENERATE, KEY_CONSUME, KEY_REJECTED_REPLAY, EMAIL_SENT, EMAIL_READ, TAMPER_DETECTED
    actor: str
    details: Dict[str, Any]
    status: str  # SUCCESS, WARN, BREACH_PREVENTED, ERROR


class ReplayAttackRequest(BaseModel):
    key_id: str


class AttackSimResponse(BaseModel):
    attack_type: str
    success: bool
    status_code: int
    details: str
    mitigation_explanation: str
