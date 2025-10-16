# 🇯🇲 JAMAICA ADMIN SETUP

**Phase:** 5 of 7 - Admin Setup  
**Status:** In Progress  
**Dependencies:** Phases 1-4 ✅  
**Critical:** Ensures complete operational separation between countries

---

## 🎯 ADMIN ISOLATION REQUIREMENTS

### **Core Principle:** 
Jamaica admins should **ONLY** see Jamaica data. Guyana admins should **ONLY** see Guyana data. **Zero cross-contamination.**

### **Admin User Types:**
1. **Jamaica Super Admin** - Full Jamaica operations control
2. **Jamaica Content Admin** - Property approval, user management  
3. **Jamaica Support Admin** - Customer support, basic operations

---

## 🔐 ADMIN ACCOUNT CREATION PLAN

### **Step 1: Create Jamaica Admin Accounts**
```sql
-- Create Jamaica admin profiles
-- Note: These will be created via the normal registration flow
-- but with manual profile updates to set country and admin status

-- 1. Register normal accounts first
-- 2. Update profiles to set country and admin permissions
-- 3. Verify country isolation works

UPDATE profiles 
SET 
  user_type = 'admin',
  country_code = 'JM',
  admin_permissions = '{"country":"JM","level":"super","properties":true,"users":true,"pricing":true}'::jsonb,
  is_active = true,
  updated_at = NOW()
WHERE email = 'jamaica.admin@jamaicahomehub.com';
```

### **Step 2: Admin Permission System**
```typescript
// src/lib/admin-permissions.ts
export interface AdminPermissions {
  country: 'GY' | 'JM';
  level: 'super' | 'content' | 'support';
  properties: boolean;
  users: boolean;
  pricing: boolean;
  analytics: boolean;
}

export function validateAdminAccess(
  userCountry: string, 
  requestedCountry: string,
  adminPermissions: AdminPermissions
): boolean {
  // Rule 1: Admin can only access their own country
  if (userCountry !== requestedCountry) {
    return false;
  }
  
  // Rule 2: Admin permissions must match country
  if (adminPermissions.country !== userCountry) {
    return false;
  }
  
  return true;
}
```

### **Step 3: Database Query Filtering**
```typescript
// Enhanced admin queries with country filtering
export async function getAdminData(userProfile: any) {
  const supabase = await createClient();
  const userCountry = userProfile.country_code;
  
  // Properties - filtered by country
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('country_code', userCountry); // Add this column if needed
  
  // Users - filtered by country
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('country_code', userCountry);
  
  // Pricing plans - filtered by country
  const { data: pricingPlans } = await supabase
    .from('pricing_plans')
    .select('*')
    .like('plan_name', `%${userCountry === 'JM' ? 'Jamaica' : 'Guyana'}%`);
  
  return { properties, users, pricingPlans };
}
```

---

## 🛠️ IMPLEMENTATION STEPS

### **Step 1: Update Profiles Table** ✅ (if needed)
```sql
-- Check if country_code column exists in profiles
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'country_code';

-- Add if missing (may already exist)
-- ALTER TABLE profiles ADD COLUMN country_code TEXT DEFAULT 'GY';
```

### **Step 2: Create Admin Helper Functions**
```typescript
// src/lib/admin-country.ts
export async function getAdminCountryContext(userId: string) {
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('country_code, user_type, admin_permissions')
    .eq('id', userId)
    .single();
  
  if (!profile || profile.user_type !== 'admin') {
    throw new Error('Not authorized');
  }
  
  return {
    country: profile.country_code,
    permissions: profile.admin_permissions,
    isJamaicaAdmin: profile.country_code === 'JM',
    isGuyanaAdmin: profile.country_code === 'GY'
  };
}
```

### **Step 3: Update Admin Dashboard Components**
- Filter data by admin's country
- Show country indicator in admin UI
- Add country-specific branding
- Implement admin permission checks

### **Step 4: Create Jamaica Admin Accounts**
1. **Register via normal flow**: /register with Jamaica email
2. **Manual profile update**: Set admin permissions + country
3. **Test access**: Verify Jamaica-only data visibility
4. **Document credentials**: Secure credential management

---

## 🧪 TESTING PLAN

### **Admin Isolation Tests:**
1. **Jamaica Admin Login** → Should see only Jamaica data
2. **Guyana Admin Login** → Should see only Guyana data  
3. **Cross-country access attempt** → Should be blocked
4. **Data modification** → Should only affect admin's country
5. **User management** → Should only see country-specific users

### **Test Scenarios:**
```typescript
// Test cases to verify
const testCases = [
  {
    admin: 'jamaica.admin@jamaicahomehub.com',
    country: 'JM',
    shouldSee: ['Jamaica properties', 'Jamaica users', 'Jamaica pricing'],
    shouldNotSee: ['Guyana properties', 'Guyana users', 'Guyana pricing']
  },
  {
    admin: 'guyana.admin@guyanahomehub.com', 
    country: 'GY',
    shouldSee: ['Guyana properties', 'Guyana users', 'Guyana pricing'],
    shouldNotSee: ['Jamaica properties', 'Jamaica users', 'Jamaica pricing']
  }
];
```

---

## 🚨 SECURITY CONSIDERATIONS

### **Critical Security Rules:**
1. **Country validation on every admin query**
2. **Admin permissions stored in secure profile field**
3. **No cross-country data leakage**
4. **Audit logs for admin actions**
5. **Session country validation**

### **Failure Modes to Prevent:**
- Jamaica admin seeing Guyana properties ❌
- Guyana admin modifying Jamaica users ❌  
- Admin accessing wrong country data ❌
- Permission escalation across countries ❌

---

## 📊 SUCCESS CRITERIA

**Technical Goals:**
- [ ] Jamaica admin accounts created and functional
- [ ] Complete data isolation verified
- [ ] Admin dashboard shows correct country data only
- [ ] Permission system prevents cross-country access

**Operational Goals:**
- [ ] Jamaica admin can manage Jamaica properties
- [ ] Jamaica admin can approve Jamaica users
- [ ] Jamaica admin cannot see any Guyana data
- [ ] System audit confirms perfect isolation

**Business Goals:**
- [ ] Independent Jamaica operations capability
- [ ] Secure country-specific administration
- [ ] Scalable admin model for future countries

---

## 📋 ADMIN ACCOUNT DETAILS

### **Proposed Jamaica Admin Accounts:**
1. **Super Admin**: `jamaica.admin@jamaicahomehub.com`
2. **Content Admin**: `content.admin@jamaicahomehub.com`
3. **Support Admin**: `support.admin@jamaicahomehub.com`

### **Admin Permissions Matrix:**
| Role | Properties | Users | Pricing | Analytics | Country |
|------|------------|-------|---------|-----------|---------|
| Super | ✅ | ✅ | ✅ | ✅ | JM Only |
| Content | ✅ | ✅ | ❌ | ✅ | JM Only |
| Support | ❌ | ✅ | ❌ | ❌ | JM Only |

---

**Next Phase:** Phase 6 - Testing & Validation  
**Estimated Time:** 2-3 hours  
**Risk Level:** 🟡 Medium (requires careful permission testing)

---

**Status:** Ready for implementation  
**Priority:** High (critical for operational separation)  
**Blockers:** None identified