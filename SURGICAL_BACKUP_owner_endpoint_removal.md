# 🏥 SURGICAL REMOVAL DOCUMENTATION
## Legacy /api/register/owner Endpoint Removal

**Date:** 2025-11-26
**Patient:** Portal Home Hub Registration System  
**Operation:** Remove legacy owner registration endpoint
**Surgeon:** Claude Code Assistant

---

## 📋 PRE-OPERATIVE STATE

### Current Registration Architecture:
1. **WORKING ENDPOINTS:**
   - `/api/register/agent` → agent registration (4-step form)
   - `/api/register/fsbo` → FSBO registration (property sales) 
   - `/api/register/landlord` → landlord registration (rentals)

2. **PROBLEMATIC ENDPOINT:**
   - `/api/register/owner` → Legacy broken endpoint

### Database Schema (profiles table):
```sql
user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'agent', 'fsbo', 'landlord'))
```
**Note:** 'owner' is NOT in allowed user_types

### Files Found:
- **Main File:** `/src/app/api/register/owner/route.ts` (44 lines)
- **Dashboard:** `/src/app/dashboard/owner/` (may exist)
- **Related:** Country migration SQL mentions 'owner' user_type

---

## 🔍 DEPENDENCIES TO CHECK:
1. Any frontend forms calling `/api/register/owner`
2. Dashboard pages for user_type 'owner'  
3. Database references to 'owner' user_type
4. Navigation/routing that includes 'owner'
5. Any imports or references to owner registration

---

## 📁 BACKUP COPIES:
(Will be created before any modifications)

---

## 🧪 TEST PLAN:
After each step, verify:
1. ✅ Agent registration works (`/register?type=agent`)
2. ✅ FSBO registration works (`/register/fsbo`) 
3. ✅ Landlord registration works (`/register/landlord`)
4. ✅ Admin panel accessible
5. ✅ No broken links or 404 errors

---

## 🚨 ROLLBACK PLAN:
If ANY registration breaks:
1. Immediately restore from backup files
2. Test all registrations again
3. Document what caused the break
4. Plan alternative approach

---

## 📝 SURGICAL NOTES:

### 🚨 **OPERATION HALTED - CRITICAL FINDINGS:**

**DISCOVERY 1:** `user_type: 'owner'` IS actively used in the system!
- `/src/app/dashboard/owner/` - Complete dashboard exists for owner users
- Multiple pages: create-property, edit-property, settings, main page  
- Dashboard checks: `if (profile.user_type === 'owner')`

**DISCOVERY 2:** FSBO users ARE created as `user_type: 'owner'`!
- `/api/register/fsbo/complete/route.ts` creates `user_type: 'owner'`
- This means FSBO = Owner in the system
- Dashboard/owner is the FSBO dashboard

**DISCOVERY 3:** Database schema conflict found!
- Profiles table: `user_type IN ('admin', 'agent', 'fsbo', 'landlord')`  
- Code uses: `user_type: 'owner'`
- This explains registration failures!

**DIAGNOSIS:** 
The issue is NOT the `/api/register/owner` endpoint - it's that the database schema excludes 'owner' but the code expects it to exist for FSBO users.

**NEW PLAN REQUIRED:**
Either:
1. Update schema to include 'owner' in allowed types
2. Change all 'owner' references to 'fsbo' 
3. Fix FSBO registration to use correct user_type

**STATUS:** Operation suspended pending further analysis
