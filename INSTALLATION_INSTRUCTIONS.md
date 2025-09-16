# 🚀 Installation Instructions - Guyana Home Hub Enterprise Payment System

## Overview
Follow these steps in order. Each section is independent and can be completed separately.

---

## 📋 SECTION 1: DATABASE INSTALLATION

### What This Does
- Adds payment tracking tables
- Preserves all existing functionality  
- Enables subscription and per-property payments

### Steps
1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Click **"SQL Editor"** in left sidebar

2. **Run Installation Script**
   - Click **"New Query"**
   - Copy ENTIRE content from: `supabase/ENTERPRISE_COMPLETE_INSTALL.sql`
   - Paste into SQL Editor
   - Click **"Run"**

3. **Verify Success**
   - Should see: **"ENTERPRISE PAYMENT SYSTEM INSTALLED ✓"**
   - Should show: "Tables created: 3 (expected: 3)"
   - Should show: "Views created: 3+ (expected: 3+)"

### If Installation Fails
- Copy error message
- Do NOT proceed to next section
- Contact for troubleshooting

**✅ SUCCESS CRITERIA**: See success message and table counts match expected numbers

---

## 📋 SECTION 2: ADMIN INTERFACE SETUP

### What This Does
- Adds pricing management interface to admin dashboard
- Enables point-and-click price changes
- Provides revenue tracking dashboard

### Steps
1. **Verify Admin Access**
   - Go to: `http://localhost:3000/admin-login`
   - Login: `admin@test.com` / `admin123`
   - Should see admin dashboard

2. **Test Pricing Interface**
   - Click **"💰 Pricing"** button in top-right
   - Should see pricing management page
   - Should show existing plans with prices

3. **Test Price Change**
   - Click **"Edit"** on any plan
   - Change price (e.g., from $99.00 to $149.00)
   - Click **"Save Changes"**
   - Should see "Plan updated successfully!"

**✅ SUCCESS CRITERIA**: Can access pricing page and successfully change a price

---

## 📋 SECTION 3: PAYMENT INTEGRATION TEST

### What This Does
- Verifies existing Stripe payments still work
- Tests payment tracking with new system
- Ensures FSBO flow remains functional

### Steps
1. **Test Existing FSBO Flow**
   - Go to: `http://localhost:3000/register/fsbo`
   - Complete registration form
   - Proceed to payment page
   - **DO NOT** complete actual payment (unless testing with test cards)

2. **Verify Payment Form Loads**
   - Payment form should display
   - Stripe elements should load
   - No console errors

3. **Check Database Integration**
   - In Supabase SQL Editor, run:
   ```sql
   SELECT COUNT(*) FROM pricing_plans WHERE user_type = 'fsbo';
   ```
   - Should return 2 (FSBO Basic and Premium plans)

**✅ SUCCESS CRITERIA**: FSBO registration and payment form work without errors

---

## 📋 SECTION 4: FRONTEND VISIBILITY TEST

### What This Does
- Verifies properties display correctly on frontend
- Tests payment-based visibility controls
- Ensures existing property display still works

### Steps
1. **Check Property Views**
   - In Supabase SQL Editor, run:
   ```sql
   SELECT COUNT(*) FROM public_main_properties;
   SELECT COUNT(*) FROM public_rental_properties;  
   SELECT COUNT(*) FROM public_fsbo_properties;
   ```

2. **Verify Existing Properties Display**
   - Check your main property listings page
   - Existing properties should still appear
   - Images and descriptions should display correctly

3. **Test Admin Property Management**
   - In admin dashboard, verify property listings appear
   - Test approve/reject functionality
   - Ensure no broken functionality

**✅ SUCCESS CRITERIA**: Properties display correctly, admin functions work

---

## 📋 SECTION 5: ADMIN TRAINING & DOCUMENTATION

### What This Does
- Provides copy-paste commands for daily operations
- Sets up revenue tracking
- Enables non-technical price management

### Steps
1. **Review Admin Guide**
   - Open: `ADMIN_DAILY_OPERATIONS_GUIDE.md`
   - Bookmark for daily reference

2. **Test Price Change Commands**
   - Copy example from guide:
   ```sql
   UPDATE pricing_plans SET price = 14900 WHERE plan_name = 'FSBO Basic Listing';
   ```
   - Run in Supabase SQL Editor
   - Verify price changes in pricing interface

3. **Test Revenue Tracking**
   - Copy from guide:
   ```sql
   SELECT * FROM admin_revenue_dashboard WHERE month >= DATE_TRUNC('month', NOW());
   ```
   - Should return revenue data (may be empty initially)

**✅ SUCCESS CRITERIA**: Can change prices via SQL and view revenue dashboard

---

## 🔄 ROLLBACK PROCEDURES (If Needed)

### If Something Goes Wrong
1. **Database Issues**: Tables can be dropped safely
   ```sql
   DROP TABLE IF EXISTS property_payments CASCADE;
   DROP TABLE IF EXISTS user_subscriptions CASCADE; 
   DROP TABLE IF EXISTS pricing_plans CASCADE;
   ```

2. **Admin Interface Issues**: File can be removed
   - Delete: `src/app/admin-dashboard/pricing/page.tsx`

3. **Payment Integration Issues**: No changes made to existing Stripe code

### Files That Are Safe to Delete
- `ADMIN_DAILY_OPERATIONS_GUIDE.md` (documentation only)
- `INSTALLATION_INSTRUCTIONS.md` (this file)
- `supabase/ENTERPRISE_COMPLETE_INSTALL.sql` (after installation)

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

**"Column does not exist" errors**
- Database installation incomplete
- Re-run Section 1 completely

**"Pricing page not found"**
- Admin interface not properly installed
- Check file exists: `src/app/admin-dashboard/pricing/page.tsx`

**"Payment forms broken"**
- Check console for JavaScript errors
- Verify Stripe environment variables still set

### Success Verification Checklist
- [ ] Database installation success message
- [ ] Admin pricing interface accessible
- [ ] FSBO registration form works
- [ ] Properties display on frontend
- [ ] Can change prices via admin interface
- [ ] Revenue dashboard shows data

**🎯 Goal**: Complete enterprise payment system without breaking existing functionality