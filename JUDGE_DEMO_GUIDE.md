# QuMail — Judge & Faculty Presentation Demo Guide

Use this script to deliver a **high-impact, 3-to-5 minute live demonstration** to hackathon judges, technical experts, and faculty evaluators.

---

## 🎙️ Step 0: The 30-Second Elevator Pitch

> *"Good morning/afternoon, judges. Traditional email relies on RSA and ECC for key exchange. With quantum computing maturing, adversaries are running **'Harvest Now, Decrypt Later'** attacks — recording encrypted email traffic today to decrypt once quantum computers arrive.*
>
> *__QuMail solves this today without replacing Gmail or Outlook.__ It retrofits **QKD (Quantum Key Distribution)** derived keys onto standard IMAP/SMTP email. It exposes an industry-standard **ETSI GS QKD 014 REST API**, allowing users to choose their security level per message — up to **unconditionally unbreakable One-Time Pad (OTP)**. Let me show you how it works live."*

---

## 🖥️ Phase 1: Web Dashboard & Standards Compliance (1 Minute)

1. Open **`http://127.0.0.1:8000`** in your browser.
2. Point to the top telemetry badges:
   - **ETSI GS QKD 014 REST: ONLINE**: Highlight that the Key Manager exposes the exact standard used by QKD hardware vendors (ID Quantique, Toshiba). The mock server is an architectural placeholder, not throwaway code.
   - **Single-Use Enforcement: ACTIVE**: Highlight that state management prevents key reuse.

---

## ✉️ Phase 2: Live Message Composition & Decryption (1 Minute)

1. Under **Quantum Email Composer**:
   - Sender: `alice@qumail.sec`
   - Recipient: `bob@qumail.sec`
   - Select **L3 (OTP Vernam)** level.
   - Body: `"Top Secret Defense Payload — QKD Link Active"`
2. Click **🔒 Encrypt & Send Email**.
3. **What to call out to judges**:
   > *"Notice the popup gave us a Key ID (`UUID`). Crucially, **the secret key material never entered the email body or headers**. Only the `Key-ID` and `Level` ride in the MIME headers. The key material stays securely inside the Key Manager."*
4. Under **Secure Mailbox Inbox**, select **User: Bob**.
5. Show Bob's inbox displaying:
   - `[Level 3] Top Secret Defense Payload — QKD Link Active`
   - Status: `SUCCESS`.

---

## 🔥 Phase 3: The "Mic Drop" Security Moment — Replay Attack Defense (1.5 Minutes)

*This is the single most important part of the demo that proves deep cybersecurity engineering.*

1. Under **Red Team & Replay Attack Tester**, paste the **Key ID** generated from Bob's email (or click **Execute Replay Attack**).
2. The UI / terminal will return:
   ```http
   HTTP/1.1 410 GONE
   Detail: KEY UNAVAILABLE (410): Key already consumed. Single-use security enforcement active.
   ```
3. **What to say to judges**:
   > *"Why did this return **410 Gone**? In real-world crypto, the primary way One-Time Pad (OTP) fails is **key reuse** — as seen historically in the Venona project. QuMail's Key Manager acts as the authoritative statekeeper: the exact millisecond Bob fetched the key to decrypt his email, the Key Manager burned that key. Any adversary attempting a replay attack or intercepted fetch receives HTTP 410 Gone. The key is destroyed forever."*

---

## 🛡️ Phase 4: AEAD Ciphertext Tamper Defense (30 Seconds)

1. In Bob's inbox, locate a Level 2 (AES-256-GCM) message.
2. Click **⚡ Test Tamper Attack**.
3. Point out the error message: `AEAD Integrity Check Failed! Ciphertext or headers have been tampered with.`
4. **What to say to judges**:
   > *"Level 2 uses AES-256-GCM with HKDF-SHA256 derivation. We bind the Key ID, Sender, and Recipient directly into the AEAD Associated Data (AAD). If a man-in-the-middle flips even a single bit in transit, GCM tag verification aborts decryption immediately."*

---

## 📑 Phase 5: OpenAPI Standard & Automated Test Suite (1 Minute)

1. Open **`http://127.0.0.1:8000/docs`** in a new tab.
   - Show the live OpenAPI Swagger UI for ETSI GS QKD 014 `/api/v1/keys/generate` and `/api/v1/keys/{key_id}` endpoints.
2. Open terminal in `e:\SIH_2026` and run live test suite:
   ```bash
   python -m pytest tests/test_qumail.py -v
   ```
3. Show all **6 passed unit tests** executing in < 1 second.

---

## 🎯 Quick CLI Backup Command Line (If Judges Ask for Terminal Demo)

If judges prefer terminal:
```bash
# 1. Send Level 3 OTP Email
python qumail_cli.py send --sender alice@qumail.sec --to bob@qumail.sec --level 3 --subject "Defense Directive" --body "Classified Code 99"

# 2. Read Inbox (First time - Decrypts payload)
python qumail_cli.py inbox --user bob@qumail.sec

# 3. Test Replay Attack (Second time - Shows HTTP 410 Gone defense)
python qumail_cli.py test-replay --key-id <KEY_ID_FROM_STEP_1>
```
