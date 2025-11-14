# Property Detail Images Bug - Need Senior Developer Analysis

## Issue Summary
Property detail pages show "No images found" despite images existing in database and working correctly in property list views. This is a critical user-facing bug affecting the consumer site experience.

## System Architecture
- **Portal Home Hub** (admin backend): `https://portalhomehub.com` - handles property CRUD, approval workflows
- **Guyana Home Hub** (consumer site): `https://guyanahomehub.com` - public-facing property listings
- **Multi-tenant setup**: Properties filtered by `site_id` ('guyana', 'jamaica')
- **API Proxy Pattern**: Guyana → Portal API → Supabase Database

## Database Structure
```sql
-- Properties table
properties (id, title, site_id, status, user_id, ...)

-- Property media table  
property_media (id, property_id, media_url, media_type, display_order, is_primary)
-- Foreign key: property_media.property_id → properties.id
```

## Current Data State
- **Database has images**: 72 total property_media records, 10 images for test property `7be8f86c-8dd0-4248-95b1-0aada62ab0ff`
- **List API works**: Properties list shows images correctly (thumbnail view)
- **Detail API broken**: Single property API returns empty images array

## What Works ✅
1. **Property List API** (`/api/public/properties`):
   ```typescript
   .select(`
     *,
     property_media!property_media_property_id_fkey (
       media_url, media_type, display_order, is_primary
     )
   `)
   ```
   Returns 10 images correctly, transforms to `images` array successfully

2. **Property Creation/Edit**: Images upload and save to database properly
3. **Admin Dashboard**: Shows properties with correct image counts

## What Fails ❌
1. **Single Property API** (`/api/public/properties/[id]`):
   - Uses identical foreign key relationship syntax
   - Returns `property_media: null` or `property_media: []`
   - Transformation creates empty `images: []` array
   - Frontend displays "No images found"

## Investigation Attempts
### Foreign Key Relationship
- ✅ Tried: `property_media!property_media_property_id_fkey` (same as working list API)
- ✅ Tried: Direct `property_media (...)` syntax
- ✅ Tried: Manual separate queries for property and media
- ❌ Result: All return empty property_media

### API Debugging
- ✅ Added extensive console logging (server-side, not visible in browser)
- ✅ Added debug info directly in API response
- ✅ Verified property ID, site filtering, API chain
- ❌ Issue: Still no debugging output visible

### Environment/Deployment
- ✅ Verified Portal API deployments active
- ✅ Tested different Vercel deployments
- ✅ Hardcoded API URLs to bypass env vars
- ❌ Issue: Consistent behavior across all deployments

## Current Debug Output
```javascript
// Frontend console (Guyana Home Hub)
🔍 FRONTEND: Requesting property ID: 7be8f86c-8dd0-4248-95b1-0aada62ab0ff
🔍 FRONTEND: Response status: 200
TITLE: Beautiful 5 Bedroom Home Ready For Rent
SITE_ID: guyana
HAS IMAGES FIELD: true
IMAGES COUNT: 0                    // ← THE PROBLEM
HAS PROPERTY_MEDIA FIELD: false    // ← ROOT CAUSE
PROPERTY_MEDIA COUNT: 0
```

## Hypothesis
The foreign key relationship `property_media!property_media_property_id_fkey` works in list queries but fails in single property queries. Possible causes:
1. **Supabase Query Limit**: Single `.single()` query may not properly join related records
2. **Foreign Key Constraint Name**: May be incorrect or different than expected
3. **RLS/Permissions**: Row Level Security might block property_media in single queries
4. **Data Inconsistency**: Test property may have orphaned records

## Recommended Senior Developer Actions

### 1. Database Investigation
```sql
-- Check foreign key constraint exists and is named correctly
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'property_media';

-- Test direct query for our problem property
SELECT p.*, pm.* 
FROM properties p 
LEFT JOIN property_media pm ON pm.property_id = p.id 
WHERE p.id = '7be8f86c-8dd0-4248-95b1-0aada62ab0ff';

-- Check if RLS is blocking queries
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('properties', 'property_media');
```

### 2. Supabase Query Testing
Test these queries directly in Supabase SQL editor:
```sql
-- Mimic the working list API query
SELECT properties.*, property_media.*
FROM properties
LEFT JOIN property_media ON property_media.property_id = properties.id
WHERE properties.site_id = 'guyana' AND properties.status = 'active';

-- Mimic the broken single property query  
SELECT properties.*, property_media.*
FROM properties  
LEFT JOIN property_media ON property_media.property_id = properties.id
WHERE properties.id = '7be8f86c-8dd0-4248-95b1-0aada62ab0ff';
```

### 3. API Comparison
Compare working vs broken API responses:
- Working: `GET /api/public/properties?site=guyana&limit=1` 
- Broken: `GET /api/public/properties/7be8f86c-8dd0-4248-95b1-0aada62ab0ff`

### 4. Quick Fix Attempt
If foreign key relationship is the issue, try manual JOIN approach:
```typescript
// In single property API, replace foreign key with manual query
const { data: property } = await supabase.from('properties')...
const { data: media } = await supabase.from('property_media')
  .select('*').eq('property_id', id)
const result = { ...property, property_media: media }
```

## Files to Review
- Portal API (single): `/src/app/api/public/properties/[id]/route.ts`
- Portal API (list): `/src/app/api/public/properties/route.ts` 
- Guyana Proxy: `/src/app/api/properties/[id]/route.ts`
- Frontend: `/src/app/properties/[id]/page.tsx`

## Expected Outcome
Single property API should return:
```json
{
  "id": "7be8f86c-8dd0-4248-95b1-0aada62ab0ff",
  "title": "Beautiful 5 Bedroom Home Ready For Rent",
  "images": [
    "https://supabase-url/image1.jpg",
    "https://supabase-url/image2.jpg",
    // ... 8 more images
  ],
  "property_media": [
    {"media_url": "...", "media_type": "image", "display_order": 1},
    // ... 9 more objects
  ]
}
```

## Priority: HIGH
This affects all property detail pages across the consumer site. Users can see properties in listings but cannot view images when clicking for details, severely impacting user experience and property showcase functionality.