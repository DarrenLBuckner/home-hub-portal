import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Create properties table
    const propertiesQuery = `
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
        user_id UUID NOT NULL,
        listing_type VARCHAR(20) NOT NULL DEFAULT 'sale' CHECK (listing_type IN ('sale', 'rent')),
        listed_by_type VARCHAR(20) NOT NULL CHECK (listed_by_type IN ('agent', 'owner', 'landlord')),
        status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'rejected', 'expired')),
        
        -- Legacy/additional fields
        propertyCategory VARCHAR(20) DEFAULT 'sale',
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: propertiesError } = await supabase.rpc('exec_sql', { sql: propertiesQuery });
    
    // Create property_media table
    const mediaQuery = `
      -- Create property_media table for storing property images and videos
      CREATE TABLE IF NOT EXISTS property_media (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        
        -- Foreign key to properties
        property_id UUID NOT NULL,
        
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
    `;

    const { error: mediaError } = await supabase.rpc('exec_sql', { sql: mediaQuery });

    // Create indexes and constraints
    const indexesQuery = `
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
      CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
      CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
      CREATE INDEX IF NOT EXISTS idx_property_media_property_id ON property_media(property_id);
      CREATE INDEX IF NOT EXISTS idx_property_media_is_primary ON property_media(is_primary);
    `;

    const { error: indexesError } = await supabase.rpc('exec_sql', { sql: indexesQuery });

    if (propertiesError || mediaError || indexesError) {
      return NextResponse.json({ 
        error: 'Database setup failed',
        details: {
          properties: propertiesError,
          media: mediaError,
          indexes: indexesError
        }
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Database tables created successfully',
      tables: ['properties', 'property_media']
    });

  } catch (error: any) {
    console.error('Database setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check if tables exist
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['properties', 'property_media']);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const existingTables = tables?.map(t => t.table_name) || [];
    
    return NextResponse.json({ 
      success: true,
      existing_tables: existingTables,
      needed_tables: ['properties', 'property_media'],
      tables_exist: existingTables.length === 2
    });

  } catch (error: any) {
    console.error('Database check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}