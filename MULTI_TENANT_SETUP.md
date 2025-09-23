# Multi-Tenant Setup Guide

## Overview
Portal Home Hub now supports multi-tenant architecture with site-based property filtering. This allows Guyana Home Hub and future Ghana Home Hub to show only relevant properties.

## Database Migration

### 1. Run the Migration Script
Execute the migration script to add site_id column and create the tenants table:

```sql
-- In your Supabase SQL editor, run:
\i database-site-migration.sql
```

### 2. Verify Migration
Check that properties are properly assigned to sites:

```sql
SELECT site_id, COUNT(*) as property_count
FROM properties 
GROUP BY site_id;
```

## API Usage

### Properties API with Site Filtering

**Get all properties (Portal admin view):**
```
GET /api/public/properties
```

**Get Guyana properties only:**
```
GET /api/public/properties?site=guyana
```

**Get Ghana properties only:**
```
GET /api/public/properties?site=ghana
```

**Alternative using header:**
```
GET /api/public/properties
Headers: x-site-id: guyana
```

### Public Favorites API

**Add to favorites:**
```
POST /api/public/favorites
{
  "user_email": "user@example.com",
  "property_id": "property-uuid",
  "site_id": "guyana"
}
```

**Get user's favorites:**
```
GET /api/public/favorites?email=user@example.com&site=guyana
```

**Remove from favorites:**
```
DELETE /api/public/favorites
{
  "user_email": "user@example.com",
  "property_id": "property-uuid"
}
```

**Check if property is favorited:**
```
GET /api/public/favorites/check?email=user@example.com&property_id=property-uuid
```

## Site Configuration

### Tenant Mapping
- `portal` - Portal Home Hub (all countries)
- `guyana` - Guyana Home Hub
- `ghana` - Ghana Home Hub (future)

### Country to Site Mapping
Properties are automatically assigned to sites based on country/region:
- Countries containing "Guyana" → `site_id = 'guyana'`
- Countries containing "Ghana" → `site_id = 'ghana'`
- All others → `site_id = 'portal'`

## Frontend Integration

### Guyana Home Hub
The Guyana frontend now automatically filters to show only Guyana properties:
- Properties API: Adds `?site=guyana` parameter
- Individual property calls: Adds `x-site-id: guyana` header
- Favorites: Uses new public API with site filtering

### Portal Home Hub
- Shows all properties by default (admin view)
- Can filter by site using query parameters
- Property creation automatically sets site_id based on country

## Security Features

### Database Level
- Added indexes for efficient site-based queries
- Check constraints ensure valid site_id values
- Tenant reference table for consistency

### API Level
- CORS headers properly configured
- Site filtering prevents cross-tenant data access
- Property snapshots in favorites for data consistency

## Performance Optimizations

### Indexes Added
```sql
-- Site-based filtering
CREATE INDEX idx_properties_site_id ON properties(site_id);
CREATE INDEX idx_properties_site_status ON properties(site_id, status);
CREATE INDEX idx_properties_site_created ON properties(site_id, created_at DESC);

-- Public favorites
CREATE INDEX idx_public_favorites_email ON public_favorites(user_email);
CREATE INDEX idx_public_favorites_site ON public_favorites(site_id);
```

### Recommended Next Steps
1. **Database Partitioning**: For 10M+ properties, consider partitioning by site_id
2. **Read Replicas**: Set up regional read replicas for better performance
3. **CDN Strategy**: Implement CDN with site-based caching rules
4. **Monitoring**: Add site-specific analytics and monitoring

## Troubleshooting

### If properties aren't showing on Guyana Hub:
1. Check that properties have `site_id = 'guyana'`
2. Verify the migration script ran successfully
3. Ensure API calls include site filtering

### If favorites aren't working:
1. Check that `public_favorites` table exists
2. Verify API endpoints are accessible with CORS
3. Ensure user_email is being passed correctly

## Future Site Addition

To add a new site (e.g., Ghana):

1. **Add tenant:**
```sql
INSERT INTO tenants VALUES ('ghana', 'Ghana Home Hub', 'ghanahomehub.com', 'GHA', 'Ghana');
```

2. **Update mapping function:**
```sql
-- Update get_site_id_from_country() function to include Ghana logic
```

3. **Create frontend:** Similar to Guyana Hub with `site=ghana` parameter

4. **Deploy:** Set up domain and environment variables