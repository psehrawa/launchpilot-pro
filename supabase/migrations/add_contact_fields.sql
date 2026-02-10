-- Add missing fields to lp_contacts table
-- Run this in Supabase SQL Editor

ALTER TABLE lp_contacts ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE lp_contacts ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE lp_contacts ADD COLUMN IF NOT EXISTS domain TEXT;

-- Make email optional (for enrichment flow)
ALTER TABLE lp_contacts ALTER COLUMN email DROP NOT NULL;

SELECT 'Added linkedin_url, source, domain columns to lp_contacts' as result;
