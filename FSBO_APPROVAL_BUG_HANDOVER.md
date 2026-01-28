# FSBO/Landlord Approval System - Technical Handover

## Problem Statement
**FSBO and Landlord approval buttons in the admin dashboard are non-functional. When clicked, they appear to process (button changes state with "Processing" animation), but:**
- Applications remain in the pending list
- No approval is recorded
- User receives no confirmation
- No error messages displayed to admin
- Applications don't disappear after approval attempt

## System Architecture Overview

### User Flow
1. FSBO/Landlord users register at `/register/fsbo` or `/register/landlord`
2. Account auto-approved on signup (status = 'approved') via:
   - `/api/register/fsbo/complete/route.ts` (line 59: `approval_status: 'approved'`)
   - `/api/register/landlord/route.ts` (similar approval setting)
3. Admin views pending applications in `/admin-dashboard/unified` (FSBO tab)
4. Admin clicks Approve/Reject buttons to manage applications

### Data Structures

**OwnerApplication Interface** (unified/page.tsx, line 120-135):
```typescript
interface OwnerApplication {
  id: string;                    // Primary key from RPC result
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: 'owner' | 'landlord';
  plan: string | null;
  is_founding_member: boolean;
  promo_code: string | null;
  country_id: string | null;
  created_at: string;
}
```

**Source Data:**
- Fetched via RPC function: `get_pending_owner_applications()` (line 453)
- Returns join of profiles + auth.users
- Filtered by user_type and admin permissions

### Approval Flow - Code Path

**1. Button Click** (unified/page.tsx, line 2173)
```typescript
<button
  onClick={() => approveOwnerApplication(owner.id)}
  disabled={processingOwnerId === owner.id}
  className="...green-600..."
>
  {processingOwnerId === owner.id ? '⏳' : '✅'} Approve
</button>
```
- Passes `owner.id` (which is the profile user_id from RPC)

**2. Approval Handler** (unified/page.tsx, line 705-780)
```typescript
const approveOwnerApplication = async (userId: string) => {
  if (!userId) {
    setError('Invalid application ID. Please refresh and try again.');
    return;
  }
  
  setProcessingOwnerId(userId);
  setError('');
  
  try {
    const application = pendingOwners.find(a => a.id === userId);
    
    // UPDATE profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        approval_status: 'approved',
        approval_date: new Date().toISOString(),
        approved_by: adminData?.id,
        first_name: application?.first_name || null,
        last_name: application?.last_name || null,
        email: application?.email || null,
        phone: application?.phone || null,
        country_id: application?.country_id || 'GY',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error('❌ Error approving owner:', updateError);
      setError(`Failed to approve: ${updateError.message}`);
      setProcessingOwnerId(null);
      return;
    }
    
    // Send email...
    // Reload data...
    // Alert user...
  }
}
```

### Key Files Involved

| File | Purpose | Last Modified |
|------|---------|----------------|
| `src/app/admin-dashboard/unified/page.tsx` | Main admin dashboard, approval logic | Jan 28, 2026 |
| `src/app/api/register/fsbo/complete/route.ts` | FSBO signup completion, sets auto-approval | Jan 28, 2026 |
| `src/app/api/register/landlord/route.ts` | Landlord signup, sets auto-approval | Jan 28, 2026 |
| `supabase/migrations/20260128_get_pending_owner_applications.sql` | RPC function for fetching pending apps | Jan 28, 2026 |

## Potential Root Causes

### 1. **ID Mismatch**
- `owner.id` from RPC might be different from profiles table primary key
- RPC returns a custom structure - need to verify what `id` actually is
- The update query uses `.eq('id', userId)` which might not be matching any rows

**Test:** Check if the RPC function's `id` field matches the profiles table's user_id

### 2. **Database Constraints**
- `profiles` table might have a check constraint on `approval_status` field
- Valid values might be: 'pending', 'approved', 'denied' (not 'pending_approval')
- Row-level security (RLS) policies might prevent admin from updating

**Test:** Check profiles table schema and RLS policies

### 3. **Missing approval_status Column**
- The `profiles` table might not have an `approval_status` column at all
- Approval status might be stored in a separate table or in `auth.users` metadata

**Test:** Query profiles table schema: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'`

### 4. **RLS Policy Blocking Updates**
- Row-level security might be preventing the admin from updating profiles
- Even with correct ID match, RLS could silently fail

**Test:** Check RLS policies on profiles table: `SELECT * FROM pg_policies WHERE tablename = 'profiles'`

### 5. **Empty Admin Data**
- `adminData?.id` might be null/undefined
- Line 726: `approved_by: adminData?.id` - if admin not loaded, this field is null but shouldn't cause the entire update to fail

**Test:** Log `adminData` before update attempt

## Debugging Steps to Perform

### Step 1: Check Browser Console
1. Open browser DevTools → Console tab
2. Try approving an FSBO application
3. Look for:
   - `❌ Error approving owner:` message
   - Full error object with code, message, hint
   - Network errors

### Step 2: Check Supabase Logs
1. Go to Supabase dashboard → Logs
2. Filter by time of approval attempt
3. Look for SQL errors or RLS policy blocks
4. Check if any UPDATE queries were executed

### Step 3: Verify Data Structure
```sql
-- Check if profiles table exists and has the right columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check what approval_status values exist
SELECT DISTINCT approval_status FROM profiles;

-- Check a specific FSBO user's profile
SELECT id, user_type, approval_status, email, first_name, last_name
FROM profiles
WHERE email = 'getradinggy@gmail.com';
```

### Step 4: Check RPC Function
```sql
-- Verify RPC function returns the correct structure
SELECT * FROM get_pending_owner_applications() LIMIT 1;

-- Check what 'id' actually represents in the result
-- This should return the profiles.id (user_id) not a separate ID
```

### Step 5: Test Update Directly
```sql
-- Manually try the update that the code is attempting
UPDATE profiles 
SET approval_status = 'approved',
    approval_date = NOW(),
    updated_at = NOW()
WHERE id = 'user-uuid-from-rpc';

-- Check if update succeeded (should return 1 if one row updated)
SELECT changes();
```

### Step 6: Check Timestamps
Look at the `approval_date` and `updated_at` fields:
```sql
SELECT id, email, approval_status, approval_date, updated_at
FROM profiles
WHERE user_type = 'owner' 
ORDER BY updated_at DESC 
LIMIT 5;
```

If these don't change after approval attempt, the update isn't being executed.

## Key Questions for Senior Developer

1. **What is the actual ID structure?**
   - Does the RPC function's `id` field equal `profiles.id`?
   - Or does it return `auth.users.id` which needs to be joined?

2. **Where is approval_status stored?**
   - Is it in `profiles` table or `auth.users` metadata?
   - What are the valid values?

3. **What are the RLS policies?**
   - Can the admin user (admin_users table) update profiles rows?
   - Are there any policies preventing updates to non-owned rows?

4. **Is there an approval history table?**
   - Should approvals be recorded in a separate audit/history table?
   - Is that being checked to filter "pending" applications?

5. **Auto-approval on signup - is it working?**
   - Are new FSBO users actually being approved on signup?
   - Or are they starting as pending and need manual approval?

## Actual Behavior vs Expected

**Current State:**
- Users can register for FSBO/Landlord (works)
- Accounts auto-approve on signup (verify this is working)
- Admin can see them in the FSBO pending list (works)
- Admin clicks approve → UI shows processing state → button reverts (no permanent change)
- Applications still appear in pending list (unchanged)
- No error shown to admin

**Expected State:**
- Admin clicks approve
- profiles.approval_status changes to 'approved'
- Application removed from pending list
- Admin receives success confirmation
- User receives approval email

## Commit History
- `44a94c0` - Added agent resubmission workflow
- `eaf3e06` - Fixed agent rejection status constraint
- `d873977` - Fixed reference field storage
- `7373d88` - Removed approval buttons from Landlords section
- `d1d1673` - Improved FSBO approval flow (latest - just added better error reporting)

## Next Steps for Senior Developer

1. **Reproduce the bug locally** with test data
2. **Run the debugging SQL queries** above
3. **Check the RPC function definition** in Supabase
4. **Verify the ID mapping** between RPC result and profiles table
5. **Check RLS policies** - this is likely the culprit
6. **Test manual SQL update** to confirm the issue
7. **Review auth/permissions** - ensure admin has right role/permissions
8. **Check if a separate approval table exists** that's being queried for "pending" status

## Related Issues
- Similar approval flow for agents works fine (in Agents tab)
- Property approval works fine
- The main difference: FSBO/Landlord data comes from RPC, agents data comes from agent_vetting table

---
**Document Created:** January 28, 2026  
**Last Updated:** January 28, 2026  
**Status:** Needs Senior Dev Investigation
