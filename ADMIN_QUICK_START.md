# 🚀 ADMIN SYSTEM QUICK START GUIDE

## Current Admin Users (September 27, 2025)

### Super Admin
- **Email:** mrdarrenbuckner@gmail.com
- **Level:** `super`
- **Access:** Full system, all countries
- **Can:** Everything (approve, reject, refunds, pricing)

### Country Admin (Guyana)
- **Email:** qumar@guyanahomehub.com  
- **Level:** `owner`
- **Country:** Guyana (ID: 1)
- **Access:** Guyana properties and payments only
- **Can:** Approve/reject properties, accept payments (no refunds)

## How to Add New Admins

### 1. Add Basic Admin (First Line Worker)
```sql
-- Insert new admin user
INSERT INTO profiles (id, email, first_name, last_name, user_type, admin_level, country_id)
VALUES (
  'new-user-uuid-here',
  'admin@example.com',
  'First',
  'Last',
  'admin',
  'basic',
  1  -- Country ID (1=Guyana, 2=Jamaica, etc.)
);
```

### 2. Add Country Admin (Regional Manager)
```sql
-- Insert new country admin
INSERT INTO profiles (id, email, first_name, last_name, user_type, admin_level, country_id)
VALUES (
  'new-user-uuid-here',
  'country.admin@example.com',
  'Country',
  'Admin',
  'admin',
  'owner',
  2  -- Different country ID
);
```

### 3. Promote to Super Admin
```sql
-- Promote existing admin to super admin
UPDATE profiles 
SET admin_level = 'super', country_id = NULL
WHERE email = 'promote@example.com';
```

## Admin Access URLs

- **Admin Login:** `https://yoursite.com/admin-login`
- **Admin Dashboard:** `https://yoursite.com/admin-dashboard` 
- **Payments Management:** `https://yoursite.com/admin-payments`
- **Pricing Management:** `https://yoursite.com/admin-dashboard/pricing` (Super only)

## Permission Quick Reference

| Feature | Basic Admin | Country Admin | Super Admin |
|---------|-------------|---------------|-------------|
| Approve Properties | ✅ (own country) | ✅ (own country) | ✅ (all countries) |
| Reject Properties | ✅ (own country) | ✅ (own country) | ✅ (all countries) |
| Accept Payments | ✅ | ✅ | ✅ |
| Issue Refunds | ❌ | ❌ | ✅ |
| View Pricing | ❌ | ❌ | ✅ |
| Escalate Cases | ✅ | ✅ | ❌ (final level) |

## Troubleshooting

### Admin Can't Login
1. Check if user exists in `profiles` table
2. Verify `user_type = 'admin'`
3. Ensure `admin_level` is set ('basic', 'owner', or 'super')
4. For country admins, verify `country_id` is set

### Admin Can't See Data
1. Country admins need `country_id` set correctly
2. Check RLS policies are active
3. Verify admin permissions in browser console

### Payment Issues
1. Only super admins can issue refunds
2. Basic/Country admins can accept payments
3. Check payment status ('pending', 'verified', 'refunded')

## Database Schema Reference

### Countries Table
- ID 1: Guyana (GYD)
- ID 2: Jamaica (JMD) 
- ID 3: Trinidad & Tobago (TTD)
- ID 4: Barbados (BBD)
- ID 5: United States (USD)
- ID 6: Canada (CAD)

### Admin Levels
- `'super'`: Full system access
- `'owner'`: Country-level access  
- `'basic'`: First-line admin access

**Last Updated:** September 27, 2025
**Status:** Production Ready ✅