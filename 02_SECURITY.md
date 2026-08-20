# Security Model

This is the doc to lean on when explaining to someone with 15+ years in cybersecurity. Precision matters more than breadth here — say exactly what is and isn't provided, and don't oversell the prototype.

## Threat model

**In scope:**
- Passive eavesdropping on the SMTP/IMAP path (the email itself, in transit and at rest on mail servers).
- **Harvest-now-decrypt-later**: adversary stores ciphertext today, expects to break it once quantum computers mature.
- Key material leaking via the classical channel (the thing QKD is designed to prevent).

**Out of scope for the prototype (explicitly say this to faculty — it builds credibility, not weakness):**
- Endpoint compromise (malware on sender/recipient machine reading plaintext before encryption).
- Compromise of the email provider account itself (OAuth token theft, phishing).
- The actual quantum key distribution physical layer — in the prototype this is *simulated* by a classical mock server generating random keys locally. **This is the single most important caveat in the whole project: the demo does not perform real QKD.** It demonstrates the client architecture and API contract that *would* consume real QKD key material, using cryptographically secure randomness as a stand-in.
- Metadata (sender, recipient, subject, timing) — QuMail encrypts body/attachments, not headers, matching how S/MIME and PGP also behave by default.

## The 3 security levels — exact crypto

| Level | Name | Mechanism | Guarantee |
|---|---|---|---|
| 1 | No Quantum | Standard TLS (provider's existing transport encryption) | Same as normal email today — computationally secure, broken by future quantum computers |
| 2 | Quantum-aided AES | Key from KM → HKDF-SHA256 → AES-256-GCM | Computationally secure today; if the *key* came from real QKD, remains secure even against a quantum adversary, because AES-256 is quantum-resistant (Grover's algorithm only halves effective key strength, leaving 128-bit security) |
| 3 | Quantum OTP | Key from KM, length ≥ plaintext length → XOR (Vernam cipher) | **Information-theoretically secure** — unconditionally unbreakable regardless of adversary compute, *provided* the key is truly random, used exactly once, and kept secret |

**Key derivation for Level 2:** raw key material from the KM is passed through HKDF-SHA256 (RFC 5869) before use as an AES key — never used raw. This is standard practice: never consume KM output directly as a cipher key without a KDF step, since it decouples key-manager key format from cipher key requirements.

**OTP correctness conditions (state these explicitly — this is where most OTP claims fall apart under scrutiny):**
1. Key must be truly random (KM-sourced, not PRNG-seeded predictably) — in the prototype, `secrets`/`os.urandom`; in production, real QKD output.
2. Key must be **at least as long as the plaintext** — the prototype pads/chunks messages to key-bank-sized blocks.
3. Key must **never be reused** — the KM Service must mark a key "consumed" the instant it's issued and refuse to reissue it. This is the single most common way real-world OTP implementations fail (see: Venona project, where Soviet key reuse broke "unbreakable" ciphers).
4. Key must stay secret — this is the whole reason it travels only client↔KM, never client↔client over SMTP.

## Key lifecycle

```
generate → issued (marked reserved) → consumed by sender → consumed by recipient → retired
```

- Keys are single-use, single-message. A key is never issued twice.
- KM tracks state per key: `available → reserved → consumed`. `GET /keys/{id}` after `consumed` should fail closed — this is a deliberate design point, not an oversight, and worth stating out loud.
- Key exhaustion policy: if the OTP key bank runs low, the Crypto Engine **falls back to Level 2** (or blocks the send with a clear warning) rather than silently reusing a key. Silent reuse is the failure mode that actually breaks OTP in practice — call this out explicitly.

## What "quantum-secure" means here, precisely

QuMail does not claim to *perform* quantum key distribution. It claims to be **QKD-ready**: it consumes key material through an interface (ETSI GS QKD 014-shaped) that is API-compatible with real QKD hardware, and its cryptography (AES-256, true OTP) is chosen to remain secure *if* that key material actually came from a quantum channel. This distinction — architecture vs. physical layer — is the correct and defensible framing for a hackathon prototype, and stating it upfront preempts the most obvious pushback.

## Known limitations to state proactively

- No real QKD hardware in the demo (simulated key generation).
- No formal proof-of-work on the KM's own resistance to compromise — a real deployment would need the KM link itself hardened (mutual TLS, HSM-backed storage).
- Metadata (subject lines, sender/recipient) is not covered by the encryption scheme.
- No forward-secrecy guarantee beyond "each key is single-use" — that *is* the forward secrecy mechanism, but it should be named as such rather than assumed.
