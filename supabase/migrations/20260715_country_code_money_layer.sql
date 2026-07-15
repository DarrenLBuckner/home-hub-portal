-- H90: stamp country_code on the money layer.
--
-- WHY: every money row must carry the territory it belongs to BEFORE the first
-- real payment lands (billing goes live Oct 1). A payment row without country_code
-- is permanently unattributable — retroactive attribution is impossible, and
-- per-territory revenue is the core acquisition proof. All payment tables hold 0
-- rows today; this is greenfield, not a retrofit.
--
-- PERMANENT RULE — OWN country_code, stamped at write time:
--   Payment rows carry their OWN country_code, set by the writer. It is NEVER
--   inherited from advertisers.country_code. advertisers.country_code is where the
--   company is REGISTERED; a regional advertiser (e.g. Republic Bank across the
--   Caribbean) can pay in two territories, so the registration country is not whose
--   revenue the payment is.
--
-- PERMANENT RULE — fail loud, never default silently:
--   A write that does not supply country_code MUST fail, not fall back to a default.
--   A wrong attribution is worse than a rejected insert. This is why the existing
--   'GYD' default on subscription_payments.country_code is dropped below rather than
--   corrected to 'GY' — same rule the Stripe webhook enforces.
--
-- FK target: territories(country_code) — character varying, UNIQUE. All columns
-- below are character varying to stay type-compatible with that target.
--
-- Scope: 7 tables. ad_campaigns (targets many countries via target_countries[]) and
-- featured_listings (site_id defaults to 'portal', not a territory) are deliberately
-- out of scope and left untouched.
--
-- Record-keeping: mirrors the SQL run manually in Supabase. FK/constraint statements
-- are NOT idempotent (Postgres has no ADD CONSTRAINT IF NOT EXISTS) — re-running
-- creates duplicate constraints. Run once, then clear the editor.

-- =====================================================================
-- 1. subscription_payments (0 rows) — column exists, nullable, default 'GYD'
--    Drop the silent default, enforce NOT NULL, add FK + index.
-- =====================================================================
ALTER TABLE subscription_payments
  ALTER COLUMN country_code DROP DEFAULT;
ALTER TABLE subscription_payments
  ALTER COLUMN country_code SET NOT NULL;
ALTER TABLE subscription_payments
  ADD CONSTRAINT fk_subscription_payments_country
  FOREIGN KEY (country_code) REFERENCES territories(country_code);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_country_code
  ON subscription_payments(country_code);

-- =====================================================================
-- 2. advertiser_billing (0 rows) — add column NOT NULL, FK + index.
--    Invoice is per-country: one per advertiser per country per period.
-- =====================================================================
ALTER TABLE advertiser_billing
  ADD COLUMN IF NOT EXISTS country_code character varying NOT NULL;
ALTER TABLE advertiser_billing
  ADD CONSTRAINT fk_advertiser_billing_country
  FOREIGN KEY (country_code) REFERENCES territories(country_code);
CREATE INDEX IF NOT EXISTS idx_advertiser_billing_country_code
  ON advertiser_billing(country_code);

-- =====================================================================
-- 3. property_payments (0 rows) — add column NOT NULL, FK + index.
-- =====================================================================
ALTER TABLE property_payments
  ADD COLUMN IF NOT EXISTS country_code character varying NOT NULL;
ALTER TABLE property_payments
  ADD CONSTRAINT fk_property_payments_country
  FOREIGN KEY (country_code) REFERENCES territories(country_code);
CREATE INDEX IF NOT EXISTS idx_property_payments_country_code
  ON property_payments(country_code);

-- =====================================================================
-- 4. payment_history (0 rows) — add column NOT NULL, FK + index.
-- =====================================================================
ALTER TABLE payment_history
  ADD COLUMN IF NOT EXISTS country_code character varying NOT NULL;
ALTER TABLE payment_history
  ADD CONSTRAINT fk_payment_history_country
  FOREIGN KEY (country_code) REFERENCES territories(country_code);
CREATE INDEX IF NOT EXISTS idx_payment_history_country_code
  ON payment_history(country_code);

-- =====================================================================
-- 5. ad_impressions (0 rows) — column exists, nullable, no default.
--    Enforce NOT NULL, add FK + index. (Not ADD — column already present.)
-- =====================================================================
ALTER TABLE ad_impressions
  ALTER COLUMN country_code SET NOT NULL;
ALTER TABLE ad_impressions
  ADD CONSTRAINT fk_ad_impressions_country
  FOREIGN KEY (country_code) REFERENCES territories(country_code);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_country_code
  ON ad_impressions(country_code);

-- =====================================================================
-- 6. ad_placements (5 rows) — country_code already exists and is NOT NULL.
--    FK + index only. No backfill: placements reference country directly.
--    VALIDATION: the FK below validates the 5 existing rows. It FAILS if any
--    placement's country_code is not present in territories(country_code).
--    Verify the 5 values against the territory codes before running.
-- =====================================================================
ALTER TABLE ad_placements
  ADD CONSTRAINT fk_ad_placements_country
  FOREIGN KEY (country_code) REFERENCES territories(country_code);
CREATE INDEX IF NOT EXISTS idx_ad_placements_country_code
  ON ad_placements(country_code);

-- =====================================================================
-- 7. advertisers (1 row) — country_code exists, NOT NULL, no FK. Add FK + index.
--    country_code here = where the company is REGISTERED (see header). It is the
--    valid source only for the advertiser's own registration, never for payment
--    attribution.
--    VALIDATION: the FK below validates the 1 existing row. It FAILS if that
--    advertiser's country_code is not present in territories(country_code).
-- =====================================================================
ALTER TABLE advertisers
  ADD CONSTRAINT fk_advertisers_country
  FOREIGN KEY (country_code) REFERENCES territories(country_code);
CREATE INDEX IF NOT EXISTS idx_advertisers_country_code
  ON advertisers(country_code);
