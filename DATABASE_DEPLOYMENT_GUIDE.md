# 🗄️ Phase 1: Database Schema Deployment Guide

## 📋 SAFETY CHECKLIST BEFORE DEPLOYMENT

✅ **Current system is stable** - Autosave disabled, no duplicates occurring  
✅ **Database scripts created** - Separate draft system, no existing table modifications  
✅ **Verification script ready** - Comprehensive testing without data loss risk  
✅ **Rollback plan available** - Simple DROP TABLE if needed (no existing data affected)  

## 🚀 DEPLOYMENT STEPS

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Portal Home Hub project
3. Navigate to **SQL Editor**

### Step 2: Run Database Schema Creation
1. Open the file: `supabase/create_property_drafts_table.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. ✅ Should see: `Success. No rows returned`

### Step 3: Verify Installation
1. Open the file: `supabase/verify_property_drafts_schema.sql`  
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. ✅ Should see multiple "✅ PASS" results

### Step 4: Check Table Browser
1. Navigate to **Table Editor** in Supabase
2. ✅ Should see new table: `property_drafts`
3. ✅ Verify existing tables still present: `properties`, `profiles`, `countries`
4. ✅ No data should be in `property_drafts` yet (empty table)

## 🎯 EXPECTED RESULTS

After successful deployment:

```
✅ property_drafts table exists
✅ Required columns exist  
✅ Performance indexes created
✅ Row Level Security enabled
✅ RLS policies created
✅ Utility functions created
✅ Auto-update trigger created
✅ Properties table unaffected
✅ Profiles table unaffected  
✅ Existing data preserved
```

## 🚨 ROLLBACK PROCEDURE (if needed)

If anything goes wrong, you can safely remove everything:

```sql
-- Emergency rollback - removes all new draft system components
DROP TABLE IF EXISTS property_drafts CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_drafts();
DROP FUNCTION IF EXISTS extend_draft_expiration(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_user_draft_count(UUID);
DROP FUNCTION IF EXISTS update_property_drafts_updated_at();
```

## 🔍 WHAT THIS CREATES

### New Table: `property_drafts`
- **Purpose**: Store draft data separately from published properties
- **Storage**: JSONB format for flexible form data
- **Security**: RLS policies ensure users only see their own drafts
- **Performance**: Optimized indexes for fast queries
- **Cleanup**: Auto-expiration after 30 days

### No Impact on Existing System
- ✅ Properties table unchanged
- ✅ Profiles table unchanged  
- ✅ All existing functionality preserved
- ✅ Current autosave still disabled (preventing duplicates)
- ✅ All advanced features still working

## 📊 MONITORING

After deployment, you can monitor:

```sql
-- Check draft system is working
SELECT COUNT(*) as total_drafts FROM property_drafts;

-- Check for any errors in logs
SELECT * FROM property_drafts LIMIT 1;
```

## ✅ SUCCESS CRITERIA

Phase 1 is complete when:
- [ ] Database scripts run without errors
- [ ] Verification script shows all ✅ PASS results  
- [ ] Table browser shows new `property_drafts` table
- [ ] Existing website functionality unchanged
- [ ] Ready to proceed to Phase 2 (API development)

---

**Next Phase**: API Development (`/api/drafts/*` endpoints)  
**Timeline**: Ready to proceed once database verification passes  
**Risk Level**: ⚪ LOW - No existing functionality affected