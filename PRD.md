# LaunchPilot Pro — Product Requirements Document

## Vision
The most affordable, AI-powered lead generation and outreach platform for startups and SMBs.

**Tagline:** "Find leads. Verify emails. Close deals."

## Target Market
- **Primary:** Solo founders, early-stage startups, indie hackers
- **Secondary:** SMB sales teams (1-10 people)
- **Pain:** Apollo/Lemlist/Instantly are expensive ($99-299/mo); most only need basic features

## Competitive Landscape

| Product | Price | Gap |
|---------|-------|-----|
| Apollo.io | $49-99/mo | Complex, enterprise-focused |
| Lemlist | $59-99/mo | Email-only, no lead finding |
| Instantly.ai | $37-97/mo | No CRM, just sending |
| Smartlead | $39-94/mo | Technical setup required |
| Hunter.io | $49-399/mo | No sequences/campaigns |

**Our positioning:** All-in-one platform at indie prices ($19-49/mo)

## Core Features (MVP)

### 1. Lead Discovery
- [ ] Company search (by industry, size, location)
- [ ] Domain → email finder
- [ ] LinkedIn profile import (manual paste)
- [ ] CSV import/export
- [ ] Chrome extension (later)

### 2. Email Enrichment
- [ ] Multi-provider email finding (Hunter, Snov, Clearout, Apollo)
- [ ] Email verification (deliverability check)
- [ ] Catch-all detection
- [ ] Bounce risk scoring

### 3. Contact Management (CRM-lite)
- [ ] Contact database with search/filter
- [ ] Tags and segments
- [ ] Notes and activity log
- [ ] Pipeline stages (Lead → Contacted → Replied → Meeting → Won/Lost)
- [ ] Bulk actions

### 4. Outreach Campaigns
- [ ] Email sequence builder (multi-step)
- [ ] Personalization variables ({{firstName}}, {{company}}, etc.)
- [ ] A/B testing subject lines
- [ ] Send scheduling (timezone-aware)
- [ ] Auto follow-up on no reply
- [ ] Reply detection (pause sequence)

### 5. Email Sending
- [ ] Connect your own SMTP/Gmail/Outlook
- [ ] Built-in sending (Resend/Postmark)
- [ ] Warmup integration (optional)
- [ ] Daily sending limits
- [ ] Bounce handling

### 6. Analytics
- [ ] Campaign performance (sent, opened, clicked, replied)
- [ ] Best time to send insights
- [ ] A/B test results
- [ ] Pipeline analytics
- [ ] Team leaderboard (if multi-user)

### 7. Templates
- [ ] Pre-built email templates by use case
- [ ] AI template generator
- [ ] Template library (save/share)
- [ ] Snippet shortcuts

### 8. Settings & Admin
- [ ] User profile
- [ ] Team management (invite users)
- [ ] Billing (Stripe)
- [ ] API keys management
- [ ] Integrations (Zapier, webhooks)

## Tech Stack

```
Frontend:     Next.js 14 (App Router) + TypeScript
UI:           Tailwind CSS + shadcn/ui
Auth:         Supabase Auth (magic link + OAuth)
Database:     Supabase PostgreSQL
Storage:      Supabase Storage (attachments)
Email Send:   Resend (transactional) + SMTP relay
Enrichment:   Hunter, Snov, Clearout, Apollo APIs
Payments:     Stripe (subscriptions)
Analytics:    PostHog or Plausible
Hosting:      Vercel
```

## Database Schema (Core Tables)

```sql
-- Users & Organizations
users (id, email, name, avatar, created_at)
organizations (id, name, plan, stripe_customer_id)
org_members (org_id, user_id, role)

-- Contacts & Companies
contacts (id, org_id, email, first_name, last_name, company_id, status, tags, metadata)
companies (id, org_id, name, domain, industry, size, location)

-- Enrichment
enrichment_jobs (id, contact_id, provider, status, result)
email_verifications (id, email, status, provider, verified_at)

-- Campaigns & Sequences
campaigns (id, org_id, name, status, settings)
sequences (id, campaign_id, step_number, subject, body, delay_days)
campaign_contacts (campaign_id, contact_id, status, current_step)

-- Email Tracking
emails_sent (id, campaign_id, contact_id, sequence_step, sent_at, message_id)
email_events (id, email_id, event_type, timestamp, metadata)

-- API & Integrations
api_keys (id, org_id, key_hash, name, last_used)
connected_accounts (id, org_id, provider, credentials_encrypted)
```

## Pricing Tiers

| Plan | Price | Contacts | Emails/mo | Enrichments | Seats |
|------|-------|----------|-----------|-------------|-------|
| Free | $0 | 100 | 200 | 50 | 1 |
| Starter | $19/mo | 1,000 | 3,000 | 500 | 1 |
| Growth | $49/mo | 10,000 | 15,000 | 2,000 | 3 |
| Scale | $99/mo | Unlimited | 50,000 | 5,000 | 10 |

## MVP Timeline (2 weeks)

### Week 1: Foundation
- Day 1-2: Project setup, auth, database schema
- Day 3-4: Contact management (CRUD, import, export)
- Day 5-6: Email enrichment (multi-provider)
- Day 7: Campaign builder UI

### Week 2: Outreach & Polish
- Day 8-9: Sequence builder, email sending
- Day 10-11: Tracking (opens, clicks, replies)
- Day 12: Analytics dashboard
- Day 13: Billing (Stripe)
- Day 14: Landing page, deploy

## Success Metrics

- **Week 1:** 10 signups
- **Month 1:** 100 signups, 5 paying ($95 MRR)
- **Month 3:** 500 signups, 30 paying ($870 MRR)
- **Month 6:** 2000 signups, 100 paying ($2,900 MRR)

## Differentiators

1. **Price:** 50-70% cheaper than competitors
2. **Simplicity:** No enterprise bloat, just works
3. **AI-native:** AI writes emails, suggests leads
4. **Transparent:** Show exactly what each enrichment costs
5. **Developer-friendly:** API-first, webhooks, Zapier
