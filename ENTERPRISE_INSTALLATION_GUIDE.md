# 🚀 Enterprise Payment System Installation Guide

## Overview
This guide installs the enterprise payment system that enables:
- **Agent subscriptions** (monthly billing with property limits)
- **FSBO per-property payments** (pay once per listing)
- **Landlord per-property payments** (rental-specific)
- **Manual pricing changes** without code deployment
- **Frontend visibility control** (which properties show where)

---

## 📋 Step 1: Install Database Schema

### Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### Run the SQL Script
1. Copy the entire content from: `supabase/ENTERPRISE_PAYMENT_SETUP.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** button
4. ✅ You should see: **"ENTERPRISE PAYMENT SYSTEM INSTALLED ✓"**

---

## 📋 Step 2: Verify Installation

### Check Tables Were Created
Run this query in Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('pricing_plans', 'user_subscriptions', 'property_payments');
```
✅ Should return 3 rows showing the new tables.

### Check Default Pricing Plans
```sql
SELECT plan_name, user_type, price/100.0 as price_dollars, is_active 
FROM pricing_plans 
ORDER BY user_type, display_order;
```
✅ Should show Agent, FSBO, and Landlord plans with prices.

---

## 📋 Step 3: Update Environment Variables

### Add to `.env.local`
Ensure these are set (you may already have them):
```env
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 📋 Step 4: Connect Payment Forms

### Current Payment Pages (Already Built)
- ✅ `/register/payment` - Registration payment form
- ✅ API routes for Stripe integration
- ✅ Payment success handling

### What Gets Added Automatically
- **Payment tracking** in `property_payments` table
- **Subscription tracking** in `user_subscriptions` table  
- **Property visibility** based on payment status
- **Usage limits** for agents based on subscription

---

## 🎛️ PRICING MANAGEMENT (No Code Required!)

### Change Any Price
```sql
-- Example: Change Agent Basic from $99 to $149
UPDATE pricing_plans 
SET price = 14900, updated_at = NOW() 
WHERE plan_name = 'Agent Basic Monthly';
```

### Add New Plan
```sql
INSERT INTO pricing_plans (plan_name, user_type, plan_type, price, max_properties, features) VALUES
('Agent Starter', 'agent', 'monthly', 4900, 10, '{"basic_features": true}');
```

### Deactivate Plan
```sql
UPDATE pricing_plans 
SET is_active = false 
WHERE plan_name = 'Old Plan Name';
```

### Mark Plan as Popular
```sql
UPDATE pricing_plans 
SET is_popular = true 
WHERE plan_name = 'Agent Pro Monthly';
```

---

## 📊 ADMIN MONITORING

### View All Pricing
```sql
SELECT * FROM admin_pricing_overview;
```

### Revenue Dashboard
```sql
SELECT * FROM admin_revenue_dashboard 
WHERE month >= '2025-01-01';
```

### Check Property Visibility
```sql
SELECT 
  title, 
  listed_by_type,
  payment_status,
  is_property_visible_on_frontend(id, 'main') as shows_on_main,
  is_property_visible_on_frontend(id, 'rentals') as shows_on_rentals
FROM properties 
WHERE status = 'active';
```

---

## 🔧 TROUBLESHOOTING

### If Payment Doesn't Track
Check if Stripe webhook is connected:
```sql
SELECT * FROM property_payments 
WHERE stripe_payment_intent_id = 'pi_...' -- your payment intent ID
```

### If Properties Don't Show on Frontend
```sql
-- Check property visibility settings
SELECT id, title, payment_status, payment_expires_at, visibility_settings 
FROM properties 
WHERE user_id = 'user-uuid-here';

-- Fix visibility for FSBO properties
UPDATE properties 
SET visibility_settings = '{"main_site": true, "rentals_page": false, "fsbo_page": true, "priority": "medium"}'
WHERE listed_by_type = 'fsbo';
```

### If Agent Can't Create Properties
```sql
-- Check subscription status
SELECT * FROM user_subscriptions 
WHERE user_id = 'agent-uuid-here' AND status = 'active';

-- Check property limits
SELECT can_user_create_property('agent-uuid-here');
```

---

## 🚀 GOING LIVE

### Switch to Live Stripe Keys
1. Replace test keys with live keys in `.env.local`
2. Restart the development server: `npm run dev`

### Update Pricing for Launch
```sql
-- Example: Launch pricing
UPDATE pricing_plans SET price = 9900 WHERE plan_name = 'Agent Basic Monthly';
UPDATE pricing_plans SET price = 19900 WHERE plan_name = 'Agent Pro Monthly';
UPDATE pricing_plans SET price = 4900 WHERE plan_name = 'FSBO Basic Listing';
```

### Monitor Revenue
- Use `admin_revenue_dashboard` view
- Set up alerts for failed payments
- Check property visibility regularly

---

## ✅ SUCCESS CHECKLIST

- [ ] SQL script ran successfully
- [ ] Default pricing plans exist
- [ ] Environment variables updated
- [ ] Test payment works
- [ ] Properties show/hide based on payment
- [ ] Admin can change prices manually
- [ ] Revenue tracking works

**🎉 Your enterprise payment system is ready for the $250K launch!**

---

## 📞 NEXT STEPS

1. **Test the complete flow**: Register → Pay → Create Property → Verify it shows on frontend
2. **Set final launch pricing** using SQL commands above
3. **Switch to live Stripe keys** when ready to go live
4. **Monitor revenue** using the admin dashboard views

**This system is built for scale and can handle thousands of users and properties.**