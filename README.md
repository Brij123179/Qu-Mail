# 🔐 QuMail — Quantum-Secured Email Platform

> **SIH 2026 | Theme: Blockchain & Cybersecurity | Category: Software**  
> **ETSI GS QKD 014 Compliant Quantum Key Distribution (QKD) Retrofit Email System**

[![Live Demo](https://img.shields.io/badge/Vercel-Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://qu-mail-seven.vercel.app)
[![ETSI Standard](https://img.shields.io/badge/Standard-ETSI_GS_QKD_014_v1.1.1-0284c7?style=for-the-badge)](https://www.etsi.org/deliver/etsi_gs/QKD/001_099/014/01.01.01_60/gs_QKD014v010101p.pdf)
[![Python](https://img.shields.io/badge/Backend-FastAPI_Python_3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 🚀 Live Demo & Presentation Links

* 🌐 **Live Web Application**: [https://qu-mail-seven.vercel.app](https://qu-mail-seven.vercel.app)
* 🐙 **GitHub Repository**: [https://github.com/Brij123179/Qu-Mail](https://github.com/Brij123179/Qu-Mail)
* 📖 **OpenAPI / Swagger Spec**: [https://qu-mail-seven.vercel.app/docs](https://qu-mail-seven.vercel.app/docs)

---

## ⚡ The Problem: "Harvest Now, Decrypt Later"

Traditional email protocols (Gmail, Outlook, Yahoo) rely on **RSA** and **Elliptic Curve Cryptography (ECC)** for key exchange. With quantum computing maturing, adversaries are conducting **"Harvest Now, Decrypt Later"** attacks—recording encrypted email traffic today to decrypt instantaneously once quantum computers running Shor's algorithm emerge. Sensitive defense intelligence, financial transactions, and corporate IP sent today are already compromised in storage.

## 🛡️ The Solution: QuMail

**QuMail retrofits Quantum Key Distribution (QKD) key material onto standard IMAP/SMTP email infrastructure without replacing existing mail servers.**

QuMail exposes an industry-standard **ETSI GS QKD 014 REST API**, allowing users to choose their security level per message—from standard transport security up to **information-theoretically unbreakable One-Time Pad (OTP)**.

---

## 🔒 4 Tiered Security Levels

| Level | Name | Mechanism | Security Guarantee |
| :---: | :--- | :--- | :--- |
| **L1** | **Standard TLS** | Provider Transport Layer Security | Standard email confidentiality (Vulnerable to quantum harvest) |
| **L2** | **Quantum AES** | QKD Key $\rightarrow$ HKDF-SHA256 $\rightarrow$ AES-256-GCM | Quantum-resistant symmetric encryption (Grover-resistant, 128-bit quantum security) |
| **L3** | **Quantum OTP** | QKD Key (length $\ge$ message) $\rightarrow$ Vernam XOR Cipher | **Information-Theoretically Unbreakable** (Shannon perfect secrecy) |
| **L4** | **PQC Hybrid** | NIST ML-KEM-768 (Kyber-768) + QKD Dual Key | Post-Quantum Lattice Cryptography + QKD Hybrid Protection |

---

## 🌟 Key Features

* 📁 **Encrypted File Attachments**: Encrypt documents (`PDF`, `PNG`, `DOCX`, `ZIP`) with QKD key material and download decrypted files upon reception.
* 👥 **Multi-Recipient Quantum Group Encryption**: Supports comma-separated recipients (`bob@qumail.sec, charlie@qumail.sec`), issuing distinct single-use key IDs per recipient.
* 🚨 **Eve Red Team Adversary Console**: Switch to Eve (`eve@adversary.sec`) to execute live attack simulations:
  1. *Harvest Now Decrypt Later Attack* (Shor's algorithm simulation)
  2. *Replay Key Stealing Attack* (**HTTP 410 Gone** Key Burned defense)
  3. *AEAD Transit Bit-Flip Attack* (AEAD tag verification abort)
* 🚨 **Key Bank Entropy Telemetry**: Monitors Key Manager entropy and automatically recommends Level 2 fallback if OTP key reserves run low.
* 📄 **Exportable ETSI GS QKD 014 Compliance Audit Certificate**: One-click printable HTML/JSON audit reports for regulatory and defense compliance.

---

## ⚙️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│ 1. Web / Client Layer (React 19 Dashboard & CLI)        │ ── Compose, Select Security Level, Inbox
├─────────────────────────────────────────────────────────┤
│ 2. Email Protocol Layer (IMAP / SMTP Engine)            │ ── Delivers email over standard mail servers
├─────────────────────────────────────────────────────────┤
│ 3. Crypto Engine (Strategy Pattern)                     │ ── L1 (TLS), L2 (AES-256-GCM), L3 (OTP Vernam), L4 (PQC)
├─────────────────────────────────────────────────────────┤
│ 4. Key Manager (KM) REST Client                         │ ── Standard ETSI GS QKD 014 REST API
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
           ┌──────────────────────────────────┐
           │ Key Manager (ETSI GS QKD 014 API) │
           └──────────────────────────────────┘
```

> **Core Architectural Property**: The secret key material **never travels in the email body or headers**. Only the `Key-ID` (UUID) and `Security-Level` ride in the MIME headers. The recipient fetches the key out-of-band directly from the Key Manager.

---

## 🛠️ Quickstart: How to Run Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Brij123179/Qu-Mail.git
cd Qu-Mail
pip install -r requirements.txt
npm --prefix frontend install
```

### 2. Run Unified Web Server & API
```bash
python -m backend.main
```
Open **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser!

### 3. Run Automated Unit Test Suite
```bash
python -m pytest tests/test_qumail.py -v
```

### 4. CLI Execution
```bash
# Send Level 3 (OTP) Email
python qumail_cli.py send --sender alice@qumail.sec --to bob@qumail.sec --level 3 --subject "Top Secret Directive" --body "Operation QuMail Code 99"

# View Bob's Inbox
python qumail_cli.py inbox --user bob@qumail.sec

# Test Replay Attack Defense (Returns HTTP 410 Gone)
python qumail_cli.py test-replay --key-id <KEY_ID_FROM_STEP_1>
```

---

## 📚 Technical Documentation

* 📖 [`01_ARCHITECTURE.md`](01_ARCHITECTURE.md) — 4-Layer System Architecture & Sequence Diagrams
* 🛡️ [`02_SECURITY.md`](02_SECURITY.md) — Cryptographic Threat Model & OTP Formal Proof
* 🏆 [`JUDGE_DEMO_GUIDE.md`](JUDGE_DEMO_GUIDE.md) — 5-Minute Hackathon Demo Script & Q&A Cheat Sheet
* 📜 [`QUMAIL_MASTER_DOCUMENTATION.md`](QUMAIL_MASTER_DOCUMENTATION.md) — Complete Project Documentation Set

---

## 📜 Standards & Compliance

* **ETSI GS QKD 014 v1.1.1**: Quantum Key Distribution Key Delivery Interface REST API.
* **RFC 5869**: HKDF (HMAC-based Extract-and-Expand Key Derivation Function).
* **NIST FIPS 197 / SP 800-38D**: AES-256-GCM Galois/Counter Mode Authenticated Encryption.
* **NIST FIPS 203**: ML-KEM (Module-Lattice-Based Key-Encapsulation Mechanism).

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
