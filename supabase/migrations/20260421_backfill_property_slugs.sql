-- =============================================================================
-- Migration: Backfill property slugs for rows where slug IS NULL
-- File: 20260421_backfill_property_slugs.sql
-- Created: 2026-04-21
-- Status: DRAFT — review and apply manually in Supabase Dashboard
-- =============================================================================
--
-- CONTEXT
-- -------
-- A DB trigger that populated properties.slug was dropped (or ceased firing)
-- around March 5–7, 2026 as collateral from the DB trigger changes in commit
-- 2cf5b43. Every listing created after that date has slug = NULL.
--
-- The create route (src/app/api/properties/create/route.ts) was updated
-- 2026-04-21 to generate slugs in application code, so going-forward creates
-- are fixed. This migration repairs existing NULL rows.
--
-- SAFETY
-- ------
--   * Touches ONLY rows where slug IS NULL. Existing slugs are never modified.
--   * Idempotent: re-running is a no-op after the first successful pass.
--   * Wrapped in a transaction. Rollback by aborting before COMMIT.
--   * On duplicate slug collision, appends the full UUID as suffix (vs the
--     8-char prefix used for the normal form) so every backfilled row ends
--     up with a globally unique slug.
--
-- SLUG FORMAT
-- -----------
-- Mirrors the application-side format in buildPropertySlug():
--   [property_type]-for-[listing_type]-[neighborhood-city]-[first 8 of id]
--
-- Example:
--   apartment-for-rent-powis-clove-south-ruimveldt-4dd4eba4
--
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper: slugify — mirrors the app-side slugify() in route.ts
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN input IS NULL OR btrim(input) = '' THEN ''
    ELSE
      regexp_replace(
        regexp_replace(
          regexp_replace(
            lower(replace(input, '&', 'and')),
            '[^a-z0-9]+', '-', 'g'
          ),
          '^-+|-+$', '', 'g'
        ),
        '-{2,}', '-', 'g'
      )
  END
$$;

-- ---------------------------------------------------------------------------
-- Helper: build_property_slug — mirrors buildPropertySlug() in route.ts
-- Location = neighborhood + city. region and address are excluded by design.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.build_property_slug(
  p_property_type text,
  p_listing_type  text,
  p_neighborhood  text,
  p_city          text,
  p_id            uuid,
  p_full_id       boolean DEFAULT false
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT array_to_string(
    ARRAY(
      SELECT part FROM (
        VALUES
          (COALESCE(NULLIF(pg_temp.slugify(p_property_type), ''), 'property')),
          ('for'),
          (COALESCE(NULLIF(pg_temp.slugify(p_listing_type),  ''), 'sale')),
          (NULLIF(pg_temp.slugify(
            btrim(COALESCE(p_neighborhood, '') || ' ' || COALESCE(p_city, ''))
          ), '')),
          (CASE WHEN p_full_id THEN p_id::text ELSE substring(p_id::text, 1, 8) END)
      ) AS t(part)
      WHERE part IS NOT NULL AND part <> ''
    ),
    '-'
  )
$$;

-- ---------------------------------------------------------------------------
-- Pass 1: Build candidate slugs for all NULL rows.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _slug_candidates ON COMMIT DROP AS
SELECT
  id,
  pg_temp.build_property_slug(
    property_type,
    listing_type,
    neighborhood,
    city,
    id,
    false
  ) AS candidate_slug
FROM properties
WHERE slug IS NULL;

-- ---------------------------------------------------------------------------
-- Pass 2: Detect collisions:
--   (a) within the candidate set itself
--   (b) against existing non-NULL slugs already in properties
-- Rows flagged here get the full-UUID form instead.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _slug_collisions ON COMMIT DROP AS
SELECT c.id
FROM _slug_candidates c
WHERE
  -- (a) duplicates within the candidate batch
  (SELECT COUNT(*) FROM _slug_candidates c2 WHERE c2.candidate_slug = c.candidate_slug) > 1
  OR
  -- (b) collision with an already-slugged row
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.slug = c.candidate_slug
      AND p.id <> c.id
  );

-- ---------------------------------------------------------------------------
-- Pass 3: Apply the update. Collision rows use the full-UUID form.
-- ---------------------------------------------------------------------------
UPDATE properties p
SET slug = CASE
    WHEN p.id IN (SELECT id FROM _slug_collisions)
      THEN pg_temp.build_property_slug(
        p.property_type, p.listing_type, p.neighborhood, p.city, p.id, true
      )
    ELSE c.candidate_slug
  END
FROM _slug_candidates c
WHERE p.id = c.id
  AND p.slug IS NULL;

-- ---------------------------------------------------------------------------
-- Verification — the following three queries should all return 0.
-- They are inside the transaction so you can review and ROLLBACK if anything
-- looks wrong before running COMMIT.
-- ---------------------------------------------------------------------------
-- SELECT COUNT(*) AS remaining_null_slugs FROM properties WHERE slug IS NULL;
-- SELECT slug, COUNT(*) AS dup FROM properties WHERE slug IS NOT NULL
--   GROUP BY slug HAVING COUNT(*) > 1;
-- SELECT COUNT(*) AS empty_string_slugs FROM properties WHERE slug = '';

COMMIT;

-- =============================================================================
-- POST-COMMIT SANITY CHECKS (run separately after commit)
-- =============================================================================
--
--   SELECT COUNT(*) FROM properties WHERE slug IS NULL;
--   -- Expected: 0
--
--   SELECT slug, COUNT(*) FROM properties GROUP BY slug HAVING COUNT(*) > 1;
--   -- Expected: 0 rows
--
--   SELECT id, slug FROM properties
--   WHERE status = 'active'
--   ORDER BY created_at DESC
--   LIMIT 5;
--   -- Expected: slugs of the form type-for-listing-location-xxxxxxxx
--
-- =============================================================================
-- ROLLBACK
-- =============================================================================
-- This migration only populates NULL slugs — it does not overwrite existing
-- ones. To reverse, null out the rows it touched:
--
--   BEGIN;
--   UPDATE properties
--   SET slug = NULL
--   WHERE slug IS NOT NULL
--     AND id IN (
--       -- list of ids captured at migration time, if needed
--     );
--   COMMIT;
--
-- Safer alternative: leave the slugs in place; they do no harm if the routing
-- fix is also rolled back.
-- =============================================================================
