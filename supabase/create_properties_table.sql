-- Create properties table for FSBO and agent listings
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic Information (Step 1)
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('House', 'Apartment', 'Land', 'Commercial')),
  
  -- Property Details (Step 2)
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  house_size_value INTEGER NOT NULL,
  house_size_unit VARCHAR(10) DEFAULT 'sq ft' CHECK (house_size_unit IN ('sq ft', 'sq m')),
  land_size_value INTEGER,
  land_size_unit VARCHAR(10) DEFAULT 'sq ft' CHECK (land_size_unit IN ('sq ft', 'acres')),
  year_built INTEGER,
  amenities TEXT[] DEFAULT '{}',
  
  -- Location (Step 3)
  region VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(100),
  
  -- Contact (Step 5)
  owner_email VARCHAR(255) NOT NULL,
  owner_whatsapp VARCHAR(20) NOT NULL,
  
  -- System fields (auto-populated)
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_type VARCHAR(20) NOT NULL DEFAULT 'sale' CHECK (listing_type IN ('sale', 'rent')),
  listed_by_type VARCHAR(20) NOT NULL CHECK (listed_by_type IN ('agent', 'fsbo', 'landlord')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'rejected', 'expired')),
  
  -- Legacy/additional fields
  propertyCategory VARCHAR(20) DEFAULT 'sale',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_listed_by_type ON properties(listed_by_type);
CREATE INDEX IF NOT EXISTS idx_properties_region ON properties(region);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own properties" ON properties
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON properties
    FOR DELETE USING (auth.uid() = user_id);

-- Admin can see all properties (assuming admin role in profiles table)
CREATE POLICY "Admins can view all properties" ON properties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update all properties" ON properties
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

-- Public can view active properties
CREATE POLICY "Public can view active properties" ON properties
    FOR SELECT USING (status = 'active');

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();