-- Migration: Add tracking and scheduling columns
-- Run this in Supabase SQL Editor if columns don't exist

-- Add email verification status to contacts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lp_contacts' AND column_name = 'email_verification_status') THEN
    ALTER TABLE lp_contacts ADD COLUMN email_verification_status TEXT;
  END IF;
END $$;

-- Add sequence_step and message_id to emails_sent
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lp_emails_sent' AND column_name = 'sequence_step') THEN
    ALTER TABLE lp_emails_sent ADD COLUMN sequence_step INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lp_emails_sent' AND column_name = 'message_id') THEN
    ALTER TABLE lp_emails_sent ADD COLUMN message_id TEXT;
  END IF;
END $$;

-- Add completed_at to campaign_contacts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lp_campaign_contacts' AND column_name = 'completed_at') THEN
    ALTER TABLE lp_campaign_contacts ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add send scheduling to campaigns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lp_campaigns' AND column_name = 'send_time') THEN
    ALTER TABLE lp_campaigns ADD COLUMN send_time TIME;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lp_campaigns' AND column_name = 'timezone') THEN
    ALTER TABLE lp_campaigns ADD COLUMN timezone TEXT DEFAULT 'America/New_York';
  END IF;
END $$;

-- Create index for cron job queries
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_next_send 
  ON lp_campaign_contacts(next_send_at) 
  WHERE status = 'in_progress';

-- Create index for tracking_id lookups
CREATE INDEX IF NOT EXISTS idx_emails_sent_tracking_id 
  ON lp_emails_sent(tracking_id);

-- Create index for message_id lookups (for webhook matching)
CREATE INDEX IF NOT EXISTS idx_emails_sent_message_id 
  ON lp_emails_sent(message_id);
