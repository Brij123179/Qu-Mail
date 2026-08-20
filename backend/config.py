import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# Service Configuration
HOST = os.getenv("QUMAIL_HOST", "127.0.0.1")
PORT = int(os.getenv("QUMAIL_PORT", "8000"))
KM_URL = f"http://{HOST}:{PORT}/api/v1"

# Storage Files
MAILBOX_FILE = DATA_DIR / "mailbox.json"
AUDIT_LOG_FILE = DATA_DIR / "audit_log.json"
KEY_BANK_FILE = DATA_DIR / "key_bank.json"

# Cryptographic & Security Rules
DEFAULT_AES_KEY_BYTES = 32  # 256-bit AES
HKDF_INFO_LABEL = b"qumail-etsi-qkd-v1"
KEY_DEFAULT_TTL_SECONDS = 3600  # 1 hour expiration for unconsumed keys

# Security Level Definitions
SECURITY_LEVELS = {
    1: {
        "name": "Level 1: No Quantum (TLS Transport Only)",
        "mechanism": "Standard Transport TLS Encryption",
        "guarantee": "Computationally secure today; vulnerable to future quantum computers (Shor's Algorithm).",
        "quantum_safe": False,
    },
    2: {
        "name": "Level 2: Quantum-Aided AES-256-GCM",
        "mechanism": "ETSI QKD Key -> HKDF-SHA256 -> AES-256-GCM AEAD",
        "guarantee": "Computationally secure. Grover's algorithm halves key strength leaving 128-bit quantum security floor.",
        "quantum_safe": True,
    },
    3: {
        "name": "Level 3: Quantum One-Time Pad (Vernam OTP)",
        "mechanism": "ETSI QKD Key (Length >= Message) -> Vernam XOR Cipher",
        "guarantee": "Information-theoretically secure. Unconditionally unbreakable provided single-use key constraint holds.",
        "quantum_safe": True,
    },
    4: {
        "name": "Level 4: Post-Quantum Kyber Hybrid",
        "mechanism": "Simulated ML-KEM / Kyber-768 + AES-256-GCM AEAD",
        "guarantee": "NIST PQC Standardized Post-Quantum Hybrid Encryption for future-proof transport.",
        "quantum_safe": True,
    }
}
