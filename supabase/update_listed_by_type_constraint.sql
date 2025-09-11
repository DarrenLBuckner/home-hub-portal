-- Update the constraint to accept 'owner' instead of 'fsbo'
-- This aligns with the new directory structure and user type naming

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_listed_by_type_check;

ALTER TABLE properties ADD CONSTRAINT properties_listed_by_type_check 
  CHECK (listed_by_type IN ('owner', 'agent', 'landlord'));

-- Update any existing 'fsbo' records to 'owner' (if any exist)
UPDATE properties SET listed_by_type = 'owner' WHERE listed_by_type = 'fsbo';