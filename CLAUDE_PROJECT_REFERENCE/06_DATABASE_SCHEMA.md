# 💾 DATABASE SCHEMA QUICK REFERENCE

## 🗄️ KEY TABLES

### `profiles` (User Management)
```sql
- id (uuid, PK)
- email (text, unique)
- first_name, last_name (text)
- user_type ('fsbo', 'landlord', 'agent', 'admin')
- admin_level ('super', 'owner', 'basic') -- admins only
- country_id (int, FK to countries)
- created_at, updated_at (timestamptz)
```

### `properties` (Property Listings)
```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- title, description (text)
- price (numeric)
- listing_type ('sale', 'rent')
- status ('active', 'pending', 'draft', 'rejected')
- country_id (int, FK to countries)
- created_at, updated_at (timestamptz)
```

### `user_property_limits` (Business Logic)
```sql
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- free_trial_start_date, free_trial_end_date (timestamptz)
- max_free_properties (int) -- role-based limits
- max_sale_properties, max_rental_properties (int, nullable)
- current_free_properties, current_sale_properties, current_rental_properties (int)
- has_upgraded (boolean)
- is_trial_active (boolean)
```

### `property_quotas` (Role Definitions)
```sql
- id (uuid, PK)
- user_type (text, unique) -- 'fsbo', 'landlord', 'agent', 'admin'
- free_trial_properties (int) -- how many free properties
- free_trial_days (int) -- trial duration
- max_sale_properties, max_rental_properties (int, nullable)
- requires_upgrade_after (boolean)
- is_admin_role (boolean)
```

### Current Role Configuration:
- **FSBO**: 1 property, 60 days, upgrade required
- **Landlord**: 1 property, 60 days, upgrade required
- **Agent**: 10 properties, 60 days, upgrade required
- **Admin**: 20 sale + 5 rental, no upgrade required

## 🌍 COUNTRIES TABLE
```sql
- id (int, PK)
- name (text) -- 'Guyana', 'Jamaica', etc.
- code (text) -- 'GY', 'JM', etc.
- currency (text) -- 'GYD', 'JMD', etc.
```

Configured: Guyana(1), Jamaica(2), Trinidad(3), Barbados(4), US(5), Canada(6)

## 🔐 ROW LEVEL SECURITY (RLS)

### Country-Based Filtering:
- Owner Admins see only their country's data
- Super Admin sees all countries
- Regular users see all active listings (for browsing)

### Permission-Based Access:
- Users can only edit their own properties
- Admins can moderate based on permission level
- Payment history filtered by user and admin permissions

## 🔧 KEY FUNCTIONS

### `can_user_create_property_enhanced()`
- Checks property limits by user type
- Validates trial periods and upgrade status
- Handles admin bypasses and special permissions
- Returns detailed limit information

### `extend_user_trial()`
- Allows admins to extend user trial periods
- Validates admin permissions
- Logs extension history
- Reactivates expired trials

### `initialize_user_property_limits()`
- Sets up initial limits for new users
- Based on user_type from profiles
- Called automatically on first property creation

---
*Schema Status: Production Ready*
*Last Migration: October 2, 2025*