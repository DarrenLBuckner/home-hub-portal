# Portal Home Hub - Registration & Property Flow Analysis

## Document Purpose
This document provides a comprehensive analysis of the three user registration flows (Agent, FSBO, Landlord) for the senior developer. It identifies what works, what's broken, and provides solutions for creating a unified, consistent system.

**Prepared by:** Claude Code Analysis
**Date:** December 7, 2025
**For:** Senior Developer Review

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Business Requirements](#business-requirements)
3. [Current State Analysis](#current-state-analysis)
4. [Flow Comparison Matrix](#flow-comparison-matrix)
5. [Critical Issues by User Type](#critical-issues-by-user-type)
6. [Database Field Mapping Analysis](#database-field-mapping-analysis)
7. [Recommended Solutions](#recommended-solutions)
8. [Implementation Priority](#implementation-priority)
9. [Questions for Discussion](#questions-for-discussion)

---

## Executive Summary

### What Works
- **FSBO Flow**: Fully functional - immediate account creation, promo code redemption, welcome email, property creation
- **Landlord Registration**: Account creation works correctly with promo code redemption

### What's Broken
- **Agent Flow**: Promo codes never redeemed, no approval email sent, property status defaults to 'draft'
- **Landlord Property Creation**: Authentication completely disabled, undefined variable blocks submission

### Root Cause
The three flows were developed at different times with different patterns. FSBO was built most recently and has the cleanest implementation. Agent flow has a unique "vetting" requirement that wasn't fully integrated. Landlord property creation was partially refactored and left incomplete.

---

## Business Requirements

### Agent Requirements (Premium Users)
> "Agents must have approval process because they will be badged on the site as approved agents that have been vetted and in most cases licensed. The agents will be the ones posting the most and paying the most to be on the platform."

| Requirement | Implementation Status |
|-------------|----------------------|
| Admin approval before login | Working |
| Vetting with references | Working |
| Founding agents: 100 days free | Promo code exists, but NOT redeemed |
| Founding agents: 50% lifetime discount | Promo code exists, but NOT redeemed |
| Founding agents: 30 property tier | Code sets `subscription_tier: 'premium'` (30 listings) |
| Higher tiers available with 50% discount | Not implemented yet |
| Badged as "Verified Agent" on site | Depends on approval_status in profiles |

### FSBO Requirements (One-Time Users)
> "FSBO will usually be a one and done customer"

| Requirement | Implementation Status |
|-------------|----------------------|
| Immediate account creation | **Working** |
| No admin approval needed | **Working** |
| Pay-per-listing model | **Working** |
| Founding member option | **Working** |

### Landlord Requirements (Recurring Users)
> "Landlords will come every so often unless they are an apartment complex or several properties with lots of turnover"

| Requirement | Implementation Status |
|-------------|----------------------|
| Immediate account creation | **Working** |
| No admin approval needed | **Working** |
| Pay-per-listing model | **Working** |
| Property creation | **BROKEN** - Auth disabled |

---

## Current State Analysis

### Registration API Endpoints

| User Type | Registration Endpoint | Creates User Immediately | Promo Redeemed |
|-----------|----------------------|-------------------------|----------------|
| Agent | `/api/register/agent` | NO - Stores in `agent_vetting` | NO |
| FSBO | `/api/register/fsbo/complete` | YES | YES |
| Landlord | `/api/register/landlord` | YES | YES |

### Key Files by Flow

#### Agent Flow
```
Registration:
  src/app/register/page.tsx                          # 4-step form
  src/app/api/register/agent/route.ts                # Stores in agent_vetting

Approval:
  src/app/api/admin/agents/approve/route.ts          # Creates user on approval
  src/app/admin-dashboard/unified/page.tsx           # Admin reviews pending

Dashboard:
  src/app/dashboard/agent/page.tsx                   # Agent dashboard
  src/app/dashboard/agent/create-property/page.tsx   # Property creation
```

#### FSBO Flow
```
Registration:
  src/app/register/fsbo/page.tsx                     # 5-step form
  src/app/api/register/fsbo/route.ts                 # Validation only
  src/app/api/register/fsbo/complete/route.ts        # Creates user + redeems promo

Dashboard:
  src/app/dashboard/fsbo/page.tsx                    # FSBO dashboard
  src/app/dashboard/fsbo/create-listing/page.tsx     # Property creation
```

#### Landlord Flow
```
Registration:
  src/app/register/landlord/page.tsx                 # 3-step form
  src/app/api/register/landlord/route.ts             # Creates user + redeems promo

Dashboard:
  src/app/dashboard/landlord/page.tsx                # Landlord dashboard
  src/app/dashboard/landlord/create-property/page.tsx # BROKEN - Auth disabled
```

---

## Flow Comparison Matrix

### Registration Phase

| Feature | Agent | FSBO | Landlord |
|---------|-------|------|----------|
| Steps in form | 4 | 5 | 3 |
| Promo code input | Yes | Yes | Yes |
| User created on submit | NO | YES | YES |
| Stored in vetting table | YES | NO | NO |
| Admin approval required | YES | NO | NO |
| Password stored | Plain text in DB | Passed to complete API | Passed directly |
| Email validation | Yes | Yes | Yes |
| Password validation | 8 chars + special | 8 chars + special | 8 chars + special |

### Post-Registration Phase

| Feature | Agent | FSBO | Landlord |
|---------|-------|------|----------|
| Can login immediately | NO | YES | YES |
| Promo code redeemed | NO | YES | YES |
| Welcome email sent | Confirmation only | Yes | Yes |
| Founding member email | NO | YES | NO |
| Profile `is_founding_member` set | NO | YES | NO |
| Profile `subscription_tier` set | On approval | On complete | Via promo redeem |

### Property Creation Phase

| Feature | Agent | FSBO | Landlord |
|---------|-------|------|----------|
| Auth check works | YES | YES | **NO - DISABLED** |
| Default property status | `draft` (wrong) | `pending` (correct) | `pending` |
| Image upload method | Base64 or URLs | Base64 | Direct to storage (broken) |
| Required fields validated | Yes | Yes | Missing `owner_whatsapp` |
| WhatsApp field | No | No | Yes (required but not validated) |

---

## Critical Issues by User Type

### Agent Issues

#### Issue 1: Promo Code Never Redeemed
**Location:** `src/app/api/admin/agents/approve/route.ts`

**Current behavior:**
1. Agent registers with promo code `FOUNDERS-AGENT-GY`
2. Promo info stored in `agent_vetting` table
3. Admin approves agent
4. User account created
5. **Promo code redemption NEVER called**

**Impact:**
- `current_redemptions` never incremented
- Founding member counter shows wrong count
- Multiple agents could claim same spot number
- Agent doesn't get founding member benefits in profile

**Fix needed:** Add promo code redemption call after user creation in approve route.

---

#### Issue 2: No Approval Email Sent
**Location:** `src/app/api/admin/agents/approve/route.ts`

**Current behavior:**
- `send-agent-approval-email` API exists but is never called
- Agent has no idea they've been approved

**Fix needed:** Call approval email API after successful approval.

---

#### Issue 3: Property Status Defaults to 'draft'
**Location:** `src/app/api/properties/create/route.ts:501`

```javascript
// For agents, this line:
status: body.status || (shouldAutoApprove(userType) ? 'active' : 'draft'),
```

**Current behavior:**
- Agent submits property
- Status defaults to `'draft'` instead of `'pending'`
- Property doesn't appear in admin review queue

**Fix needed:** Change default to `'pending'` for agent properties.

---

#### Issue 4: Plain Text Password Storage
**Location:** `src/app/api/register/agent/route.ts:59`

```javascript
temp_password: password, // Stored as plain text
```

**Security risk:** Password visible in database during pending period.

**Options:**
1. Hash the password before storage, decrypt on approval
2. Use a secure token/magic link approach instead
3. Accept risk since it's temporary and cleared after approval

---

### Landlord Issues

#### Issue 1: Authentication Completely Disabled (CRITICAL)
**Location:** `src/app/dashboard/landlord/create-property/page.tsx:42-89`

```javascript
useEffect(() => {
  async function checkAuth() {
    // Authentication now handled server-side - no client-side auth needed
    setLoading(false);
    return;  // <-- IMMEDIATELY RETURNS - NO AUTH CHECK

    /* DISABLED - All auth code commented out */
  }
  checkAuth();
}, []);
```

**Impact:**
- `user` state is never set
- `userId` is always `undefined`
- Every submission fails with "You must be logged in"

**Fix needed:** Re-enable the authentication check or implement server-side auth.

---

#### Issue 2: Undefined Variable Blocks Submission
**Location:** `src/app/dashboard/landlord/create-property/page.tsx:245`

```javascript
// Line 232-236 creates imageUrls:
const uploadedImages = await uploadImagesToSupabase(form.images, userId);
const imageUrls = uploadedImages.map(img => img.url);

// But line 245 uses undefined variable:
body: JSON.stringify({
  images: imagesForUpload,  // <-- UNDEFINED! Should be imageUrls
})
```

**Impact:** Even if auth was fixed, this would cause a runtime error.

**Fix needed:** Change `imagesForUpload` to `imageUrls`.

---

#### Issue 3: Missing Profile Fields
**Location:** `src/app/api/register/landlord/route.ts:36-67`

Unlike FSBO, landlord registration doesn't set:
- `is_founding_member`
- `subscription_tier`
- `promo_code`
- `promo_spot_number`

These are set by the promo redeem call, but if that fails, the profile is incomplete.

**Fix needed:** Set these fields directly in profile creation, not just via promo redeem.

---

#### Issue 4: WhatsApp Not Validated
**Location:** `src/app/dashboard/landlord/create-property/page.tsx:202`

```javascript
const required = ["title", "description", "price", "propertyType", "bedrooms", "bathrooms", "location", "attestation"];
// owner_whatsapp is MISSING from this list
```

**Impact:** Landlord can submit without WhatsApp despite UI showing it as required.

**Fix needed:** Add `"owner_whatsapp"` to required array.

---

### FSBO Issues (Minor)

The FSBO flow works correctly. Minor improvements:

1. Could add `subscription_tier` explicitly to profile creation (currently relies on promo redeem)
2. Could add founding member email for consistency

---

## Database Field Mapping Analysis

### `user_type` Values in Code vs Database

| Code Value | Used In | Database Expectation |
|------------|---------|---------------------|
| `'agent'` | Agent registration, approval | Matches |
| `'owner'` | FSBO registration | Used for FSBO/owner users |
| `'fsbo'` | Some dashboard checks | May conflict with 'owner' |
| `'landlord'` | Landlord registration | Matches |
| `'admin'` | Admin accounts | Matches |
| `'property_owner'` | Promo code validation for landlords | **MISMATCH** - DB uses this, code uses 'landlord' |

**Potential Issue:** PromoCodeInput for landlords uses `userType="property_owner"` but profile stores `user_type: 'landlord'`. The promo_codes table expects `user_type: 'property_owner'` for landlord codes.

---

### `subscription_tier` Values

| Value | User Type | Listings Allowed | Set By |
|-------|-----------|------------------|--------|
| `'basic'` | Agent | 10 | Default |
| `'premium'` | Agent (Founding) | 30 | Approval route |
| `'platinum'` | Agent | 75 | Upgrade |
| `'elite'` | Agent | Unlimited | Upgrade |
| `'basic'` | Landlord | 1 | Default |
| `'plus'` | Landlord | 1 | Upgrade |
| `'portfolio'` | Landlord | 3 | Upgrade |
| `'basic'` | FSBO | 1 | Default |
| `'founding_member'` | Any | Varies | Promo redeem |

**Note:** The `promo_codes.assigns_to_tier` field determines what tier a founding member gets.

---

### `country` vs `country_id` Fields

Found inconsistency in agent approval:

```javascript
// Line 74-76 in approve route:
if (profile.admin_level !== 'super' && profile.country_id) {
  agentQuery = agentQuery.eq('country', profile.country_id);
}
```

The `agent_vetting` table uses `country` but the query compares it to `profile.country_id`. Need to verify:
1. What field does `agent_vetting` actually have?
2. Are country codes consistent (e.g., 'GY' vs 'guyana')?

---

## Recommended Solutions

### Solution 1: Fix Agent Promo Code Redemption

**File:** `src/app/api/admin/agents/approve/route.ts`

Add after line 165 (after clearing temp password):

```javascript
// Redeem promo code if agent used one
if (agent.promo_code) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    const redeemResponse = await fetch(`${baseUrl}/api/promo-codes/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: agent.promo_code,
        userId: authUser.user.id
      })
    });

    const redeemResult = await redeemResponse.json();
    if (redeemResult.success) {
      console.log('Promo code redeemed:', redeemResult.message);
    } else {
      console.warn('Promo redemption failed:', redeemResult.error);
    }
  } catch (error) {
    console.error('Promo redemption error:', error);
  }
}
```

---

### Solution 2: Add Agent Approval Email

**File:** `src/app/api/admin/agents/approve/route.ts`

Add after the promo code redemption:

```javascript
// Send approval email
try {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  await fetch(`${baseUrl}/api/send-agent-approval-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentEmail: agentEmail,
      agentName: `${agentFirstName} ${agentLastName}`.trim(),
      isFoundingMember: agent.is_founding_member,
      spotNumber: agent.promo_spot_number
    })
  });
  console.log('Approval email sent');
} catch (error) {
  console.warn('Failed to send approval email:', error);
}
```

---

### Solution 3: Fix Agent Property Status Default

**File:** `src/app/api/properties/create/route.ts`

Change line 501 from:
```javascript
status: body.status || (shouldAutoApprove(userType) ? 'active' : 'draft'),
```

To:
```javascript
status: body.status || (shouldAutoApprove(userType) ? 'active' : 'pending'),
```

---

### Solution 4: Fix Landlord Auth Check

**File:** `src/app/dashboard/landlord/create-property/page.tsx`

Replace lines 42-89 with:

```javascript
useEffect(() => {
  async function checkAuth() {
    const { createClient } = await import('@/supabase');
    const supabase = createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      window.location.href = '/login';
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, subscription_status')
      .eq('id', authUser.id)
      .single();

    // Allow landlords and eligible admins
    const adminEmails = ['mrdarrenbuckner@gmail.com', 'qumar@guyanahomehub.com'];
    const isAdmin = profile?.user_type === 'admin' && adminEmails.includes(authUser.email || '');

    if (!profile || (profile.user_type !== 'landlord' && !isAdmin)) {
      window.location.href = '/dashboard';
      return;
    }

    setUser(authUser);
    setLoading(false);
  }

  checkAuth();
}, []);
```

---

### Solution 5: Fix Landlord Undefined Variable

**File:** `src/app/dashboard/landlord/create-property/page.tsx`

Change line 245 from:
```javascript
images: imagesForUpload,
```

To:
```javascript
imageUrls: imageUrls,
```

And ensure the API handles `imageUrls` parameter (it already does based on line 361-363 in create route).

---

### Solution 6: Add WhatsApp Validation for Landlord

**File:** `src/app/dashboard/landlord/create-property/page.tsx`

Change line 202 from:
```javascript
const required: (keyof PropertyForm)[] = ["title", "description", "price", "propertyType", "bedrooms", "bathrooms", "location", "attestation"];
```

To:
```javascript
const required: (keyof PropertyForm)[] = ["title", "description", "price", "propertyType", "bedrooms", "bathrooms", "location", "attestation", "owner_whatsapp"];
```

---

### Solution 7: Standardize Founding Member Profile Fields

Create a helper function used by all registration flows:

**New File:** `src/lib/foundingMemberUtils.ts`

```javascript
export function getFoundingMemberProfileFields(
  promoCode: string | null,
  promoBenefits: any,
  promoSpotNumber: number | null
) {
  if (!promoCode) {
    return {
      is_founding_member: false,
      promo_code: null,
      promo_spot_number: null,
      subscription_tier: 'basic'
    };
  }

  return {
    is_founding_member: true,
    promo_code: promoCode,
    promo_spot_number: promoSpotNumber,
    subscription_tier: promoBenefits?.tier || 'founding_member'
  };
}
```

Then use this in all registration routes for consistency.

---

## Implementation Priority

### Phase 1: Critical Fixes (Do First)

| Priority | Issue | File | Complexity |
|----------|-------|------|------------|
| 1 | Landlord auth disabled | `create-property/page.tsx` | Low |
| 2 | Landlord undefined variable | `create-property/page.tsx` | Low |
| 3 | Agent property status = draft | `properties/create/route.ts` | Low |

### Phase 2: Agent Flow Fixes

| Priority | Issue | File | Complexity |
|----------|-------|------|------------|
| 4 | Agent promo code not redeemed | `admin/agents/approve/route.ts` | Medium |
| 5 | Agent approval email not sent | `admin/agents/approve/route.ts` | Low |
| 6 | Agent password plain text | `register/agent/route.ts` | Medium |

### Phase 3: Consistency & Cleanup

| Priority | Issue | File | Complexity |
|----------|-------|------|------------|
| 7 | Landlord missing profile fields | `register/landlord/route.ts` | Low |
| 8 | Landlord WhatsApp validation | `create-property/page.tsx` | Low |
| 9 | Landlord founding member email | `register/landlord/route.ts` | Low |
| 10 | user_type/property_owner mismatch | Multiple files | Medium |

### Phase 4: Future Enhancements

| Priority | Issue | Notes |
|----------|-------|-------|
| 11 | Agent tier upgrades with 50% discount | New feature |
| 12 | Apartment complex/portfolio landlord tier | New feature |
| 13 | Standardize all founding member handling | Refactor |

---

## Questions for Discussion

### Architecture Questions

1. **Auth Pattern:** Should we use server-side auth (middleware) or client-side auth (useEffect) consistently across all dashboards? The landlord create-property comments suggest server-side was intended but never implemented.

2. **Promo Code Timing:** For agents, should the promo code be redeemed:
   - At registration (before approval)?
   - At approval (current location, but not implemented)?
   - Should we reserve the spot at registration and confirm at approval?

3. **Password Security:** What's the acceptable approach for agent temp passwords?
   - Hash and store (requires unhashing for Supabase auth creation)
   - Magic link approach (more complex)
   - Accept plain text risk (simplest, cleared after approval)

### Database Questions

4. **Field Naming:** Should we standardize on `country` or `country_id`? Currently mixed usage.

5. **user_type Values:** Should landlords use `'landlord'` or `'property_owner'`? Promo codes expect `'property_owner'`.

6. **subscription_tier:** Are the tier names consistent between `subscription-utils.ts` and actual database values? Need to verify:
   - `premium` vs `professional` for founding agents
   - `founding_member` as a tier vs a flag

### Business Logic Questions

7. **Agent Founding Member Benefits:**
   - 100 days free: Is this tracked via `beta_expiry` or separate field?
   - 50% lifetime discount: How is this enforced at payment time?
   - 30 property tier: Confirmed as `subscription_tier: 'premium'`?

8. **Property Limits:** Should rejected/sold properties count against limits, or only active/pending/draft?

---

## Appendix: Key Code Snippets

### Working FSBO Promo Redemption Pattern
```javascript
// From src/app/api/register/fsbo/complete/route.ts:77-101
if (promo_code && data.user) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    const redeemResponse = await fetch(`${baseUrl}/api/promo-codes/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: promo_code,
        userId: data.user.id
      })
    });
    // Handle response...
  } catch (error) {
    console.error('Error redeeming promo code:', error);
  }
}
```

### Working Landlord Profile Creation Pattern
```javascript
// From src/app/api/register/landlord/route.ts:36-67
const { error: profileError } = await supabase
  .from('profiles')
  .update({
    email: email,
    first_name: first_name,
    last_name: last_name,
    phone: phone,
    user_type: 'landlord',
    updated_at: new Date().toISOString(),
  })
  .eq('id', data.user.id);
```

### Agent Approval User Creation Pattern
```javascript
// From src/app/api/admin/agents/approve/route.ts:90-107
const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
  email: agentEmail,
  password: agent.temp_password,
  email_confirm: true,
  user_metadata: {
    first_name: agentFirstName,
    last_name: agentLastName,
    user_type: 'agent',
    onboarding_completed: true
  }
});
```

---

# PART 2: Multi-Country Scaling Architecture Analysis

## Context

Portal Home Hub is preparing to scale from 1 country (Guyana) to 42 countries across 4 regions:
- **Caribbean**: 7 countries
- **Latin America**: 15 countries
- **Africa**: 16 countries
- **Asia**: 4 countries

Each country will have its own domain (jamaicahomehub.com, kenyahomehub.com, etc.)
Regional hubs will have dropdowns (caribbeanhomehub.com → select country)

---

## Current Architecture Assessment

### Country Detection Method: **Domain-Based (Middleware)**

The system already has domain-based country detection in place:

**File:** `src/middleware.ts:6-11`
```javascript
function getCountryFromHost(hostname: string): 'GY' | 'JM' {
  if (hostname.includes('jamaica') || hostname.includes('jm')) {
    return 'JM';
  }
  return 'GY'; // Default to Guyana
}
```

**How it works:**
1. Middleware detects country from hostname
2. Sets `country-code` cookie (accessible client & server side)
3. Sets `site-type` cookie (`portal` vs `public`)
4. Cookie lasts 1 year

**Current Limitation:** Only supports GY and JM. Needs expansion for 42 countries.

---

### Database Architecture: **Already Multi-Country Ready**

#### `countries` Table
- Fetched dynamically via `GlobalSouthLocationSelector` component
- Has `status: 'active'` filter
- Ordered by `display_order`
- Already contains 42 countries (per your note)

#### `regions` Table
- Linked via `country_code` foreign key
- Has `is_capital`, `is_major_city`, `population` fields
- Dynamic loading per country selection

#### Properties Table
- `country_id` field exists and is used
- `site_id` field for multi-tenant routing (`'guyana'`, `'jamaica'`)
- Currency stored per property

---

### Theme/Branding: **Not Yet Configurable Per Country**

Currently no per-country theme configuration found. Colors are consistent across the app.

**Recommendation:** Create a country config system for:
- Primary/secondary colors
- Logo variations
- Contact information
- Social media links

---

## Multi-Country Readiness Score: **7/10**

The codebase is **moderately ready** for multi-country expansion:

| Category | Score | Notes |
|----------|-------|-------|
| Database schema | 9/10 | countries & regions tables ready, country_id on all entities |
| Middleware detection | 6/10 | Works but only for 2 countries |
| Currency handling | 8/10 | Dynamic system in place via `src/lib/currency.ts` |
| API routes | 7/10 | Most filter by country, some have defaults |
| UI components | 8/10 | GlobalSouthLocationSelector fetches from DB |
| Hardcoded values | 5/10 | Several GY/GYD defaults throughout |

---

## Hardcoded References Found

### Critical Hardcoding (Must Fix Before Scaling)

| File | Line | Hardcoded Value | Impact |
|------|------|-----------------|--------|
| `src/middleware.ts` | 6-10 | Only GY/JM supported | Blocks all other countries |
| `src/app/api/founding-agent/counter/route.ts` | ~21 | `FOUNDERS-AGENT-GY` | Agent counter only works for Guyana |
| `src/app/api/properties/create/route.ts` | 503, 542 | `'GY'`, `'GYD'` as defaults | New properties default to Guyana |
| `src/app/api/pricing/route.ts` | ~8 | Default `country_id: 'GY'` | Pricing defaults to Guyana |
| `src/app/dashboard/agent/create-property/page.tsx` | ~254 | `site_id: 'guyana'` | Agent properties hardcoded to Guyana |

### Moderate Hardcoding (Fix During Scaling)

| File | Line | Hardcoded Value | Impact |
|------|------|-----------------|--------|
| Various email templates | Multiple | `+592-XXX-XXXX` | Phone numbers Guyana-specific |
| `src/app/layout.tsx` | Multiple | `+592-762-9797` | Header phone hardcoded |
| `src/app/api/payment-intent/route.ts` | 3 | `convertGYDToUSDCents` | Assumes GYD input |
| `src/app/api/services/route.ts` | Multiple | `GYD` fallback | Service pricing defaults |

### Low Priority (Can Fix Later)

| File | Line | Hardcoded Value | Impact |
|------|------|-----------------|--------|
| Fallback regions in GlobalSouthLocationSelector | 106-111 | Georgetown, Linden, New Amsterdam | Only affects DB failure scenario |
| Test property creation | Multiple | Guyana test data | Only for testing |

---

## Recommended Deployment Strategy

### Recommended: **Option B - Single Codebase with Domain Detection**

This is already the pattern in use and should be extended:

```
                    ┌─────────────────────────────────────┐
                    │         Vercel Deployment           │
                    │     (Single Next.js Codebase)       │
                    └─────────────────────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
    ┌──────▼──────┐          ┌───────▼───────┐         ┌───────▼───────┐
    │ portal*.com │          │ guyana*.com   │         │ jamaica*.com  │
    │   (Admin)   │          │   (Public)    │         │   (Public)    │
    └─────────────┘          └───────────────┘         └───────────────┘
           │                         │                         │
           └─────────────────────────┼─────────────────────────┘
                                     │
                    ┌────────────────▼────────────────────┐
                    │     Middleware Country Detection    │
                    │  (Sets country-code cookie)         │
                    └─────────────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────────┐
                    │       Supabase Database             │
                    │  (country_id on all tables)         │
                    └─────────────────────────────────────┘
```

**Why Option B:**
1. Already in progress
2. Single deployment = easier maintenance
3. Shared Supabase database
4. Easy to add countries via DB + DNS
5. Vercel supports unlimited custom domains

**For Regional Hubs (caribbeanhomehub.com):**
- Add dropdown in header when on regional domain
- Store selected country in cookie
- Override country-code cookie value

---

## Required Changes for Multi-Country Expansion

### Phase 1: Middleware Expansion (Required for Jamaica)

**File:** `src/middleware.ts`

Replace hardcoded country detection with dynamic lookup:

```javascript
// Current (hardcoded)
function getCountryFromHost(hostname: string): 'GY' | 'JM' {
  if (hostname.includes('jamaica') || hostname.includes('jm')) return 'JM';
  return 'GY';
}

// Proposed (scalable)
const COUNTRY_DOMAIN_MAP: Record<string, string> = {
  'guyana': 'GY',
  'jamaica': 'JM',
  'trinidad': 'TT',
  'barbados': 'BB',
  'ghana': 'GH',
  'nigeria': 'NG',
  'kenya': 'KE',
  // Add more as needed
};

function getCountryFromHost(hostname: string): string {
  for (const [keyword, code] of Object.entries(COUNTRY_DOMAIN_MAP)) {
    if (hostname.includes(keyword)) return code;
  }
  return 'GY'; // Default fallback
}
```

### Phase 2: Remove Default Fallbacks

Create a helper to get country from cookie/context instead of hardcoding:

**New File:** `src/lib/countryContext.ts`

```javascript
export function getDefaultCountry(request?: NextRequest): string {
  // Try cookie first
  const cookie = request?.cookies.get('country-code')?.value;
  if (cookie) return cookie;

  // Environment variable fallback
  return process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || 'GY';
}
```

### Phase 3: Dynamic Founding Agent Codes

**Current:** Hardcoded `FOUNDERS-AGENT-GY`

**Proposed:** Use pattern `FOUNDERS-AGENT-{COUNTRY_CODE}`

```javascript
const code = `FOUNDERS-AGENT-${countryId}`;
```

### Phase 4: Per-Country Promo Codes in Database

Ensure `promo_codes` table has:
- `country_id` column (already exists)
- Codes for each country as they launch

---

## Environment Variables for Multi-Country

Add to `.env.example`:

```env
# Multi-Country Configuration
NEXT_PUBLIC_DEFAULT_COUNTRY=GY
NEXT_PUBLIC_SUPPORTED_COUNTRIES=GY,JM,TT,BB,GH,NG,KE

# Per-Country Contact (optional, can be in DB)
CONTACT_PHONE_GY=+592-762-9797
CONTACT_PHONE_JM=+1-876-XXX-XXXX
```

---

## Safe to Proceed with Current Fixes?

### ✅ YES - The 6 fixes are safe to implement

The fixes identified in Part 1 do not conflict with multi-country scaling:

| Fix | Multi-Country Impact |
|-----|---------------------|
| 1. Landlord auth re-enable | None - auth is country-agnostic |
| 2. Landlord undefined variable | None - just a bug fix |
| 3. Agent property status = pending | None - status logic is universal |
| 4. Agent promo code redemption | **Helpful** - already uses dynamic country from agent record |
| 5. Agent approval email | None - email content can be country-aware |
| 6. Agent password security | None - security is universal |

**Recommendation:** Proceed with fixes now. They will work correctly when more countries are added.

---

## Vercel Domain Configuration

For each new country, add to Vercel:
1. Custom domain: `{country}homehub.com`
2. Wildcard optional: `*.{country}homehub.com`

The middleware will automatically detect the country from the domain.

---

## Summary: What's Ready vs What Needs Work

### Ready for Multi-Country
- ✅ Database schema (countries, regions, country_id)
- ✅ Currency handling (src/lib/currency.ts)
- ✅ GlobalSouthLocationSelector component
- ✅ Most API routes accept country parameter
- ✅ Middleware cookie system

### Needs Work for Multi-Country
- ⚠️ Middleware: Expand country detection
- ⚠️ Founding agent counter: Dynamic country code
- ⚠️ Property defaults: Use context instead of hardcoding
- ⚠️ Phone numbers: Move to DB or config
- ⚠️ Payment processing: Handle multiple currencies

### Can Wait
- Theme/branding per country
- Regional hub dropdown
- Per-country contact info management

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 7, 2025 | Claude Code | Initial registration flow analysis |
| 1.1 | Dec 7, 2025 | Claude Code | Added multi-country architecture analysis |

---

**End of Document**

*This document is intended for collaborative review. Please add comments, questions, or corrections directly to facilitate team discussion.*
