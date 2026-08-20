import base64
import os
import requests
from typing import Tuple, Dict, Any, Optional

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from backend.config import KM_URL, HKDF_INFO_LABEL


class CryptoEngineError(Exception):
    """Custom exception raised for cryptographic errors or security policy failures."""
    pass


class CryptoEngine:
    def __init__(self, km_url: str = KM_URL, http_client: Optional[Any] = None):
        self.km_url = km_url.rstrip("/")
        self.http_client = http_client or requests

    def _post(self, path: str, json_data: dict):
        url = f"{self.km_url}{path}"
        if hasattr(self.http_client, "post"):
            return self.http_client.post(url, json=json_data)
        return requests.post(url, json=json_data, timeout=5)

    def _get(self, path: str):
        url = f"{self.km_url}{path}"
        if hasattr(self.http_client, "get"):
            return self.http_client.get(url)
        return requests.get(url, timeout=5)

    def _derive_aes_key(self, raw_key: bytes) -> bytes:
        """
        Derives a 256-bit AES key from QKD raw key material using HKDF-SHA256 (RFC 5869).
        Decouples key-manager output format from cipher requirements.
        """
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=HKDF_INFO_LABEL,
        )
        return hkdf.derive(raw_key)

    def encrypt(
        self,
        plaintext: str,
        security_level: int,
        sender: str,
        recipient: str,
    ) -> Dict[str, Any]:
        """
        Encrypts a message payload based on the selected security level (1, 2, 3, or 4).
        Returns metadata headers and base64 ciphertext.
        """
        payload_bytes = plaintext.encode("utf-8")

        if security_level == 1:
            # Level 1: Standard TLS / No payload encryption
            return {
                "level": 1,
                "key_id": None,
                "iv_b64": None,
                "body_b64": base64.b64encode(payload_bytes).decode("utf-8"),
                "headers": {
                    "Content-Type": "text/plain; charset=utf-8",
                    "X-QuMail-Level": "1",
                },
            }

        elif security_level == 2:
            # Level 2: Quantum-aided AES-256-GCM + HKDF-SHA256
            try:
                res = self._post("/keys/generate", {"length_bytes": 32, "purpose": "aes_gcm_256"})
                if hasattr(res, "raise_for_status"):
                    res.raise_for_status()
                key_data = res.json()
            except Exception as e:
                raise CryptoEngineError(f"Failed to fetch AES key from QKD Key Manager: {e}")

            key_id = key_data["key_id"]
            raw_key = base64.b64decode(key_data["key_b64"])
            aes_key = self._derive_aes_key(raw_key)
            iv = os.urandom(12)  # 96-bit CSPRNG IV for GCM

            # Bind metadata in Associated Data for AEAD integrity
            associated_data = f"{key_id}:{sender}:{recipient}:level2".encode("utf-8")

            aesgcm = AESGCM(aes_key)
            ciphertext = aesgcm.encrypt(iv, payload_bytes, associated_data)

            return {
                "level": 2,
                "key_id": key_id,
                "iv_b64": base64.b64encode(iv).decode("utf-8"),
                "body_b64": base64.b64encode(ciphertext).decode("utf-8"),
                "headers": {
                    "Content-Type": "application/qumail-enc",
                    "X-QuMail-Key-Id": key_id,
                    "X-QuMail-Level": "2",
                    "X-QuMail-IV": base64.b64encode(iv).decode("utf-8"),
                },
            }

        elif security_level == 3:
            # Level 3: Quantum One-Time Pad (Vernam OTP)
            msg_length = len(payload_bytes)
            if msg_length == 0:
                raise CryptoEngineError("Cannot encrypt empty payload with One-Time Pad.")

            try:
                res = self._post("/keys/generate", {"length_bytes": msg_length, "purpose": "vernam_otp"})
                if hasattr(res, "raise_for_status"):
                    res.raise_for_status()
                key_data = res.json()
            except Exception as e:
                raise CryptoEngineError(f"Failed to fetch OTP key from QKD Key Manager: {e}")

            key_id = key_data["key_id"]
            otp_key = base64.b64decode(key_data["key_b64"])

            if len(otp_key) < msg_length:
                raise CryptoEngineError(
                    f"OTP Violation: Key length ({len(otp_key)}) is smaller than plaintext length ({msg_length})."
                )

            # Vernam XOR Cipher (Information-theoretically secure)
            ciphertext = bytes(p ^ k for p, k in zip(payload_bytes, otp_key))

            return {
                "level": 3,
                "key_id": key_id,
                "iv_b64": None,
                "body_b64": base64.b64encode(ciphertext).decode("utf-8"),
                "headers": {
                    "Content-Type": "application/qumail-enc",
                    "X-QuMail-Key-Id": key_id,
                    "X-QuMail-Level": "3",
                },
            }

        elif security_level == 4:
            # Level 4: Post-Quantum Kyber Hybrid (ML-KEM-768 simulation)
            try:
                res = self._post("/keys/generate", {"length_bytes": 32, "purpose": "pqc_kyber_hybrid"})
                if hasattr(res, "raise_for_status"):
                    res.raise_for_status()
                key_data = res.json()
            except Exception as e:
                raise CryptoEngineError(f"Failed to fetch PQC key from Key Manager: {e}")

            key_id = key_data["key_id"]
            raw_key = base64.b64decode(key_data["key_b64"])
            pqc_derived_key = self._derive_aes_key(raw_key)

            iv = os.urandom(12)
            associated_data = f"PQC-KYBER-768:{key_id}".encode("utf-8")

            aesgcm = AESGCM(pqc_derived_key)
            ciphertext = aesgcm.encrypt(iv, payload_bytes, associated_data)

            # Prefix with simulated Kyber encapsulated payload header
            kyber_capsule = b"KYBER768-KEM-HEADER:" + ciphertext

            return {
                "level": 4,
                "key_id": key_id,
                "iv_b64": base64.b64encode(iv).decode("utf-8"),
                "body_b64": base64.b64encode(kyber_capsule).decode("utf-8"),
                "headers": {
                    "Content-Type": "application/qumail-pqc-hybrid",
                    "X-QuMail-Key-Id": key_id,
                    "X-QuMail-Level": "4",
                    "X-QuMail-IV": base64.b64encode(iv).decode("utf-8"),
                },
            }

        else:
            raise CryptoEngineError(f"Invalid security level: {security_level}")

    def decrypt(
        self,
        body_b64: str,
        security_level: int,
        key_id: Optional[str],
        iv_b64: Optional[str],
        sender: str,
        recipient: str,
    ) -> Tuple[str, bool]:
        """
        Decrypts an incoming message.
        Returns Tuple[plaintext, is_tampered_or_error].
        """
        raw_ciphertext = base64.b64decode(body_b64)

        if security_level == 1:
            # Plaintext TLS level
            return raw_ciphertext.decode("utf-8", errors="replace"), False

        if not key_id:
            raise CryptoEngineError("Key ID is missing in email header for encrypted message.")

        # Fetch key from KM (Flips state to CONSUMED or raises 410 if already consumed)
        try:
            res = self._get(f"/keys/{key_id}")
            if res.status_code == 410:
                raise CryptoEngineError("KEY UNAVAILABLE (410): Key already consumed. Replay attack prevented.")
            elif res.status_code != 200:
                raise CryptoEngineError(f"Key Manager returned error HTTP {res.status_code}: {res.text}")
            
            key_data = res.json()
            raw_key = base64.b64decode(key_data["key_b64"])
        except CryptoEngineError:
            raise
        except Exception as e:
            raise CryptoEngineError(f"Failed to retrieve QKD key material for ID {key_id}: {e}")

        if security_level == 2:
            if not iv_b64:
                raise CryptoEngineError("IV is missing in header for Level 2 AES message.")
            iv = base64.b64decode(iv_b64)
            aes_key = self._derive_aes_key(raw_key)
            associated_data = f"{key_id}:{sender}:{recipient}:level2".encode("utf-8")

            try:
                aesgcm = AESGCM(aes_key)
                plaintext_bytes = aesgcm.decrypt(iv, raw_ciphertext, associated_data)
                return plaintext_bytes.decode("utf-8", errors="replace"), False
            except Exception:
                raise CryptoEngineError("AEAD Integrity Check Failed! Ciphertext or headers have been tampered with.")

        elif security_level == 3:
            # Vernam OTP XOR Decryption
            if len(raw_ciphertext) != len(raw_key):
                raise CryptoEngineError("OTP Decryption Error: Ciphertext length does not match QKD key length.")
            plaintext_bytes = bytes(c ^ k for c, k in zip(raw_ciphertext, raw_key))
            return plaintext_bytes.decode("utf-8", errors="replace"), False

        elif security_level == 4:
            if not iv_b64:
                raise CryptoEngineError("IV is missing in header for Level 4 PQC message.")
            iv = base64.b64decode(iv_b64)
            if not raw_ciphertext.startswith(b"KYBER768-KEM-HEADER:"):
                raise CryptoEngineError("PQC Kyber Capsule header corrupted.")
            actual_ct = raw_ciphertext[len(b"KYBER768-KEM-HEADER:"):]
            pqc_key = self._derive_aes_key(raw_key)
            associated_data = f"PQC-KYBER-768:{key_id}".encode("utf-8")

            try:
                aesgcm = AESGCM(pqc_key)
                plaintext_bytes = aesgcm.decrypt(iv, actual_ct, associated_data)
                return plaintext_bytes.decode("utf-8", errors="replace"), False
            except Exception:
                raise CryptoEngineError("PQC Hybrid AEAD Decryption Failure!")

        else:
            raise CryptoEngineError(f"Unsupported security level: {security_level}")

    def encrypt_attachment(self, attachment: Dict[str, str], security_level: int, sender: str, recipient: str) -> Dict[str, Any]:
        """Encrypts an email attachment using the specified security level."""
        filename = attachment.get("filename", "attachment.bin")
        content_type = attachment.get("content_type", "application/octet-stream")
        raw_b64 = attachment.get("data_b64", "")
        raw_bytes = base64.b64decode(raw_b64)

        if security_level == 1 or len(raw_bytes) == 0:
            return {
                "filename": filename,
                "content_type": content_type,
                "data_b64": raw_b64,
                "key_id": None,
                "iv_b64": None,
            }

        # Encrypt attachment bytes with QKD key
        enc_res = self.encrypt(
            plaintext=base64.b64encode(raw_bytes).decode("utf-8"),
            security_level=security_level,
            sender=sender,
            recipient=recipient,
        )

        return {
            "filename": filename,
            "content_type": content_type,
            "data_b64": enc_res["body_b64"],
            "key_id": enc_res.get("key_id"),
            "iv_b64": enc_res.get("iv_b64"),
        }

    def decrypt_attachment(self, att: Dict[str, Any], security_level: int, sender: str, recipient: str) -> Dict[str, Any]:
        """Decrypts an encrypted attachment."""
        filename = att.get("filename", "attachment.bin")
        content_type = att.get("content_type", "application/octet-stream")

        if security_level == 1 or not att.get("key_id"):
            return {
                "filename": filename,
                "content_type": content_type,
                "data_b64": att.get("data_b64", ""),
            }

        decrypted_b64, _ = self.decrypt(
            body_b64=att["data_b64"],
            security_level=security_level,
            key_id=att.get("key_id"),
            iv_b64=att.get("iv_b64"),
            sender=sender,
            recipient=recipient,
        )

        return {
            "filename": filename,
            "content_type": content_type,
            "data_b64": decrypted_b64,
        }

