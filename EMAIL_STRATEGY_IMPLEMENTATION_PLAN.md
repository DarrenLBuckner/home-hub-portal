# 📧 EMAIL STRATEGY IMPLEMENTATION PLAN
## Date: September 27, 2025

### 🎯 **FINAL EMAIL STRATEGY DECISION**

**Dual Domain Approach:**
- **@portalhomehub.com** - Main global brand
- **@guyanahomehub.com** - Guyana-specific operations (Qumar's domain)

### 📋 **TOMORROW'S IMPLEMENTATION CHECKLIST**

#### **Phase 1: Code Updates (Priority 1)**
- [ ] Fix `no-reply@guyanahomehub.com` → `no-reply@portalhomehub.com` in send-status-email.ts
- [ ] Update `info@guyanahomehub.com` → `info@portalhomehub.com` in terms.tsx and privacy.tsx
- [ ] Update `support@guyanahomehub.com` → `support@portalhomehub.com` in approval email routes
- [ ] Keep Qumar's `qumar@guyanahomehub.com` unchanged (Guyana admin)

#### **Phase 2: Email Account Setup (Priority 2)**
Create these email accounts:

**@portalhomehub.com (Global):**
- [ ] `info@portalhomehub.com` ✅ (Already exists)
- [ ] `support@portalhomehub.com`
- [ ] `no-reply@portalhomehub.com` 
- [ ] `agents@portalhomehub.com`
- [ ] `landlords@portalhomehub.com`
- [ ] `fsbo@portalhomehub.com`
- [ ] `advertisers@portalhomehub.com` (for upcoming front page feature)
- [ ] `admin@portalhomehub.com`
- [ ] `billing@portalhomehub.com`

**@guyanahomehub.com (Guyana Operations):**
- [ ] `qumar@guyanahomehub.com` ✅ (Already exists)
- [ ] `agents-gy@guyanahomehub.com`
- [ ] `landlords-gy@guyanahomehub.com`
- [ ] `fsbo-gy@guyanahomehub.com`
- [ ] `support-gy@guyanahomehub.com`

#### **Phase 3: Email Forwarding Rules**
Set up forwarding so Qumar gets all Guyana-related emails:
- [ ] `agents-gy@guyanahomehub.com` → `qumar@guyanahomehub.com`
- [ ] `landlords-gy@guyanahomehub.com` → `qumar@guyanahomehub.com`
- [ ] `fsbo-gy@guyanahomehub.com` → `qumar@guyanahomehub.com`
- [ ] `support-gy@guyanahomehub.com` → `qumar@guyanahomehub.com`

#### **Phase 4: Advertiser Integration Planning**
For upcoming front page advertiser feature:
- [ ] Create `advertisers@portalhomehub.com` contact form
- [ ] Design advertiser inquiry email templates
- [ ] Plan advertiser onboarding email sequence

### 🔧 **TECHNICAL NOTES**

**Files to Update Tomorrow:**
1. `src/pages/api/send-status-email.ts` - Change from @guyanahomehub.com
2. `src/app/terms/page.tsx` - Update contact emails
3. `src/app/privacy/page.tsx` - Update contact emails  
4. `src/app/api/send-approval-email/route.ts` - Update support email

**Email Provider Setup:**
- Configure MX records for both domains
- Set up SMTP authentication for sending
- Configure forwarding rules in email host panel

### 🎯 **BUSINESS LOGIC**

**Why This Strategy Works:**
- ✅ Qumar manages all Guyana operations through familiar domain
- ✅ Global brand consistency with @portalhomehub.com
- ✅ Clear separation of regional vs global operations
- ✅ Scalable for future country expansions
- ✅ Local trust + global professionalism

**User Experience:**
- Guyanese users see @guyanahomehub.com (local trust)
- International users see @portalhomehub.com (professional brand)
- All Guyana inquiries flow to Qumar automatically
- Clear contact points for different user types

### ⚡ **IMMEDIATE PRIORITIES FOR TOMORROW**
1. **Fix code inconsistencies** (30 minutes)
2. **Set up missing email accounts** (60 minutes)  
3. **Configure forwarding to Qumar** (30 minutes)
4. **Test email flow** (30 minutes)
5. **Document final setup** (30 minutes)

**Total Time Estimate: 3 hours**