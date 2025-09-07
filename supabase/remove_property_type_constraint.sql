-- Remove database constraint and handle validation at application level
-- This allows the rich property type options in the form to be stored as-is

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;

-- Verify constraint is removed
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'properties'::regclass 
AND conname LIKE '%property_type%';