#!/usr/bin/env python3
"""
QuMail CLI — Command-Line Interface for Quantum-Secured Email Platform
"""

import sys
import json
import argparse
import requests
from backend.config import KM_URL

BASE_URL = "http://127.0.0.1:8000/api/v1"


def send_cmd(args):
    payload = {
        "sender": args.sender,
        "recipient": args.to,
        "subject": args.subject,
        "body": args.body,
        "security_level": int(args.level),
    }
    try:
        res = requests.post(f"{BASE_URL}/email/send", json=payload, timeout=5)
        if res.status_code == 201:
            data = res.json()["data"]
            print(f"[+] Email Sent Successfully!")
            print(f"    From: {data['sender']} -> To: {data['recipient']}")
            print(f"    Security Level: {data['security_level']}")
            print(f"    Key ID: {data.get('key_id') or 'N/A (TLS)'}")
        else:
            print(f"[-] Send Failed ({res.status_code}): {res.text}")
    except Exception as e:
        print(f"[!] Network error: {e}")


def inbox_cmd(args):
    try:
        res = requests.get(f"{BASE_URL}/email/inbox/{args.user}", timeout=5)
        if res.status_code == 200:
            data = res.json()
            messages = data["messages"]
            print(f"\n===== INBOX FOR {data['user']} ({len(messages)} messages) =====")
            for i, m in enumerate(messages):
                print(f"\n[{i+1}] From: {m['sender']} | Subject: {m['subject']}")
                print(f"    Security Level: Level {m['security_level']}")
                print(f"    Key ID: {m.get('key_id') or 'None (TLS)'}")
                print(f"    Status: {m.get('decrypt_status')}")
                print(f"    Decrypted Content:\n    {m.get('decrypted_body')}")
                print("-" * 50)
        else:
            print(f"[-] Inbox fetch error ({res.status_code}): {res.text}")
    except Exception as e:
        print(f"[!] Network error: {e}")


def stats_cmd(args):
    try:
        res = requests.get(f"{BASE_URL}/dashboard/stats", timeout=5)
        if res.status_code == 200:
            print(json.dumps(res.json(), indent=2))
        else:
            print(f"[-] Stats error: {res.text}")
    except Exception as e:
        print(f"[!] Network error: {e}")


def replay_attack_cmd(args):
    try:
        res = requests.post(f"{BASE_URL}/keys/simulate-attack/replay", json={"key_id": args.key_id}, timeout=5)
        data = res.json()
        print(f"\n[+] Replay Attack Simulation Result:")
        print(f"    Attack Type: {data['attack_type']}")
        print(f"    HTTP Status Code: {data['status_code']}")
        print(f"    Details: {data['details']}")
        print(f"    Mitigation: {data['mitigation_explanation']}\n")
    except Exception as e:
        print(f"[!] Network error: {e}")


def main():
    parser = argparse.ArgumentParser(description="QuMail Command-Line Security Utility")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Send command
    send_parser = subparsers.add_parser("send", help="Send quantum encrypted email")
    send_parser.add_argument("--sender", required=True, help="Sender email address")
    send_parser.add_argument("--to", required=True, help="Recipient email address")
    send_parser.add_argument("--level", required=True, type=int, choices=[1, 2, 3, 4], help="Security Level (1-4)")
    send_parser.add_argument("--subject", default="QKD Message", help="Email subject")
    send_parser.add_argument("--body", required=True, help="Message body")

    # Inbox command
    inbox_parser = subparsers.add_parser("inbox", help="View and decrypt user inbox")
    inbox_parser.add_argument("--user", required=True, help="User email address")

    # Stats command
    subparsers.add_parser("stats", help="View QKD Key Manager & Email Telemetry")

    # Replay attack command
    replay_parser = subparsers.add_parser("test-replay", help="Test replay attack on single-use key")
    replay_parser.add_argument("--key-id", required=True, help="Target Key ID")

    args = parser.parse_args()

    if args.command == "send":
        send_cmd(args)
    elif args.command == "inbox":
        inbox_cmd(args)
    elif args.command == "stats":
        stats_cmd(args)
    elif args.command == "test-replay":
        replay_attack_cmd(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
