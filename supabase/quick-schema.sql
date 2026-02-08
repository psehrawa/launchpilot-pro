-- LaunchPilot Pro - Quick Schema (essential tables only)
-- Run this in Supabase SQL Editor

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations
CREATE TABLE IF NOT EXISTS lp_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Org Members
CREATE TABLE IF NOT EXISTS lp_org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES lp_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- Contacts
CREATE TABLE IF NOT EXISTS lp_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES lp_organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  title TEXT,
  status TEXT DEFAULT 'new',
  tags TEXT[] DEFAULT '{}',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_contacts_email ON lp_contacts(email);
CREATE INDEX IF NOT EXISTS idx_lp_contacts_org_id ON lp_contacts(org_id);

-- Campaigns
CREATE TABLE IF NOT EXISTS lp_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES lp_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_campaigns_org_id ON lp_campaigns(org_id);

-- Sequence Steps
CREATE TABLE IF NOT EXISTS lp_sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES lp_campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  delay_days INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_lp_sequence_steps_campaign_id ON lp_sequence_steps(campaign_id);

-- Emails Sent
CREATE TABLE IF NOT EXISTS lp_emails_sent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES lp_campaigns(id),
  contact_id UUID REFERENCES lp_contacts(id),
  subject TEXT,
  status TEXT DEFAULT 'sent',
  tracking_id UUID,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_emails_sent_tracking_id ON lp_emails_sent(tracking_id);

-- Email Events (opens, clicks, replies)
CREATE TABLE IF NOT EXISTS lp_email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID REFERENCES lp_emails_sent(id),
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_email_events_email_id ON lp_email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_lp_email_events_type ON lp_email_events(event_type);

-- Create default org for testing
INSERT INTO lp_organizations (name, slug, plan) 
VALUES ('Default', 'default', 'free')
ON CONFLICT (slug) DO NOTHING;

SELECT 'LaunchPilot Pro schema created successfully!' as result;
