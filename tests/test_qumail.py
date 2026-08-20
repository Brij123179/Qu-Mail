import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.crypto_engine import CryptoEngine, CryptoEngineError
from backend.email_service import EmailService
from backend.models import SendEmailRequest

client = TestClient(app)


def test_km_generate_and_single_use_enforcement():
    # 1. Generate key
    res = client.post("/api/v1/keys/generate", json={"length_bytes": 32, "purpose": "aes_gcm"})
    assert res.status_code == 201
    data = res.json()
    key_id = data["key_id"]
    assert data["status"] == "reserved"

    # 2. First key retrieval (recipient decrypt) -> Should succeed
    res_get1 = client.get(f"/api/v1/keys/{key_id}")
    assert res_get1.status_code == 200
    data_get1 = res_get1.json()
    assert data_get1["status"] == "consumed"

    # 3. Second key retrieval (replay attempt) -> MUST return 410 Gone
    res_get2 = client.get(f"/api/v1/keys/{key_id}")
    assert res_get2.status_code == 410
    assert "already consumed" in res_get2.json()["detail"]


def test_crypto_engine_level1_tls():
    crypto = CryptoEngine(http_client=client)
    enc = crypto.encrypt("Hello TLS", security_level=1, sender="alice", recipient="bob")
    assert enc["level"] == 1
    assert enc["key_id"] is None

    dec, tampered = crypto.decrypt(
        body_b64=enc["body_b64"],
        security_level=1,
        key_id=None,
        iv_b64=None,
        sender="alice",
        recipient="bob",
    )
    assert dec == "Hello TLS"
    assert tampered is False


def test_crypto_engine_level2_aes_gcm():
    crypto = CryptoEngine(http_client=client)
    enc = crypto.encrypt("Top Secret Level 2 Payload", security_level=2, sender="alice", recipient="bob")
    assert enc["level"] == 2
    assert enc["key_id"] is not None
    assert enc["iv_b64"] is not None

    # First Decryption -> Success
    dec, tampered = crypto.decrypt(
        body_b64=enc["body_b64"],
        security_level=2,
        key_id=enc["key_id"],
        iv_b64=enc["iv_b64"],
        sender="alice",
        recipient="bob",
    )
    assert dec == "Top Secret Level 2 Payload"

    # Second Decryption -> Key already consumed (410)
    with pytest.raises(CryptoEngineError) as exc_info:
        crypto.decrypt(
            body_b64=enc["body_b64"],
            security_level=2,
            key_id=enc["key_id"],
            iv_b64=enc["iv_b64"],
            sender="alice",
            recipient="bob",
        )
    assert "KEY UNAVAILABLE (410)" in str(exc_info.value)


def test_crypto_engine_level3_vernam_otp():
    crypto = CryptoEngine(http_client=client)
    msg = "Quantum Unbreakable OTP Payload 12345"
    enc = crypto.encrypt(msg, security_level=3, sender="alice", recipient="bob")
    assert enc["level"] == 3
    assert enc["key_id"] is not None

    # First Decryption -> Success
    dec, tampered = crypto.decrypt(
        body_b64=enc["body_b64"],
        security_level=3,
        key_id=enc["key_id"],
        iv_b64=None,
        sender="alice",
        recipient="bob",
    )
    assert dec == msg

    # Replay Attempt -> Must fail with 410
    with pytest.raises(CryptoEngineError) as exc_info:
        crypto.decrypt(
            body_b64=enc["body_b64"],
            security_level=3,
            key_id=enc["key_id"],
            iv_b64=None,
            sender="alice",
            recipient="bob",
        )
    assert "KEY UNAVAILABLE (410)" in str(exc_info.value)


def test_crypto_engine_level4_pqc_kyber():
    crypto = CryptoEngine(http_client=client)
    msg = "Post-Quantum Kyber-768 Hybrid Encryption"
    enc = crypto.encrypt(msg, security_level=4, sender="alice", recipient="bob")
    assert enc["level"] == 4

    dec, tampered = crypto.decrypt(
        body_b64=enc["body_b64"],
        security_level=4,
        key_id=enc["key_id"],
        iv_b64=enc["iv_b64"],
        sender="alice",
        recipient="bob",
    )
    assert dec == msg


def test_email_service_send_and_inbox():
    crypto = CryptoEngine(http_client=client)
    service = EmailService(crypto_engine=crypto)
    req = SendEmailRequest(
        sender="charlie@qumail.sec",
        recipient="dave@qumail.sec",
        subject="Automated Test Subject",
        body="Automated Test Body Content",
        security_level=2,
    )
    sent_msg = service.send_email(req)
    assert sent_msg["subject"] == "Automated Test Subject"

    # Fetch inbox for Dave
    inbox = service.get_inbox("dave@qumail.sec")
    assert len(inbox) >= 1
    target = next(m for m in inbox if m["id"] == sent_msg["id"])
    assert target["decrypted_body"] == "Automated Test Body Content"
    assert target["decrypt_status"] == "SUCCESS"


def test_key_entropy_endpoint():
    res = client.get("/api/v1/keys/entropy")
    assert res.status_code == 200
    data = res.json()
    assert "entropy_score" in data
    assert "is_low_entropy" in data
    assert "recommendation" in data


def test_multi_recipient_send():
    crypto = CryptoEngine(http_client=client)
    service = EmailService(crypto_engine=crypto)
    req = SendEmailRequest(
        sender="alice@qumail.sec",
        recipient="bob@qumail.sec, charlie@qumail.sec",
        subject="Broadcast Directive",
        body="Group Classified Payload",
        security_level=3,
    )
    sent_msg = service.send_email(req)
    assert sent_msg["recipient"] == "bob@qumail.sec"

    bob_inbox = service.get_inbox("bob@qumail.sec")
    charlie_inbox = service.get_inbox("charlie@qumail.sec")
    assert any(m["decrypted_body"] == "Group Classified Payload" for m in bob_inbox)
    assert any(m["decrypted_body"] == "Group Classified Payload" for m in charlie_inbox)


def test_attachment_encryption_and_decryption():
    crypto = CryptoEngine(http_client=client)
    service = EmailService(crypto_engine=crypto)
    sample_b64 = "SGVsbG8gUXVhbnR1bSBBdHRhY2htZW50IQ=="  # "Hello Quantum Attachment!"
    req = SendEmailRequest(
        sender="alice@qumail.sec",
        recipient="bob@qumail.sec",
        subject="Attachment Test",
        body="Message with attachment",
        security_level=2,
        attachments=[{
            "filename": "secret.txt",
            "content_type": "text/plain",
            "data_b64": sample_b64,
        }]
    )
    sent_msg = service.send_email(req)
    assert len(sent_msg["attachments"]) == 1
    assert sent_msg["attachments"][0]["key_id"] is not None

    inbox = service.get_inbox("bob@qumail.sec")
    target = next(m for m in inbox if m["id"] == sent_msg["id"])
    assert len(target["decrypted_attachments"]) == 1
    assert target["decrypted_attachments"][0]["data_b64"] == sample_b64


def test_export_audit_report():
    res = client.get("/api/v1/audit/export?format=json")
    assert res.status_code == 200
    data = res.json()
    assert data["standard_compliance"] == "ETSI GS QKD 014 v1.1.1"

    res_html = client.get("/api/v1/audit/export?format=html")
    assert res_html.status_code == 200
    assert "Compliance Audit Certificate" in res_html.text


def test_harvest_attack_simulation():
    crypto = CryptoEngine(http_client=client)
    service = EmailService(crypto_engine=crypto)

    # L1 email -> harvest attack succeeds (exposed plaintext)
    msg_l1 = service.send_email(SendEmailRequest(sender="alice@qumail.sec", recipient="eve@qumail.sec", subject="L1 Test", body="Plaintext Exposed", security_level=1))
    res_l1 = client.post(f"/api/v1/attack/harvest-sim?msg_id={msg_l1['id']}")
    assert res_l1.status_code == 200
    assert res_l1.json()["success"] is True

    # L3 email -> harvest attack blocked (OTP unbreakable)
    msg_l3 = service.send_email(SendEmailRequest(sender="alice@qumail.sec", recipient="eve@qumail.sec", subject="L3 Test", body="OTP Unbreakable Payload", security_level=3))
    res_l3 = client.post(f"/api/v1/attack/harvest-sim?msg_id={msg_l3['id']}")
    assert res_l3.status_code == 200
    assert res_l3.json()["success"] is False
    assert "INFORMATION-THEORETICALLY UNBREAKABLE" in res_l3.json()["details"]


