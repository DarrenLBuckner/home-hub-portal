-- Fix conflicting property type constraints
-- Drop the old constraint and keep only the newer one that supports more granular types

-- Drop the conflicting constraint that only allows 'residential', 'commercial', 'land', 'industrial'
ALTER TABLE properties DROP CONSTRAINT IF EXISTS check_property_type;

-- Keep the properties_property_type_check constraint that allows:
-- 'house', 'apartment', 'land', 'commercial', 'industrial'

-- Verify the remaining constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'properties'::regclass 
AND conname LIKE '%property_type%';