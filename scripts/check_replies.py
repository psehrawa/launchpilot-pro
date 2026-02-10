#!/usr/bin/env python3
"""
Check for replies to sent emails and update LaunchPilot tracking.
Run periodically via cron or manually.
"""

import json
import os
import subprocess
import requests
from datetime import datetime, timedelta

LAUNCHPILOT_URL = os.environ.get("LAUNCHPILOT_URL", "https://launchpilot-pro.vercel.app")

def get_sent_emails():
    """Get list of emails we sent from LaunchPilot."""
    try:
        response = requests.get(
            f"{LAUNCHPILOT_URL}/api/campaigns/stats?days=30",
            timeout=10,
        )
        data = response.json()
        if data.get("success"):
            return data.get("emails", [])
    except Exception as e:
        print(f"Error fetching sent emails: {e}")
    return []

def check_gmail_replies(sent_emails: list):
    """Check Gmail for replies to our sent emails."""
    # Get recent inbox messages
    result = subprocess.run(
        ["gog", "gmail", "search", "in:inbox newer_than:7d", "--max", "50", "--json"],
        capture_output=True,
        text=True,
    )
    
    if result.returncode != 0:
        print(f"Error searching Gmail: {result.stderr}")
        return []
    
    try:
        messages = json.loads(result.stdout)
    except:
        # Try parsing line by line
        messages = []
        for line in result.stdout.strip().split("\n"):
            if line:
                try:
                    messages.append(json.loads(line))
                except:
                    pass
    
    # Find replies to our sent emails
    replies = []
    sent_to = {email.get("to_email", "").lower() for email in sent_emails if email.get("to_email")}
    
    for msg in messages:
        from_email = msg.get("from", "").lower()
        # Check if this is from someone we emailed
        for sent_email in sent_to:
            if sent_email in from_email:
                replies.append({
                    "from": from_email,
                    "subject": msg.get("subject", ""),
                    "date": msg.get("date", ""),
                    "snippet": msg.get("snippet", ""),
                })
                break
    
    return replies

def mark_as_replied(email_address: str):
    """Mark email as replied in LaunchPilot."""
    try:
        response = requests.post(
            f"{LAUNCHPILOT_URL}/api/campaigns/mark-replied",
            json={"email": email_address},
            timeout=10,
        )
        return response.json()
    except Exception as e:
        print(f"Error marking reply: {e}")
        return None

def main():
    print("🔍 Checking for replies...")
    
    # Get sent emails
    sent_emails = get_sent_emails()
    print(f"📧 Found {len(sent_emails)} sent emails in last 30 days")
    
    if not sent_emails:
        print("No sent emails to check.")
        return
    
    # Check for replies
    replies = check_gmail_replies(sent_emails)
    
    if replies:
        print(f"\n🎉 Found {len(replies)} replies!\n")
        for reply in replies:
            print(f"  From: {reply['from']}")
            print(f"  Subject: {reply['subject']}")
            print(f"  Date: {reply['date']}")
            print(f"  Preview: {reply['snippet'][:100]}...")
            print()
            
            # Mark as replied
            mark_as_replied(reply['from'])
    else:
        print("No replies found yet. Keep following up!")

if __name__ == "__main__":
    main()
