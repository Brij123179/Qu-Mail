# 20-Minute Prototype Quickstart

**This code has been run end-to-end and confirmed working** — all 3 security levels encrypt/decrypt correctly, and single-use key enforcement is verified (a replayed `key_id` correctly returns `410 Gone` and the message shows `KEY UNAVAILABLE`).

Scope: two local "users" (alice, bob) exchanging messages through a shared local mailbox file, with a real KM REST service doing real key issuance and real AES-256-GCM / real OTP encryption. This proves the crypto and the API contract. Real Gmail/IMAP integration is a stretch goal (see `03_FEATURES.md`) — swapping the mailbox simulation for `smtplib`/`imaplib` is a follow-up, not a redesign.

## Minute 0–5: setup

```bash
mkdir qumail_prototype && cd qumail_prototype
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install fastapi uvicorn cryptography requests
```

## Minute 5–10: the Key Manager service

Save as `km_server.py`:

```python
import base64
import secrets
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="QuMail Mock KM Service")
KEY_BANK = {}  # key_id -> record


class GenerateRequest(BaseModel):
    length_bytes: int = 32
    purpose: str = "aes"


@app.post("/keys/generate")
def generate_key(req: GenerateRequest):
    key_id = str(uuid.uuid4())
    material = secrets.token_bytes(req.length_bytes)
    KEY_BANK[key_id] = {
        "material": material, "status": "reserved",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    return {"key_id": key_id, "key_b64": base64.b64encode(material).decode(), "status": "reserved"}


@app.get("/keys/{key_id}")
def get_key(key_id: str):
    record = KEY_BANK.get(key_id)
    if record is None:
        raise HTTPException(status_code=404, detail="key not found")
    if record["status"] == "consumed":
        raise HTTPException(status_code=410, detail="key already consumed")
    record["status"] = "consumed"
    return {"key_id": key_id, "key_b64": base64.b64encode(record["material"]).decode(), "status": "consumed"}


@app.get("/keys/bank/stats")
def bank_stats():
    total = len(KEY_BANK)
    consumed = sum(1 for r in KEY_BANK.values() if r["status"] == "consumed")
    return {"total": total, "consumed": consumed, "available": total - consumed}
```

Run it in its own terminal and leave it running:
```bash
uvicorn km_server:app --port 8000
```

## Minute 10–17: the client (Crypto Engine + Email Protocol Layer, simplified)

Save as `qumail_client.py`:

```python
import base64, json, os, sys
import requests
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes

KM_URL = "http://127.0.0.1:8000"
MAILBOX_FILE = "mailbox.json"


def load_mailbox():
    return json.load(open(MAILBOX_FILE)) if os.path.exists(MAILBOX_FILE) else []


def save_mailbox(mailbox):
    json.dump(mailbox, open(MAILBOX_FILE, "w"), indent=2)


def derive_aes_key(raw_key):
    return HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b"qumail-level2").derive(raw_key)


def send_message(sender, recipient, msg, level):
    plaintext = msg.encode()
    mailbox = load_mailbox()

    if level == 1:  # No Quantum — relies on transport TLS
        mailbox.append({"from": sender, "to": recipient, "level": 1,
                         "body_b64": base64.b64encode(plaintext).decode()})

    elif level == 2:  # Quantum-aided AES
        r = requests.post(f"{KM_URL}/keys/generate", json={"length_bytes": 32}).json()
        aes_key = derive_aes_key(base64.b64decode(r["key_b64"]))
        iv = os.urandom(12)
        ct = AESGCM(aes_key).encrypt(iv, plaintext, None)
        mailbox.append({"from": sender, "to": recipient, "level": 2, "key_id": r["key_id"],
                         "iv_b64": base64.b64encode(iv).decode(), "body_b64": base64.b64encode(ct).decode()})

    elif level == 3:  # Quantum OTP
        r = requests.post(f"{KM_URL}/keys/generate", json={"length_bytes": len(plaintext)}).json()
        otp_key = base64.b64decode(r["key_b64"])
        ct = bytes(p ^ k for p, k in zip(plaintext, otp_key))
        mailbox.append({"from": sender, "to": recipient, "level": 3, "key_id": r["key_id"],
                         "body_b64": base64.b64encode(ct).decode()})

    save_mailbox(mailbox)
    print(f"Sent (level {level}) from {sender} to {recipient}.")


def read_inbox(user):
    for i, m in enumerate(load_mailbox()):
        if m["to"] != user:
            continue
        ct = base64.b64decode(m["body_b64"])
        level = m["level"]

        if level == 1:
            plaintext = ct
        else:
            r = requests.get(f"{KM_URL}/keys/{m['key_id']}")
            if r.status_code != 200:
                print(f"[{i}] level {level} msg: KEY UNAVAILABLE ({r.status_code}) — {r.json()['detail']}")
                continue
            key = base64.b64decode(r.json()["key_b64"])
            if level == 2:
                plaintext = AESGCM(derive_aes_key(key)).decrypt(base64.b64decode(m["iv_b64"]), ct, None)
            else:  # level 3
                plaintext = bytes(c ^ k for c, k in zip(ct, key))

        print(f"[{i}] from={m['from']} level={level} -> {plaintext.decode(errors='replace')}")


if __name__ == "__main__":
    if sys.argv[1] == "send":
        _, _, sender, recipient, msg, level = sys.argv
        send_message(sender, recipient, msg, int(level))
    elif sys.argv[1] == "inbox":
        read_inbox(sys.argv[2])
```

## Minute 17–20: run the demo

In a second terminal (KM server still running in the first):

```bash
python3 qumail_client.py send alice bob "hello level 1" 1
python3 qumail_client.py send alice bob "hello level 2 AES" 2
python3 qumail_client.py send alice bob "hello level 3 OTP" 3
python3 qumail_client.py inbox bob
```

Expected output:
```
[0] from=alice level=1 -> hello level 1
[1] from=alice level=2 -> hello level 2 AES
[2] from=alice level=3 -> hello level 3 OTP
```

**The demo moment that lands with security-experienced faculty:** run `inbox bob` a second time. Levels 2 and 3 now show `KEY UNAVAILABLE (410) — key already consumed` while level 1 still displays fine. That's single-use key enforcement working live, not claimed in a slide.

Also worth showing: open `mailbox.json` and point out that for levels 2/3 the file contains only `key_id` and ciphertext — never key material. That's the entire security argument, visible on disk.

## If you have extra time

- `curl http://127.0.0.1:8000/keys/bank/stats` — show live key bank consumption.
- Visit `http://127.0.0.1:8000/docs` — FastAPI auto-generates interactive API docs, useful for walking faculty through the KM contract live.
- Swap `MAILBOX_FILE`-based transport for real `smtplib`/`imaplib` against a Gmail app-password account — the Crypto Engine code above doesn't change at all, only `send_message`/`read_inbox`'s I/O does. That's the layered-architecture payoff, demonstrable in real time if asked.
