# Backend — Key Manager (KM) Service

## Tech stack

| Piece | Choice | Why |
|---|---|---|
| API framework | FastAPI (Python) | Fast to write, auto-generates OpenAPI docs, async-ready |
| Storage | In-memory dict for the demo; SQLite for anything persisted across restarts | Zero setup for a 20-min build; SQLite is a 1-line upgrade later |
| Crypto primitives | `cryptography` (hazmat) — `AESGCM`, `HKDF` | Industry-standard, audited library, not hand-rolled crypto |
| Random source | `secrets` / `os.urandom` | CSPRNG — never `random` module for key material |
| Transport | Plain HTTP for the demo (localhost only); **mutual TLS required before any real deployment** | Speed for the demo; call out the gap explicitly to faculty |

## API surface (ETSI GS QKD 014-shaped)

Real QKD KM APIs center on two operations: get a key, and get a previously-issued key by ID. QuMail's mock mirrors that shape.

### `POST /keys/generate`
Request:
```json
{ "length_bytes": 32, "purpose": "aes" }
```
Response:
```json
{ "key_id": "a1b2c3d4-...", "key_b64": "<base64 key material>", "status": "reserved" }
```
- `length_bytes`: 32 for AES-256 (Level 2), variable/message-length for OTP (Level 3).
- Marks the key `reserved` immediately — not `available` for reissue.

### `GET /keys/{key_id}`
Response (first call, by the intended recipient):
```json
{ "key_id": "a1b2c3d4-...", "key_b64": "<base64 key material>", "status": "consumed" }
```
- Flips status to `consumed` on first successful retrieval.
- **Second call to the same `key_id` must return `410 Gone`**, not the key again. This single behavior is what makes the single-use guarantee real instead of aspirational — test it explicitly in the demo.

### `GET /keys/{key_id}/status`
```json
{ "key_id": "a1b2c3d4-...", "status": "available | reserved | consumed" }
```
Useful for the client to check exhaustion before attempting a send.

### `GET /keys/bank/stats`
```json
{ "total": 100, "available": 63, "reserved": 2, "consumed": 35 }
```
Powers the "key exhaustion → fallback to Level 2" policy in the Crypto Engine.

## Data model

```
Key
├── key_id       (UUID, primary key)
├── material     (bytes, base64 in transit — never logged)
├── length_bytes (int)
├── status       (enum: available | reserved | consumed)
├── created_at   (timestamp)
└── consumed_at  (timestamp, nullable)
```

## Email message wire format

The only thing that changes about the email itself is a custom MIME part carrying metadata — the ciphertext replaces the body, nothing else about SMTP/IMAP changes.

```
Content-Type: application/qumail-enc
X-QuMail-Key-Id: a1b2c3d4-...
X-QuMail-Level: 2
X-QuMail-IV: <base64, Level 2 only>

<base64 ciphertext>
```

- `X-QuMail-Key-Id` and `X-QuMail-Level` are the **only** crypto-relevant metadata that travels with the email. No key material, ever.
- Level 1 messages skip this entirely — they're just normal email relying on provider TLS.

## Security-relevant implementation rules (non-negotiable, state these to reviewers)

1. Key material is never written to application logs.
2. Key material is never persisted client-side beyond the single encrypt/decrypt operation that consumes it.
3. The KM Service is the single source of truth for key state — clients must not locally cache "is this key still valid," they must ask.
4. All KM endpoints should sit behind mutual TLS + auth in anything beyond localhost demo — explicitly flagged as missing in the prototype, not silently skipped.
