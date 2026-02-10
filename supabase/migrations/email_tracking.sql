-- Email Tracking Schema Updates
-- Run this in Supabase SQL Editor

-- Add tracking columns to lp_emails_sent
ALTER TABLE lp_emails_sent ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES lp_organizations(id);
ALTER TABLE lp_emails_sent ADD COLUMN IF NOT EXISTS to_email TEXT;
ALTER TABLE lp_emails_sent ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE lp_emails_sent ADD COLUMN IF NOT EXISTS gmail_message_id TEXT;
ALTER TABLE lp_emails_sent ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
ALTER TABLE lp_emails_sent ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;
ALTER TABLE lp_emails_sent ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;
ALTER TABLE lp_emails_sent ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0;
ALTER TABLE lp_emails_sent ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE lp_emails_sent ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ;
ALTER TABLE lp_emails_sent ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMPTZ;

-- Create index for tracking lookups
CREATE INDEX IF NOT EXISTS idx_lp_emails_tracking_id ON lp_emails_sent(tracking_id);
CREATE INDEX IF NOT EXISTS idx_lp_emails_gmail_id ON lp_emails_sent(gmail_message_id);

-- Create email sequences table for follow-ups
CREATE TABLE IF NOT EXISTS lp_email_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES lp_organizations(id) ON DELETE CASCADE,
  email_id UUID REFERENCES lp_emails_sent(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL DEFAULT 1,
  delay_days INTEGER NOT NULL DEFAULT 3,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'pending', -- pending, sent, skipped
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_sequences_email ON lp_email_sequences(email_id);
CREATE INDEX IF NOT EXISTS idx_lp_sequences_status ON lp_email_sequences(status);

-- Update org_id for existing emails
UPDATE lp_emails_sent 
SET org_id = (SELECT id FROM lp_organizations WHERE slug = 'default' LIMIT 1)
WHERE org_id IS NULL;

SELECT 'Email tracking schema updated!' as result;
