# Features

## MVP (build this for the demo — matches the 20-minute quickstart)

| Feature | Why it's MVP |
|---|---|
| 3 selectable security levels per message | This *is* the core idea — everything else supports it |
| Mock KM service with ETSI-shaped REST API | Proves the standards-compliance claim |
| Encrypt/decrypt round trip for all 3 levels | Proves the crypto actually works, not just diagrams |
| Key ID + level in a custom header, key never in body | The specific security property being demonstrated |
| Single-use enforcement on OTP keys | Prevents the most common OTP failure mode; easy to demo (try reusing a key, watch it get rejected) |
| CLI or minimal GUI showing send → encrypted transit → decrypt | Makes the "what does the ciphertext look like on the wire" moment visible to judges |

## Stretch goals (mention as roadmap, don't try to build in 20 min)

| Feature | What it adds |
|---|---|
| Real Gmail/Yahoo IMAP/SMTP + OAuth2 integration | Moves from simulated mailbox to real inboxes |
| PyQt5 desktop GUI | Polish, demo-friendliness |
| Attachment chunking for OTP mode | Handles files larger than a single key |
| Post-quantum KEM (Kyber) as a 4th pluggable level | Shows the crypto engine's extensibility claim isn't just words |
| Real QKD hardware adapter (e.g. ID Quantique SDK) behind the same KM interface | The actual "swap in real QKD" moment — the payoff of the layered design |
| Key-exhaustion dashboard / alerts | Operational maturity for a real deployment |

## Explicit non-goals (say these out loud to pre-empt questions)

- Not building a new email server or protocol — deliberately reusing SMTP/IMAP.
- Not encrypting metadata/headers — matches PGP/S-MIME precedent, not an oversight.
- Not shipping real QKD hardware integration in the hackathon build — architecture supports it, physical layer is future work.

## Mapping back to the problem statement

Every MVP feature above exists to demonstrate one of these three claims, which together *are* the problem statement:
1. **Quantum-safe today, without new infrastructure** → 3 levels + standard SMTP/IMAP.
2. **Standards-based, not proprietary** → ETSI GS QKD 014-shaped KM API.
3. **Extensible to real QKD hardware without redesign** → layered architecture, KM Interface as the only layer that would change.
