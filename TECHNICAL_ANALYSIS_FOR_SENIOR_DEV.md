# Technical Analysis: Property Autosave Architecture Issue

## Summary
I need your expertise on a critical architectural decision for our property creation system. I've identified a fundamental design flaw in our autosave implementation that caused production issues (17 duplicate properties from single submission) and implemented a temporary fix. Now I need to architect a permanent solution.

## Current System Analysis

### Architecture Overview
- **Frontend**: Next.js 15.4.7 property creation forms (basic + advanced agent dashboard)
- **Backend**: Supabase PostgreSQL with service role authentication
- **API**: `/api/properties/create` handles both drafts and final submissions
- **Users**: Agents, landlords, FSBO, admins creating property listings

### The Problem I Discovered

**Root Cause**: The autosave system calls the same API endpoint that creates actual property records.

```javascript
// Current (BROKEN) Architecture:
saveDraft(formData) → /api/properties/create (with _isDraftSave: true flag)
submitProperty(formData) → /api/properties/create (with _isDraftSave: false)
```

**What Happened**:
1. User fills property form with images
2. Autosave triggers every 30 seconds + on data changes
3. API was failing due to File object serialization issues
4. Multiple autosave requests queued up (retry mechanism)
5. When I fixed the API, all queued requests succeeded simultaneously
6. Result: 17 identical property records in database

### Current System State

**Files Analyzed**:
- `src/app/dashboard/agent/create-property/page.tsx` - Advanced form with AI features
- `src/app/properties/create/page.tsx` - Basic property creation form  
- `src/lib/draftManager.ts` - Draft saving logic (calls properties API)
- `src/hooks/useAutoSave.ts` - Autosave timing and retry logic
- `src/app/api/properties/create/route.ts` - Single endpoint handling both drafts and properties

**Temporary Fix Applied**:
```javascript
// Line 142 in agent dashboard:
const eligible = false; // isAutoSaveEligible(profileData);
```
- ✅ Prevents duplicates
- ✅ All features preserved (AI description, amenities, completion incentives)
- ⚠️ No draft saving whatsoever

## Proposed Architecture Solution

### Option B: Proper Draft System (My Recommendation)

**New Architecture**:
```
Drafts: saveDraft() → /api/drafts/save → property_drafts table
Properties: submitProperty() → /api/properties/create → properties table
```

**Database Schema**:
```sql
CREATE TABLE property_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  draft_data JSONB NOT NULL,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_property_drafts_user_id ON property_drafts(user_id);
CREATE INDEX idx_property_drafts_expires_at ON property_drafts(expires_at);
```

**New API Endpoints**:
- `POST /api/drafts/save` - Save/update draft
- `GET /api/drafts/list` - List user's drafts  
- `GET /api/drafts/[id]` - Load specific draft
- `DELETE /api/drafts/[id]` - Delete draft
- `POST /api/drafts/[id]/publish` - Convert draft to property

**Implementation Plan**:
1. Create drafts table in Supabase
2. Build draft API endpoints
3. Update `draftManager.ts` to use draft APIs
4. Re-enable autosave (pointing to draft system)
5. Add draft management UI (load, delete, publish)

## Questions for Your Review

**1. Architecture Concerns**:
- Do you see any issues with separating drafts and properties into different tables?
- Should we use JSONB for draft_data or normalize the draft structure?
- Any concerns with the 30-day auto-expiration approach?

**2. User Experience**:
- Our users are professional agents/landlords who work across devices
- Should drafts sync across devices (server-side) or stay local (localStorage)?
- How should we handle draft conflicts if user edits same draft on multiple devices?

**3. Performance & Scale**:
- Autosave frequency: Currently 30 seconds + on data changes with 2-second debounce
- Expected: 100+ agents creating ~10 properties/day each
- Any optimization concerns with this autosave frequency?

**4. Data Migration**:
- We have existing property records with `status: 'draft'` mixed in properties table
- Should we migrate these to the new drafts table or leave them?

**5. Error Handling**:
- Current system has retry logic that caused the duplication issue
- How should we handle draft save failures without creating duplicates?

**6. Security**:
- Should drafts have same permission model as properties?
- Any additional security considerations for draft data?

## Alternative I Considered (But Rejected)

**Option A: localStorage Drafts**
- Pro: No server complexity, works offline
- Con: Device-specific, limited storage, doesn't fit professional workflow
- Verdict: Too simplistic for our user base

## Current Business Impact

**Immediate**: System working, no duplicates, all features preserved
**Short-term**: Users losing work when browser crashes/navigates away
**Long-term**: Professional users will expect draft functionality for competitive platform

## Senior Developer Review - APPROVED ✅

**Executive Summary**: Architecture validated, enhanced schema provided, implementation green-lit.

### Key Enhancements from Review:
1. **Enhanced Database Schema** with RLS policies and proper indexing
2. **Comprehensive API Architecture** with sanitization and validation
3. **Improved Error Handling** preventing the original duplication issue
4. **Performance Optimizations** for 100+ concurrent agents
5. **Security Best Practices** with proper permission models

### Critical Insights:
- **JSONB for drafts is correct** - flexible schema, fast writes
- **Server-side storage essential** - professional agents work cross-device
- **Last-write-wins sufficient** for conflict resolution
- **30-day expiration optimal** with UI warnings at 25 days
- **Remove aggressive retry logic** - failed autosave isn't critical

### Architecture Validation:
- ✅ Separation of concerns (drafts ≠ properties)
- ✅ Scalability for expected load (1.7 requests/second peak)
- ✅ Security with comprehensive RLS policies
- ✅ Data integrity with proper sanitization
- ✅ Performance optimized for mobile-first Caribbean market

**RECOMMENDATION: PROCEED WITH IMPLEMENTATION**

---
*System currently deployed at: https://portal-home-gvf2fgsx9-darren-lb-uckner-s-projects.vercel.app*
*Senior Developer Review: Full implementation guide provided*