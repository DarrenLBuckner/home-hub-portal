# 🏗️ SYSTEM ARCHITECTURE DOCUMENTATION
## Portal Home Hub ↔ Guyana Home Hub Integration

**Last Updated**: Day 1  
**Architecture Status**: ✅ Analyzed & Documented  
**Current State**: Functional but needs hardening  

---

## 🌐 SYSTEM OVERVIEW

```
┌─────────────────┐    API Calls    ┌──────────────────┐
│   GUYANA HOME   │ ─────────────→  │   PORTAL HOME    │
│   HUB (Frontend)│                 │   HUB (Backend)  │
│                 │ ←─────────────  │                  │
└─────────────────┘    JSON Data    └──────────────────┘
        │                                     │
        │                                     │
   [Users Browse]                      [Admins Manage]
   [Properties]                        [Properties]
```

### Architecture Type: **Multi-Tenant Frontend with Centralized Backend**
- **Portal**: Admin/management interface + centralized database
- **Guyana**: Country-specific frontend + proxy layer
- **Connection**: REST API with site-based filtering

---

## 🔄 DATA FLOW MAPPING

### 1. Property Creation Flow
```
Portal Admin Form → Portal API → Database → Public API → Guyana Display
```

**Step-by-Step Process:**

#### A) Portal Property Creation
**File**: `/src/app/dashboard/landlord/create-property/page.tsx`
```typescript
// User fills form with:
title: "Modern 2BR Apartment"
propertyType: "Apartment"
features: ["Pool", "Garage", "Security"]
region: "Region 4"
listing_type: "rent"
site_id: "GY"  // Critical for filtering
```

#### B) Portal API Processing
**File**: `/src/app/api/properties/create/route.ts`
```typescript
// Validates and stores:
const propertyData = {
  title: body.title,
  property_type: body.property_type,
  listing_type: body.listing_type,  // 'sale' | 'rent'
  amenities: normalizedPayload.amenities,  // TEXT[] array
  site_id: selectedCountry,  // 'GY' for Guyana
  status: 'pending'  // Admin approval required
}
```

#### C) Database Storage
**File**: `supabase/create_properties_table.sql`
```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  property_type VARCHAR(50) CHECK (property_type IN ('House', 'Apartment', 'Land', 'Commercial')),
  listing_type VARCHAR(20) CHECK (listing_type IN ('sale', 'rent')),
  amenities TEXT[] DEFAULT '{}',
  site_id VARCHAR(10),  -- Critical for multi-country filtering
  status VARCHAR(20) CHECK (status IN ('draft', 'pending', 'active', 'rejected'))
);
```

#### D) Portal Public API
**File**: `/src/app/api/public/properties/route.ts`
```typescript
// Filters by site and listing type:
let query = supabase.from('properties')
  .select('*, property_media(*)')
  .in('status', ['active', 'pending'])

if (site) {
  query = query.eq('site_id', site)  // site='guyana'
}
if (listing_type) {
  query = query.eq('listing_type', listing_type)  // 'sale'|'rent'
}
```

#### E) Guyana Proxy Layer
**File**: `/guyana-home-hub/src/app/api/properties/route.ts`
```typescript
// Always filters for Guyana properties:
const portalApiUrl = process.env.NEXT_PUBLIC_PORTAL_API_URL
queryParams.set('site', 'guyana')  // Ensures only GY properties

const response = await fetch(`${portalApiUrl}/api/public/properties?${queryParams}`, {
  headers: {
    'x-site-id': 'guyana',  // Additional security header
  }
})
```

#### F) Guyana Frontend Display
**File**: `/guyana-home-hub/src/components/PropertiesListingFixed.tsx`
```typescript
// Fetches and displays properties:
const response = await fetch('/api/properties')  // Hits proxy
const properties = response.data.properties

// Renders with filtering for:
// - Search term, Region, Property type, Price range
// - Bedrooms/Bathrooms, Listing type (sale/rent)
```

---

## 🗃️ DATABASE SCHEMA REFERENCE

### Core Properties Table
```sql
properties (
  id UUID PRIMARY KEY,
  -- Basic Info
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  property_type VARCHAR(50) NOT NULL,
  
  -- Property Details  
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  house_size_value INTEGER,
  house_size_unit VARCHAR(10) DEFAULT 'sq ft',
  amenities TEXT[] DEFAULT '{}',  -- Key for filtering
  
  -- Location
  region VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  site_id VARCHAR(10),  -- Multi-country support
  
  -- System Fields
  user_id UUID REFERENCES profiles(id),
  listing_type VARCHAR(20) DEFAULT 'sale',  -- 'sale' | 'rent'
  listed_by_type VARCHAR(20),  -- 'agent' | 'fsbo' | 'landlord'
  status VARCHAR(20) DEFAULT 'draft',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Related Tables
```sql
property_media (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  media_url VARCHAR(500),
  media_type VARCHAR(20) DEFAULT 'image',
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER
);

profiles (
  id UUID PRIMARY KEY,
  user_type VARCHAR(20),  -- 'agent' | 'fsbo' | 'landlord' | 'admin'
  email VARCHAR(255),
  property_limit INTEGER DEFAULT 1
);
```

---

## 🔌 API ENDPOINTS DOCUMENTATION

### Portal APIs (Backend)

#### 1. Property Creation API
```
POST /api/properties/create
Headers: Cookie-based auth
Body: {
  title, description, price, property_type, 
  listing_type, amenities[], images[], 
  region, city, site_id
}
Response: { success: true, propertyId: UUID }
```

#### 2. Public Properties API
```
GET /api/public/properties?site=guyana&listing_type=rent&limit=50&offset=0
Headers: x-site-id: guyana
Response: {
  properties: Property[],
  total: number,
  limit: number,
  offset: number
}
```

### Guyana APIs (Frontend Proxy)

#### 1. Properties Proxy
```
GET /api/properties
→ Proxies to: Portal /api/public/properties?site=guyana
Response: Same as Portal API
```

#### 2. Individual Property Proxy  
```
GET /api/properties/[id]
→ Proxies to: Portal /api/public/properties/[id]
Response: Single property object
```

---

## ⚙️ CONFIGURATION & ENVIRONMENT

### Portal Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
STRIPE_SECRET_KEY=xxx
RESEND_API_KEY=xxx
```

### Guyana Environment Variables  
```bash
NEXT_PUBLIC_PORTAL_API_URL=https://portalhomehub.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

---

## 🚨 KNOWN ISSUES & SOLUTIONS

### 1. **Amenity Filtering Gap**
**Issue**: Portal stores amenities but Guyana doesn't filter by them  
**Location**: `PropertyFilters.tsx` missing amenity options  
**Solution**: Add amenity checkboxes to match Portal's feature list  
**Priority**: 🔴 Critical  

### 2. **Property Type Mismatch**
**Issue**: Portal supports 6 types, Guyana filters 5  
**Location**: Form constants vs database constraints  
**Solution**: Align property types across both systems  
**Priority**: 🔴 Critical  

### 3. **CORS Security**
**Issue**: Portal API allows `'*'` origin  
**Location**: API response headers  
**Solution**: Restrict to `https://guyanahomehub.com`  
**Priority**: 🔴 Critical  

### 4. **No Rate Limiting**
**Issue**: Public API has no abuse protection  
**Location**: Portal public endpoints  
**Solution**: Add IP-based rate limiting (100 req/min)  
**Priority**: 🔴 Critical  

### 5. **No Caching**
**Issue**: Every page load hits database  
**Location**: Guyana proxy layer  
**Solution**: Add Redis caching with 5-minute TTL  
**Priority**: 🟡 Important  

### 6. **Basic Error Handling**
**Issue**: Poor user experience during API failures  
**Location**: Both Portal and Guyana error responses  
**Solution**: Comprehensive error handling with fallbacks  
**Priority**: 🟡 Important  

---

## 🔒 SECURITY ARCHITECTURE

### Current Security Measures:
✅ **Row Level Security (RLS)** enabled on database  
✅ **User authentication** via Supabase Auth  
✅ **Role-based access control** (admin/agent/fsbo/landlord)  
✅ **Property approval workflow** before public display  

### Security Gaps:
❌ **API authentication** between Portal and Guyana  
❌ **Rate limiting** on public endpoints  
❌ **Input validation** on API requests  
❌ **CORS restriction** to known domains  

### Recommended Security Stack:
```
┌─────────────────┐
│   CloudFlare    │ ← DDoS protection, WAF
├─────────────────┤
│   Rate Limiter  │ ← 100 req/min per IP
├─────────────────┤
│   API Gateway   │ ← Authentication, validation
├─────────────────┤
│   Portal API    │ ← Business logic
├─────────────────┤
│   Database RLS  │ ← Row-level permissions
└─────────────────┘
```

---

## 📊 PERFORMANCE CONSIDERATIONS

### Current Performance:
- **API Response Time**: ~200-500ms (uncached)
- **Database Queries**: Direct PostgreSQL, no optimization
- **Image Loading**: Direct from Supabase storage
- **Frontend**: Client-side rendering only

### Optimization Opportunities:
1. **Caching Layer**: Redis for frequently accessed properties
2. **Database Indexing**: On `site_id`, `listing_type`, `property_type`
3. **CDN**: For property images
4. **API Pagination**: Limit large result sets
5. **Query Optimization**: Use database views for complex queries

### Recommended Performance Stack:
```
User Request
    ↓
CDN (Images) ← Redis Cache ← Database
    ↓              ↓            ↓
Frontend     ← API Server ← Optimized Queries
```

---

## 🔧 MAINTENANCE & MONITORING

### Current Monitoring:
- **Basic**: Console.log statements in APIs
- **Error Tracking**: None implemented
- **Performance**: No metrics collection

### Recommended Monitoring:
- **APM**: Datadog or New Relic for API performance
- **Error Tracking**: Sentry for error collection
- **Logs**: Structured logging with correlation IDs
- **Alerts**: For API failures, high error rates, slow responses

### Health Check Endpoints:
```
GET /api/health → Portal health status
GET /api/status → System status + database connectivity
```

---

## 📈 SCALABILITY PLANNING

### Current Limitations:
- **Single Database**: No read replicas
- **Synchronous Processing**: No background jobs
- **Monolithic API**: All endpoints in one service

### Scaling Strategy:
1. **Horizontal**: Add read replicas for Supabase
2. **Caching**: Implement multi-layer caching
3. **CDN**: Global image delivery
4. **Microservices**: Split by domain (properties, users, payments)
5. **Background Processing**: Queue for heavy operations

### Load Projections:
- **MVP**: 1,000 properties, 100 concurrent users
- **Year 1**: 10,000 properties, 1,000 concurrent users  
- **Year 3**: 100,000 properties, 10,000 concurrent users

*Architecture review recommended every 6 months*