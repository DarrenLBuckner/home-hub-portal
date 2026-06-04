-- Territory signup flags
-- 1) Add three per-territory signup toggles to territories (default TRUE)
-- 2) Disable landlord + FSBO signups for Guyana (agent-only territory)
--
-- Record-keeping: mirrors the SQL run manually in Supabase. Additive and
-- idempotent (ADD COLUMN IF NOT EXISTS); not expected to re-execute.

ALTER TABLE territories
  ADD COLUMN IF NOT EXISTS agent_signup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS landlord_signup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS fsbo_signup_enabled BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE territories
  SET landlord_signup_enabled = FALSE,
      fsbo_signup_enabled = FALSE
  WHERE country_code = 'GY';
