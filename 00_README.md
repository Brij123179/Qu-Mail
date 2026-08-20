# QuMail — Quantum-Secured Email Client

**SIH 2026 | Theme: Blockchain & Cybersecurity | Category: Software**

This is the doc set for QuMail: what it is, why it matters, how it's built, and how to stand up a working prototype in ~20 minutes. Share this whole folder with your team — each file is self-contained but they build on each other in this order:

| File | What's in it | Read this if... |
|---|---|---|
| `00_README.md` | This file — goal, problem mapping, doc map | You're starting fresh |
| `01_ARCHITECTURE.md` | 4-layer system design, data flow diagram | You need the big picture / are explaining to faculty |
| `02_SECURITY.md` | Threat model, crypto per security level, key lifecycle, honest limitations | Faculty will grill you on security |
| `03_FEATURES.md` | Feature list, MVP vs stretch, mapped to problem statement | You're deciding what to build first |
| `04_BACKEND.md` | API spec for the Key Manager (KM), data models, tech stack | You're writing backend code |
| `05_PROTOTYPE_QUICKSTART.md` | Copy-paste code, runs in ~20 min | You want it running *now* |

---

## The problem, in one paragraph

Today's email (Gmail, Yahoo, Outlook) relies on RSA/ECC for key exchange. A sufficiently large quantum computer breaks both via Shor's algorithm. Adversaries are already running **"harvest now, decrypt later"** attacks — capturing encrypted traffic today to decrypt once quantum computers mature. Sensitive email (defense, banking, healthcare) sent today is already at risk, even though it's "secure" by today's standards.

## The goal, in one paragraph

QuMail retrofits **Quantum Key Distribution (QKD)-derived keys** onto standard email (IMAP/SMTP), so users keep Gmail/Yahoo but get quantum-resistant or quantum-unconditional confidentiality — with a security level they choose **per message**, from "same as today" up to "mathematically unbreakable, forever" (One-Time-Pad). It exposes the Key Manager through the industry-standard **ETSI GS QKD 014** REST API, so a real QKD hardware link can be swapped in later without rewriting the client.

## Why every design choice ties back to that goal

- **Standard IMAP/SMTP, not a new protocol** → adoption doesn't require the user to leave Gmail.
- **ETSI GS QKD 014-shaped KM API** → not a toy — it's the same interface real QKD vendors (ID Quantique, Toshiba) expose, so the mock is a drop-in placeholder, not throwaway code.
- **3 selectable levels, not 1** → acknowledges the real tradeoff between speed and security instead of pretending one setting fits every email.
- **Key ID + level travel in the header, key material never does** → the entire point of QKD is that the *key* never crosses a classical (interceptable) channel; QuMail's client-side design respects that even in simulation.

Everything else in this doc set is implementation detail in service of that.
