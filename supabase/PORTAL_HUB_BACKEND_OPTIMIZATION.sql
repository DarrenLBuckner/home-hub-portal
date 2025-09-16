-- ==================================================
-- PORTAL HUB - PRODUCTION OPTIMIZATION
-- Serves: Agents, Landlords, and FSBO Properties
-- ==================================================

-- Additional performance indexes for production workload
-- Based on common query patterns in property search

-- 1. COMPOSITE INDEXES FOR COMMON SEARCHES
-- Region + Property Type combination (most common filter)
CREATE INDEX IF NOT EXISTS idx_properties_region_type ON properties(region, property_type);

-- Status + Listing Type combination (active sale/rent properties)
CREATE INDEX IF NOT EXISTS idx_properties_status_listing ON properties(status, listing_type);

-- Listed By Type + Status (filter by agent/fsbo/landlord properties)
CREATE INDEX IF NOT EXISTS idx_properties_listed_by_status ON properties(listed_by_type, status);

-- Price range queries with property type
CREATE INDEX IF NOT EXISTS idx_properties_type_price ON properties(property_type, price);

-- Location-based searches
CREATE INDEX IF NOT EXISTS idx_properties_region_city ON properties(region, city);

-- 2. SEARCH OPTIMIZATION INDEXES
-- Full-text search on title and description
CREATE INDEX IF NOT EXISTS idx_properties_search_title ON properties USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_properties_search_description ON properties USING gin(to_tsvector('english', description));

-- Bedrooms/bathrooms filtering
CREATE INDEX IF NOT EXISTS idx_properties_bed_bath ON properties(bedrooms, bathrooms);

-- Date-based queries (recent listings)
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_updated_at ON properties(updated_at DESC);

-- 3. PROPERTY MEDIA OPTIMIZATION
-- Combined property_id + display_order for image galleries (if display_order column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'property_media' 
               AND column_name = 'display_order' 
               AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_property_media_property_order ON property_media(property_id, display_order);
        RAISE NOTICE 'Created property_media display_order index.';
    ELSE
        RAISE NOTICE 'display_order column does not exist in property_media table. Skipping index creation.';
    END IF;
END $$;

-- 4. USER ACTIVITY INDEXES
-- User dashboard queries (user's properties by status)
CREATE INDEX IF NOT EXISTS idx_properties_user_status ON properties(user_id, status);

-- User's properties by creation date (newest first)
CREATE INDEX IF NOT EXISTS idx_properties_user_created ON properties(user_id, created_at DESC);

-- ==================================================
-- DOCUMENTATION: PROPERTY TYPES SUPPORTED
-- ==================================================

-- Add comments to document the system
COMMENT ON TABLE properties IS 'Central property table serving all listing types: Agent listings, FSBO (For Sale By Owner), and Landlord rentals. All properties flow through Portal Hub to multiple regional frontends.';

COMMENT ON COLUMN properties.listed_by_type IS 'Property source: agent (real estate agents), fsbo (for sale by owner), landlord (rental properties)';

COMMENT ON COLUMN properties.listing_type IS 'Sale or rental: sale (purchase properties), rent (rental properties)';

COMMENT ON COLUMN properties.status IS 'Listing status: draft (not published), pending (awaiting approval), active (live), rejected (admin rejected), expired (time expired)';

-- ==================================================
-- PROPERTY CATEGORIZATION FIELDS
-- ==================================================

-- Ensure proper categorization exists (already implemented)
-- listed_by_type: 'agent', 'fsbo', 'landlord' 
-- listing_type: 'sale', 'rent'
-- property_type: 'House', 'Apartment', 'Land', 'Commercial'

-- ==================================================
-- PERFORMANCE ANALYSIS QUERIES
-- ==================================================

-- View to analyze performance bottlenecks
CREATE OR REPLACE VIEW property_performance_stats AS
SELECT 
    COUNT(*) as total_properties,
    COUNT(*) FILTER (WHERE status = 'active') as active_properties,
    COUNT(*) FILTER (WHERE listed_by_type = 'agent') as agent_listings,
    COUNT(*) FILTER (WHERE listed_by_type = 'fsbo') as fsbo_listings,
    COUNT(*) FILTER (WHERE listed_by_type = 'landlord') as landlord_listings,
    COUNT(*) FILTER (WHERE listing_type = 'sale') as sale_properties,
    COUNT(*) FILTER (WHERE listing_type = 'rent') as rental_properties,
    AVG(price) FILTER (WHERE listing_type = 'sale') as avg_sale_price,
    AVG(price) FILTER (WHERE listing_type = 'rent') as avg_rent_price
FROM properties;

-- Index usage analysis (run periodically)
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename IN ('properties', 'property_media', 'profiles')
ORDER BY tablename, attname;

-- ==================================================
-- CLEANUP AND OPTIMIZATION
-- ==================================================

-- Update table statistics for query optimizer
ANALYZE properties;
ANALYZE property_media;
ANALYZE profiles;

-- Reindex for optimal performance (run during maintenance window)
-- REINDEX TABLE properties;
-- REINDEX TABLE property_media;

-- ==================================================
-- PRODUCTION READINESS CHECKS
-- ==================================================

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('properties', 'property_media', 'profiles');

-- Verify indexes exist
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('properties', 'property_media')
ORDER BY tablename, indexname;

-- Performance monitoring query (only if pg_stat_statements is enabled)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'pg_stat_statements') THEN
        RAISE NOTICE 'pg_stat_statements is available. Use this query to monitor performance:';
        RAISE NOTICE 'SELECT query, calls, total_time, mean_time FROM pg_stat_statements WHERE query LIKE ''%%properties%%'' ORDER BY total_time DESC LIMIT 10;';
    ELSE
        RAISE NOTICE 'pg_stat_statements extension not enabled. Performance monitoring limited to basic metrics.';
    END IF;
END $$;