# 🇯🇲 JAMAICA DATABASE CONFIGURATION SCRIPTS

**Generated:** October 15, 2025  
**Updated:** Based on actual database schema discovery
**Target:** Add Jamaica data to existing multi-country database
**Safety:** All scripts include verification and rollback procedures

---

## 📋 PRE-EXECUTION CHECKLIST

**Before running any scripts:**
- [ ] Backup current database state
- [ ] Verify Supabase connection
- [ ] Confirm Jamaica exists in countries table (id = 'JM')
- [ ] Have rollback procedures ready

---

## 🔍 SCRIPT 1: VERIFY CURRENT STATE

**Purpose:** Check current database state before making changes

```sql
-- Verify Jamaica exists in countries table
SELECT id, name, currency_code, currency_symbol 
FROM countries WHERE id = 'JM';

-- Check current regions by country
SELECT 
  c.name as country_name,
  COUNT(r.id) as region_count
FROM countries c
LEFT JOIN regions r ON c.id = r.country_code
GROUP BY c.id, c.name
ORDER BY c.name;

-- Check current pricing plans structure
SELECT 
  user_type,
  plan_type,
  COUNT(*) as plan_count,
  MIN(price) as min_price_cents,
  MAX(price) as max_price_cents
FROM pricing_plans 
GROUP BY user_type, plan_type
ORDER BY user_type, plan_type;
```

**Expected Results:**
- Jamaica should exist with id='JM', currency_code='JMD', currency_symbol='J$'
- Jamaica should have 0 regions currently
- Current pricing plans should be visible (no country_id column exists)

---

## 🏙️ SCRIPT 2: INSERT JAMAICA REGIONS

**Purpose:** Add 15 major Jamaica parishes and cities to regions table

```sql
-- Insert Jamaica regions (using actual regions table structure)
INSERT INTO regions (
  name, 
  country_code, 
  created_at,
  updated_at
) VALUES
-- Major Cities and Parishes
('Kingston', 'JM', NOW(), NOW()),
('Spanish Town', 'JM', NOW(), NOW()),
('Montego Bay', 'JM', NOW(), NOW()),
('Ocho Rios', 'JM', NOW(), NOW()),
('Negril', 'JM', NOW(), NOW()),

-- Secondary Urban Areas
('Port Antonio', 'JM', NOW(), NOW()),
('Mandeville', 'JM', NOW(), NOW()),
('Savanna-la-Mar', 'JM', NOW(), NOW()),
('Port Maria', 'JM', NOW(), NOW()),
('May Pen', 'JM', NOW(), NOW()),

-- Parish Centers
('Lucea', 'JM', NOW(), NOW()),
('Falmouth', 'JM', NOW(), NOW()),
('Brown''s Town', 'JM', NOW(), NOW()),
('Buff Bay', 'JM', NOW(), NOW()),
('Black River', 'JM', NOW(), NOW());

-- Verify regions were inserted
SELECT 
  COUNT(*) as jamaica_regions_added,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM regions 
WHERE country_code = 'JM';

-- Show all Jamaica regions
SELECT id, name, country_code, created_at 
FROM regions 
WHERE country_code = 'JM' 
ORDER BY name;
```

**Expected Results:**
- 15 Jamaica regions inserted
- All should have country_code = 'JM'
- All should have proper created_at timestamps

---

## 💰 SCRIPT 3: ANALYSIS & STRATEGY FOR PRICING

**Issue:** The pricing_plans table does not have a country_id column, which means pricing plans are currently global/shared across countries.

**Strategy Options:**

### Option A: Add country_id column to pricing_plans table
```sql
-- Add country_id column to pricing_plans (SCHEMA CHANGE - RISKY)
ALTER TABLE pricing_plans ADD COLUMN country_id TEXT REFERENCES countries(id);

-- Update existing plans to be Guyana-specific
UPDATE pricing_plans SET country_id = 'GY' WHERE country_id IS NULL;

-- Then add Jamaica-specific plans...
```

### Option B: Use plan_name suffixes for country identification (SAFER)
```sql
-- Insert Jamaica pricing plans with country-specific naming
-- This preserves existing structure and is backwards compatible

-- FSBO Plans for Jamaica
INSERT INTO pricing_plans (
  id,
  user_type,
  plan_name,
  plan_type,
  price,
  max_properties,
  featured_listings_included,
  listing_duration_days,
  is_active,
  is_popular,
  display_order,
  features,
  created_at,
  updated_at
) VALUES
(
  gen_random_uuid(),
  'fsbo',
  'FSBO Basic Listing - Jamaica',
  'per_property',
  1500000, -- J$15,000 (≈$95 USD)
  1,
  0,
  90,
  true,
  false,
  1,
  '{"support":"email","duration":"90 days","basic_analytics":true,"country":"JM"}'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'fsbo',
  'FSBO Premium Listing - Jamaica',
  'per_property',
  3000000, -- J$30,000 (≈$190 USD)
  1,
  1,
  90,
  true,
  true,
  2,
  '{"support":"priority","duration":"90 days","social_sharing":true,"advanced_analytics":true,"country":"JM"}'::jsonb,
  NOW(),
  NOW()
);

ERROR:  23505: duplicate key value violates unique constraint "pricing_plans_plan_name_key"
DETAIL:  Key (plan_name)=(FSBO Basic Listing - Jamaica) already exists.

-- Landlord Plans for Jamaica  
INSERT INTO pricing_plans (
  id,
  user_type,
  plan_name,
  plan_type,
  price,
  max_properties,
  featured_listings_included,
  listing_duration_days,
  is_active,
  is_popular,
  display_order,
  features,
  created_at,
  updated_at
) VALUES
(
  gen_random_uuid(),
  'landlord',
  'Landlord Basic Rental - Jamaica',
  'per_property',
  1200000, -- J$12,000 (≈$76 USD)
  1,
  0,
  60,
  true,
  false,
  1,
  '{"duration":"60 days","rental_tools":true,"tenant_screening":false,"country":"JM"}'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'landlord',
  'Landlord Pro Rental - Jamaica',
  'per_property',
  2200000, -- J$22,000 (≈$139 USD)
  1,
  1,
  60,
  true,
  true,
  2,
  '{"duration":"60 days","rental_tools":true,"lease_templates":true,"tenant_screening":true,"country":"JM"}'::jsonb,
  NOW(),
  NOW()
);

-- Verify Jamaica pricing plans were inserted
SELECT 
  user_type,
  plan_name,
  price,
  features->'country' as country
FROM pricing_plans 
WHERE plan_name LIKE '%Jamaica%'
ORDER BY user_type, price;
```

**Recommended Approach:** Option B (safer, no schema changes required)

---

## 🔍 SCRIPT 4: VERIFICATION QUERIES

**Purpose:** Verify all Jamaica data was inserted correctly and existing data is unaffected

```sql
-- Verify Jamaica regions
SELECT 'Jamaica Regions' as category, COUNT(*) as count
FROM regions WHERE country_code = 'JM'
UNION ALL
-- Verify Guyana regions unchanged  
SELECT 'Guyana Regions', COUNT(*)
FROM regions WHERE country_code = 'GY'
UNION ALL
-- Verify Jamaica pricing plans
SELECT 'Jamaica Pricing Plans', COUNT(*)
FROM pricing_plans WHERE plan_name LIKE '%Jamaica%'
UNION ALL
-- Verify existing pricing plans unchanged
SELECT 'Other Pricing Plans', COUNT(*)
FROM pricing_plans WHERE plan_name NOT LIKE '%Jamaica%';

-- Detailed Jamaica regions check
SELECT 
  'Region Data' as data_type,
  name,
  country_code,
  created_at
FROM regions 
WHERE country_code = 'JM'
ORDER BY name
LIMIT 5;

-- Detailed Jamaica pricing check
SELECT 
  user_type,
  plan_name,
  price,
  features->'country' as country,
  is_active
FROM pricing_plans 
WHERE plan_name LIKE '%Jamaica%'
ORDER BY user_type, price;

-- Final verification summary
SELECT 
  'Summary' as check_type,
  'Jamaica regions: ' || (SELECT COUNT(*) FROM regions WHERE country_code = 'JM') ||
  ', Jamaica plans: ' || (SELECT COUNT(*) FROM pricing_plans WHERE plan_name LIKE '%Jamaica%') as status;
```

**Success Criteria:**
- Jamaica: 15 regions, 7 pricing plans
- Existing data: Unchanged and unaffected  
- All Jamaica data properly formatted with country identifiers

---

## 🚨 ROLLBACK PROCEDURES

**If something goes wrong, run these to undo changes:**

```sql
-- ROLLBACK: Remove Jamaica regions
DELETE FROM regions WHERE country_code = 'JM' AND created_at > (NOW() - INTERVAL '1 hour');

-- ROLLBACK: Remove Jamaica pricing plans
DELETE FROM pricing_plans WHERE plan_name LIKE '%Jamaica%' AND created_at > (NOW() - INTERVAL '1 hour');

-- Verify rollback success
SELECT 'Jamaica Regions After Rollback' as check_type, COUNT(*) as count
FROM regions WHERE country_code = 'JM'
UNION ALL
SELECT 'Jamaica Pricing Plans After Rollback', COUNT(*)
FROM pricing_plans WHERE plan_name LIKE '%Jamaica%';
```

---

## ✅ EXECUTION CHECKLIST

**Execute in this order:**

1. [ ] Run Script 1: Verify current state
2. [ ] Take screenshot of results for backup
3. [ ] Run Script 2: Insert Jamaica regions
4. [ ] Verify 15 regions added successfully
5. [ ] Run Script 3: Insert Jamaica pricing plans (Option B)
6. [ ] Verify 7 pricing plans added successfully
7. [ ] Run Script 4: Final verification
8. [ ] Confirm existing data unchanged
9. [ ] Update progress tracker

**If any script fails:**
- Stop immediately
- Run appropriate rollback script
- Document the error
- Check schema compatibility before continuing

---

## 📊 EXPECTED FINAL STATE

**After successful execution:**
- Jamaica: 15 regions, 7 pricing plans
- Existing data: Unchanged and unaffected
- All Jamaica pricing in JMD currency
- Country identification via plan names and features
- All plans properly configured and active

**Next Phase:** Theme & Branding Setup

---

**Status:** Ready for execution (CORRECTED SCRIPTS)
**Risk Level:** Low (non-destructive additions, no schema changes)
**Estimated Time:** 20 minutes

**Key Changes from Original:**
- Uses `regions` table instead of `locations`
- Uses country_id = 'JM' (text) instead of numeric
- Uses plan name suffixes for country identification
- Stores country in features JSON for programmatic filtering
- No schema modifications required