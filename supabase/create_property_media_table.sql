-- Create property_media table for storing property images and videos
CREATE TABLE IF NOT EXISTS property_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Foreign key to properties
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Media details
  media_url TEXT NOT NULL,
  media_type VARCHAR(20) NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  
  -- Display settings
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  
  -- Optional metadata
  alt_text VARCHAR(255),
  caption TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_media_property_id ON property_media(property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_is_primary ON property_media(is_primary);
CREATE INDEX IF NOT EXISTS idx_property_media_display_order ON property_media(display_order);
CREATE INDEX IF NOT EXISTS idx_property_media_type ON property_media(media_type);

-- Unique constraint to ensure only one primary image per property
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_media_primary_unique 
ON property_media(property_id) WHERE is_primary = TRUE;

-- Enable RLS
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Media access follows property access
CREATE POLICY "Users can view media for their own properties" ON property_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = property_media.property_id 
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create media for their own properties" ON property_media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = property_media.property_id 
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update media for their own properties" ON property_media
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = property_media.property_id 
            AND properties.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete media for their own properties" ON property_media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = property_media.property_id 
            AND properties.user_id = auth.uid()
        )
    );

-- Admin can see all property media
CREATE POLICY "Admins can view all property media" ON property_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update all property media" ON property_media
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

-- Public can view media for active properties
CREATE POLICY "Public can view media for active properties" ON property_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = property_media.property_id 
            AND properties.status = 'active'
        )
    );

-- Update trigger
CREATE TRIGGER update_property_media_updated_at BEFORE UPDATE ON property_media 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();