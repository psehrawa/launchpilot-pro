#!/usr/bin/env python3
"""
Find emails for pool companies using Hunter API.
Then import to LaunchPilot Pro.
"""

import csv
import json
import os
import requests
from pathlib import Path

HUNTER_API_KEY = "572a16a7bcc8450aa525747da00373b827ae4af3"

def find_email(domain: str, first_name: str = None, last_name: str = None):
    """Find email using Hunter API."""
    if first_name and last_name:
        # Email finder (specific person)
        url = f"https://api.hunter.io/v2/email-finder?domain={domain}&first_name={first_name}&last_name={last_name}&api_key={HUNTER_API_KEY}"
    else:
        # Domain search (find any emails)
        url = f"https://api.hunter.io/v2/domain-search?domain={domain}&api_key={HUNTER_API_KEY}"
    
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if "data" in data:
            if "email" in data["data"]:
                return data["data"]["email"], data["data"].get("confidence", 0)
            elif "emails" in data["data"] and data["data"]["emails"]:
                # Get the first email with highest confidence
                emails = sorted(data["data"]["emails"], key=lambda x: x.get("confidence", 0), reverse=True)
                best = emails[0]
                return best["value"], best.get("confidence", 0)
        return None, 0
    except Exception as e:
        print(f"Error finding email for {domain}: {e}")
        return None, 0

def process_companies(csv_path: str):
    """Process CSV of companies and find emails."""
    results = []
    
    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            company = row["company"]
            domain = row["domain"]
            city = row["city"]
            state = row["state"]
            
            print(f"Finding email for {company} ({domain})...")
            email, confidence = find_email(domain)
            
            result = {
                "company": company,
                "domain": domain,
                "city": city,
                "state": state,
                "email": email,
                "confidence": confidence,
            }
            results.append(result)
            
            if email:
                print(f"  Found: {email} (confidence: {confidence}%)")
            else:
                print(f"  No email found")
    
    # Save results
    output_path = Path(csv_path).parent / "pool-companies-with-emails.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    
    # Also save as CSV for import
    csv_output = Path(csv_path).parent / "pool-companies-import.csv"
    with open(csv_output, "w") as f:
        f.write("email,first_name,last_name,company,title\n")
        for r in results:
            if r["email"]:
                f.write(f"{r['email']},,,{r['company']},Owner\n")
    
    found = len([r for r in results if r["email"]])
    print(f"\n✅ Found {found}/{len(results)} emails")
    print(f"Results saved to: {output_path}")
    print(f"Import CSV saved to: {csv_output}")
    
    return results

if __name__ == "__main__":
    # Process batch 2
    csv_path = Path(__file__).parent / "pool-companies-batch2.csv"
    if csv_path.exists():
        process_companies(str(csv_path))
    else:
        print(f"File not found: {csv_path}")
