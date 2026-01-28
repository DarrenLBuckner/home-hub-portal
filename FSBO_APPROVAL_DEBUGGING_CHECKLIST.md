# FSBO Approval Bug - Debugging Checklist

## Quick Diagnosis Checklist

### [ ] Step 1: Browser Console Investigation
**Location:** Admin Dashboard (portal-home-hub.com/admin-dashboard/unified) → FSBO Tab

**Actions:**
1. Open DevTools (F12) → Console tab
2. Set log level to "All" to see verbose output
3. Click Approve on any FSBO application
4. **Capture:**
   - [ ] Full console error output
   - [ ] Network tab - check XHR/Fetch calls
   - [ ] Any error codes (PGRST, RLS, etc.)
   - [ ] Post-approval state - does processing state clear?

**Expected vs Actual:**
- Expected: Error message shows in red on dashboard
- Actual: Silent failure, no error message

---

### [ ] Step 2: Supabase Direct Query Test

**Location:** Supabase Dashboard → SQL Editor

**Query 1: Check profiles table structure**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```
**Result needed:** Confirm `approval_status` column exists and column type

---

**Query 2: Check if FSBO user exists in profiles**
```sql
SELECT id, email, user_type, approval_status, created_at, updated_at
FROM profiles
WHERE email IN ('getradinggy@gmail.com', 'ryanx54@yahoo.com', 'jairamrachel@gmail.com')
LIMIT 10;
```
**Result needed:** 
- [ ] User records exist?
- [ ] What are their current approval_status values?
- [ ] Are they 'pending', 'approved', NULL, or something else?

---

**Query 3: Run the RPC function to see what it returns**
```sql
SELECT * FROM get_pending_owner_applications()
WHERE email IN ('getradinggy@gmail.com', 'ryanx54@yahoo.com')
LIMIT 2;
```
**Result needed:**
- [ ] Does RPC return rows?
- [ ] What is the `id` field value? (should match profiles.id)
- [ ] What other fields are returned?

---

**Query 4: Manually test the update operation**
```sql
-- Get the actual ID first
SELECT id FROM profiles WHERE email = 'getradinggy@gmail.com' LIMIT 1;

-- Then try the update (replace USER_ID_HERE with actual ID from above)
UPDATE profiles 
SET approval_status = 'approved',
    approval_date = NOW(),
    updated_at = NOW()
WHERE id = 'USER_ID_HERE';

-- Check if it worked
SELECT id, email, approval_status, approval_date, updated_at
FROM profiles
WHERE email = 'getradinggy@gmail.com';
```
**Result needed:**
- [ ] UPDATE succeeds (no error)?
- [ ] Rows affected = 1?
- [ ] approval_status actually changed?

---

### [ ] Step 3: RLS Policy Check

**Location:** Supabase Dashboard → Authentication → Policies

**Query to check policies:**
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
```

**Check for:**
- [ ] Is there a policy blocking UPDATE operations?
- [ ] Does admin role have SELECT/UPDATE permissions?
- [ ] Are there USING or WITH CHECK clauses limiting who can update?

---

### [ ] Step 4: Admin User Permissions

**Verify admin has proper permissions:**
```sql
-- Check if current session user is admin
SELECT 
  id, 
  email, 
  user_type,
  (SELECT * FROM admin_users WHERE user_id = profiles.id) as admin_role
FROM profiles 
WHERE id = 'ADMIN_USER_ID_HERE';

-- Check admin_users table
SELECT * FROM admin_users WHERE user_id = 'ADMIN_USER_ID_HERE';
```

**Check for:**
- [ ] Admin record exists?
- [ ] Admin has 'super' or 'owner' level?
- [ ] country_id matches or is NULL (for all access)?

---

### [ ] Step 5: Check for Triggers or Constraints

**Look for database-level issues:**
```sql
-- Check table constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'profiles';

-- Check if there's a trigger that might be blocking
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- Check column constraints on approval_status
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'approval_status';
```

**Check for:**
- [ ] CHECK constraints that limit approval_status values?
- [ ] Triggers that might be failing?
- [ ] DEFAULT values that might be overwriting?

---

### [ ] Step 6: Timeline Analysis

**Capture timestamps to trace the issue:**
```sql
-- Before approval attempt - note these times
SELECT NOW() as current_time;

-- [ADMIN CLICKS APPROVE IN UI]
-- Wait 5 seconds
-- [CHECK DATABASE]

SELECT 
  id,
  email,
  approval_status,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) as seconds_since_update
FROM profiles
WHERE email IN ('getradinggy@gmail.com', 'ryanx54@yahoo.com')
ORDER BY updated_at DESC;
```

**What to look for:**
- [ ] Do any `updated_at` timestamps show recent changes?
- [ ] Or are all timestamps old (meaning no update executed)?

---

### [ ] Step 7: Comparison with Working Code

**Agent approval (which works) vs FSBO approval (which doesn't):**

**Agent Approval Flow** (works fine):
- Location: unified/page.tsx, line 620-680
- Updates: `agent_vetting` table
- Status field: `status` (valid values: 'pending_review', 'approved', 'denied')
- Filter for pending: `.in('status', ['pending_review'])`

**FSBO Approval Flow** (broken):
- Location: unified/page.tsx, line 705-780
- Updates: `profiles` table
- Status field: `approval_status` (valid values: ?)
- Filter for pending: RPC function `get_pending_owner_applications()`

**Key Difference:**
- Agents: Update native table, simple status field
- FSBO: Update joined table from RPC, complex approval_status field
- Hypothesis: The RPC might be returning a user_id that doesn't match profiles.id

---

## Critical Questions to Answer

| Question | Answer | Why Important |
|----------|--------|-------------------|
| Does profiles.approval_status column exist? | [ ] Yes [ ] No | If not, update fails silently |
| What are valid values for approval_status? | | If 'approved' is invalid, update rejected |
| Does RPC's `id` = profiles.id? | [ ] Yes [ ] No | Wrong ID = rows don't match |
| Are there RLS policies on profiles? | [ ] Yes [ ] No | Policies might block admin updates |
| Is the admin user in admin_users table? | [ ] Yes [ ] No | Admin role required for permissions |
| Is the manual SQL update working? | [ ] Yes [ ] No | If manual works but code doesn't = app logic issue |

---

## One-Time Full Diagnostic

**Run this comprehensive check:**

```sql
-- SECTION 1: TABLE SCHEMA
SELECT 'PROFILES TABLE SCHEMA' as section;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- SECTION 2: RLS POLICIES
SELECT 'RLS POLICIES' as section;
SELECT policyname, roles, qual 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- SECTION 3: TEST DATA
SELECT 'CURRENT FSBO USERS' as section;
SELECT id, email, user_type, approval_status, updated_at
FROM profiles
WHERE user_type IN ('owner', 'landlord')
LIMIT 5;

-- SECTION 4: RPC OUTPUT
SELECT 'RPC FUNCTION OUTPUT' as section;
SELECT id, email, first_name, user_type, approval_status
FROM get_pending_owner_applications()
LIMIT 5;

-- SECTION 5: ADMIN USER
SELECT 'ADMIN USER' as section;
SELECT u.id, u.email, a.admin_level
FROM profiles u
LEFT JOIN admin_users a ON u.id = a.user_id
WHERE a.user_id IS NOT NULL
LIMIT 1;

-- SECTION 6: TEST UPDATE
SELECT 'MANUAL UPDATE TEST' as section;
-- Get first pending FSBO user
WITH target_user AS (
  SELECT id FROM profiles WHERE user_type = 'owner' LIMIT 1
)
UPDATE profiles 
SET approval_status = 'approved', updated_at = NOW()
WHERE id = (SELECT id FROM target_user)
RETURNING id, email, approval_status, updated_at;
```

---

## Success Indicators

Once fixed, you should see:
1. ✅ Browser console shows success message
2. ✅ No errors in Supabase logs
3. ✅ Manual SQL update works
4. ✅ approval_status changes in database
5. ✅ Application disappears from pending list (after refresh)
6. ✅ User receives approval email
7. ✅ approval_date is populated

---

**Status: Awaiting Senior Developer Investigation**
