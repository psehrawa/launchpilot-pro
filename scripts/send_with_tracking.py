#!/usr/bin/env python3
"""
Send emails via Gmail with LaunchPilot Pro tracking.
Usage: python send_with_tracking.py --to email@example.com --subject "Hi" --body "Message"
"""

import argparse
import json
import os
import subprocess
import requests
from datetime import datetime

LAUNCHPILOT_URL = os.environ.get("LAUNCHPILOT_URL", "https://launchpilot-pro.vercel.app")

def register_email(to: str, subject: str, body: str, gmail_message_id: str = None):
    """Register email in LaunchPilot for tracking."""
    try:
        response = requests.post(
            f"{LAUNCHPILOT_URL}/api/campaigns/track-send",
            json={
                "to": to,
                "subject": subject,
                "body": body,
                "gmail_message_id": gmail_message_id,
            },
            timeout=10,
        )
        return response.json()
    except Exception as e:
        print(f"Warning: Could not register tracking: {e}")
        return None

def add_tracking_pixel(body: str, pixel_url: str) -> str:
    """Add invisible tracking pixel to email body."""
    # For plain text, we can't add pixel - would need HTML
    return body

def send_email(to: str, subject: str, body: str, track: bool = True):
    """Send email via gog and optionally track."""
    
    tracking_info = None
    if track:
        # Pre-register to get tracking ID
        tracking_info = register_email(to, subject, body)
        if tracking_info and tracking_info.get("success"):
            print(f"📊 Tracking ID: {tracking_info['tracking_id']}")
    
    # Send via gog
    cmd = [
        "gog", "gmail", "send",
        "--to", to,
        "--subject", subject,
        "--body-file", "-"
    ]
    
    result = subprocess.run(
        cmd,
        input=body.encode(),
        capture_output=True,
        text=False,
    )
    
    if result.returncode != 0:
        print(f"❌ Failed to send: {result.stderr.decode()}")
        return False
    
    output = result.stdout.decode()
    print(f"✅ Sent to {to}")
    
    # Parse gmail message ID from output
    for line in output.split("\n"):
        if "message_id" in line:
            parts = line.split("\t")
            if len(parts) >= 2:
                gmail_id = parts[1].strip()
                print(f"   Gmail ID: {gmail_id}")
                # Update tracking with Gmail ID
                if tracking_info and tracking_info.get("success"):
                    # Could update the record here
                    pass
    
    return True

def send_batch(csv_file: str, subject: str, body_template: str):
    """Send batch emails from CSV."""
    import csv
    
    with open(csv_file, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row.get("email")
            if not email:
                continue
            
            # Personalize body
            body = body_template
            for key, value in row.items():
                body = body.replace(f"{{{{{key}}}}}", value or "")
            
            # Personalize subject
            subj = subject
            for key, value in row.items():
                subj = subj.replace(f"{{{{{key}}}}}", value or "")
            
            send_email(email, subj, body)
            print("---")

def main():
    parser = argparse.ArgumentParser(description="Send tracked emails")
    parser.add_argument("--to", help="Recipient email")
    parser.add_argument("--subject", help="Email subject")
    parser.add_argument("--body", help="Email body")
    parser.add_argument("--body-file", help="File containing email body")
    parser.add_argument("--csv", help="CSV file for batch send")
    parser.add_argument("--no-track", action="store_true", help="Disable tracking")
    
    args = parser.parse_args()
    
    if args.csv:
        body = args.body or open(args.body_file).read()
        send_batch(args.csv, args.subject, body)
    elif args.to and args.subject:
        body = args.body
        if args.body_file:
            with open(args.body_file) as f:
                body = f.read()
        send_email(args.to, args.subject, body, track=not args.no_track)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
