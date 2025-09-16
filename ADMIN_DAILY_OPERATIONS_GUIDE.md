# 🎛️ Admin Daily Operations Guide - Guyana Home Hub

## Overview
This guide provides simple instructions for daily admin tasks that require NO CODING KNOWLEDGE. All changes take effect immediately.

---

## 💰 PRICING MANAGEMENT (Most Common Task)

### Change Any Price Instantly
**When to use**: Market changes, promotions, competitor pricing

**Steps**:
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste ONE of these examples:

```sql
-- Change FSBO Basic from $99 to $149
UPDATE pricing_plans SET price = 14900 WHERE plan_name = 'FSBO Basic Listing';

-- Change Agent Monthly from $199 to $249  
UPDATE pricing_plans SET price = 24900 WHERE plan_name = 'Agent Pro Monthly';

-- Change Landlord Basic from $79 to $99
UPDATE pricing_plans SET price = 9900 WHERE plan_name = 'Landlord Basic Rental';
```

3. Click **"Run"**
4. ✅ Price changes immediately for new customers

### Create Limited-Time Promotions
```sql
-- 50% off FSBO listings (originally $199)
UPDATE pricing_plans 
SET price = 9950, original_price = 19900 
WHERE plan_name = 'FSBO Premium Listing';

-- Remove promotion (back to normal price)
UPDATE pricing_plans 
SET price = 19900, original_price = NULL 
WHERE plan_name = 'FSBO Premium Listing';
```

### Mark Plans as "Popular" (Highlights for Users)
```sql
-- Make a plan popular (adds "Popular" badge)
UPDATE pricing_plans SET is_popular = true WHERE plan_name = 'Agent Pro Monthly';

-- Remove popular status
UPDATE pricing_plans SET is_popular = false WHERE plan_name = 'Agent Basic Monthly';
```

---

## 📊 REVENUE TRACKING (Weekly/Monthly)

### Check This Month's Revenue
```sql
SELECT 
  revenue_source,
  total_revenue_dollars,
  successful_transactions
FROM admin_revenue_dashboard 
WHERE month >= DATE_TRUNC('month', NOW())
ORDER BY revenue_source;
```

### Check Last 3 Months Performance
```sql
SELECT 
  month,
  SUM(total_revenue_dollars) as monthly_revenue,
  SUM(successful_transactions) as monthly_sales
FROM admin_revenue_dashboard 
WHERE month >= NOW() - INTERVAL '3 months'
GROUP BY month
ORDER BY month DESC;
```

### User Growth Summary
```sql
SELECT * FROM admin_user_activity;
```

---

## 👥 USER MANAGEMENT

### Check Agent Subscriptions
```sql
-- See all active agent subscriptions
SELECT 
  pr.first_name || ' ' || pr.last_name as agent_name,
  pr.email,
  pp.plan_name,
  us.status,
  us.current_period_end,
  us.properties_used || '/' || pp.max_properties as usage
FROM user_subscriptions us
JOIN profiles pr ON us.user_id = pr.id  
JOIN pricing_plans pp ON us.plan_id = pp.id
WHERE us.status = 'active'
ORDER BY us.current_period_end;
```

### Find Expired Payments
```sql
-- Properties with expired payments (should be hidden)
SELECT 
  p.title,
  pr.first_name || ' ' || pr.last_name as owner_name,
  pr.email,
  p.payment_expires_at,
  p.listed_by_type
FROM properties p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.payment_expires_at < NOW()
AND p.payment_status = 'paid'
ORDER BY p.payment_expires_at;
```

---

## 🏠 PROPERTY MANAGEMENT

### Manually Feature a Property
```sql
-- Feature property for 30 days
UPDATE properties 
SET featured = true, featured_until = NOW() + INTERVAL '30 days'
WHERE id = 'property-uuid-here';

-- Remove featured status
UPDATE properties 
SET featured = false, featured_until = NULL
WHERE id = 'property-uuid-here';
```

### Check Properties by Payment Status
```sql
-- Count properties by payment status
SELECT 
  payment_status,
  listed_by_type,
  COUNT(*) as property_count
FROM properties 
GROUP BY payment_status, listed_by_type
ORDER BY listed_by_type, payment_status;
```

---

## 🔧 TROUBLESHOOTING

### Property Not Showing on Frontend?
```sql
-- Check property visibility settings
SELECT 
  id,
  title,
  status,
  payment_status,
  payment_expires_at,
  visibility_settings,
  listed_by_type
FROM properties 
WHERE title LIKE '%search-term%'
OR id = 'property-uuid-here';
```

**Common Issues**:
- `status` must be `'active'`
- `payment_status` must be `'paid'` for FSBO/Landlord
- `payment_expires_at` must be in the future
- `visibility_settings` must allow the frontend section

### User Can't Create Properties?
```sql
-- Check agent subscription limits
SELECT can_user_create_property('user-uuid-here');

-- See user's plan details
SELECT * FROM get_user_plan_info('user-uuid-here');
```

---

## 📈 BUSINESS INTELLIGENCE

### Best Performing Plans
```sql
SELECT 
  plan_name,
  user_type,
  price / 100.0 as price_dollars,
  active_subscriptions + total_purchases as total_sales,
  (active_subscriptions + total_purchases) * (price / 100.0) as revenue_generated
FROM admin_pricing_overview
WHERE is_active = true
ORDER BY revenue_generated DESC;
```

### Properties Added This Week
```sql
SELECT 
  DATE(created_at) as date,
  listed_by_type,
  COUNT(*) as properties_added
FROM properties 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), listed_by_type
ORDER BY date DESC, listed_by_type;
```

---

## 🚨 EMERGENCY PROCEDURES

### Disable a Pricing Plan (Hide from Users)
```sql
UPDATE pricing_plans SET is_active = false WHERE plan_name = 'Plan Name Here';
```

### Re-enable a Pricing Plan
```sql
UPDATE pricing_plans SET is_active = true WHERE plan_name = 'Plan Name Here';
```

### Extend Property Payment (Customer Service)
```sql
-- Add 30 days to property payment
UPDATE properties 
SET payment_expires_at = payment_expires_at + INTERVAL '30 days'
WHERE id = 'property-uuid-here';
```

### Manual Property Payment Status Update
```sql
-- Mark property as paid (customer service)
UPDATE properties 
SET payment_status = 'paid', 
    payment_expires_at = NOW() + INTERVAL '90 days'
WHERE id = 'property-uuid-here';
```

---

## 🎯 DAILY CHECKLIST

### Morning (5 minutes)
- [ ] Check overnight revenue: `SELECT * FROM admin_revenue_dashboard WHERE month >= DATE_TRUNC('month', NOW());`
- [ ] Check for expired payments needing follow-up
- [ ] Review new user registrations

### Weekly (15 minutes)  
- [ ] Review pricing performance
- [ ] Check agent subscription renewals
- [ ] Analyze property listing trends
- [ ] Update popular plan markers if needed

### Monthly (30 minutes)
- [ ] Generate revenue report for stakeholders
- [ ] Review and adjust pricing strategy
- [ ] Analyze user growth trends
- [ ] Plan promotional campaigns

---

## 📞 SUPPORT SCENARIOS

### Customer: "My property isn't showing"
1. Get property title or ID
2. Run visibility check query
3. Common fixes:
   - Payment expired → extend payment
   - Property status not active → update status
   - Wrong visibility settings → update settings

### Customer: "I can't create more properties"
1. Get user email or ID
2. Check subscription limits
3. Solutions:
   - Agent hit limit → upgrade plan or wait for renewal
   - Payment failed → check payment status
   - Account issue → verify user type

### Customer: "I want to change my plan"  
1. Check current subscription
2. Create new subscription record
3. Cancel old subscription (set cancel_at_period_end = true)

---

**💡 Remember**: All changes are immediate. Always test queries with specific IDs first before running bulk updates. Keep this guide handy for daily operations!