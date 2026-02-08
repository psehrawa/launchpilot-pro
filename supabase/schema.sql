-- LaunchPilot Pro Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (multi-tenant support)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth', 'scale')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members (many-to-many)
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT,
  location TEXT,
  linkedin_url TEXT,
  website TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_org_id ON companies(org_id);
CREATE INDEX idx_companies_domain ON companies(domain);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  phone TEXT,
  linkedin_url TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'replied', 'meeting', 'won', 'lost', 'unsubscribed')),
  tags TEXT[] DEFAULT '{}',
  source TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_status TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_org_id ON contacts(org_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_status ON contacts(status);

-- Enrichment Jobs (track API usage)
CREATE TABLE enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('find_email', 'verify_email', 'enrich_contact')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result JSONB,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_org_id ON campaigns(org_id);

-- Sequence Steps
CREATE TABLE sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, step_number)
);

-- Campaign Contacts (junction table)
CREATE TABLE campaign_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'paused', 'bounced', 'unsubscribed')),
  current_step INTEGER DEFAULT 0,
  next_send_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, contact_id)
);

-- Emails Sent
CREATE TABLE emails_sent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  sequence_step INTEGER,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  message_id TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'failed')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_emails_sent_org_id ON emails_sent(org_id);
CREATE INDEX idx_emails_sent_contact_id ON emails_sent(contact_id);

-- Email Events (tracking)
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID REFERENCES emails_sent(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('delivered', 'opened', 'clicked', 'replied', 'bounced', 'complained', 'unsubscribed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_events_email_id ON email_events(email_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);

-- Email Templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connected Accounts (SMTP, etc.)
CREATE TABLE connected_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  credentials_encrypted TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Tracking
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  metric TEXT NOT NULL CHECK (metric IN ('emails_sent', 'enrichments', 'contacts_created', 'api_calls')),
  count INTEGER DEFAULT 1,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, metric, period_start)
);

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_jobs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's org IDs
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT get_user_org_ids()));

-- RLS Policies for contacts
CREATE POLICY "Users can view org contacts"
  ON contacts FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can insert org contacts"
  ON contacts FOR INSERT
  WITH CHECK (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can update org contacts"
  ON contacts FOR UPDATE
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can delete org contacts"
  ON contacts FOR DELETE
  USING (org_id IN (SELECT get_user_org_ids()));

-- Similar policies for other tables (abbreviated for space)
CREATE POLICY "Users can manage org companies" ON companies FOR ALL USING (org_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Users can manage org campaigns" ON campaigns FOR ALL USING (org_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Users can manage sequence_steps" ON sequence_steps FOR ALL USING (campaign_id IN (SELECT id FROM campaigns WHERE org_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Users can manage campaign_contacts" ON campaign_contacts FOR ALL USING (campaign_id IN (SELECT id FROM campaigns WHERE org_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Users can manage emails_sent" ON emails_sent FOR ALL USING (org_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Users can manage email_events" ON email_events FOR ALL USING (email_id IN (SELECT id FROM emails_sent WHERE org_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Users can manage templates" ON email_templates FOR ALL USING (org_id IN (SELECT get_user_org_ids()) OR is_public = TRUE);
CREATE POLICY "Users can manage api_keys" ON api_keys FOR ALL USING (org_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Users can manage connected_accounts" ON connected_accounts FOR ALL USING (org_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Users can view usage" ON usage_records FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Users can manage enrichment_jobs" ON enrichment_jobs FOR ALL USING (org_id IN (SELECT get_user_org_ids()));

-- Trigger to auto-create user record
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
