# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Vercel account
- Supabase project setup
- Stripe account (for payments)

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd Portal-home-hub
npm install
```

### 2. Environment Variables

Create `.env.local` in project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://opjnizbtppkynxzssijy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Stripe
STRIPE_SECRET_KEY=sk_live_or_test_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key
```

### 3. Database Setup

Run migrations in Supabase SQL Editor:

```sql
-- Run scripts from database-migrations/ folder
\i database-migrations/create-property-likes-table.sql
\i database-migrations/optimize-search-indexes.sql
```

## Local Development

### Start Dev Server
```bash
npm run dev
```

### Build Test
```bash
npm run build
npm start
```

### Type Check
```bash
npm run type-check
```

## Vercel Deployment

### Initial Setup

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Link Project**
```bash
vercel link
```

### Deploy to Production

```bash
vercel --prod
```

### Environment Variables in Vercel

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all variables from `.env.local`
3. Set for: Production, Preview, Development
4. Redeploy after adding variables

## Domain Configuration

### Jamaica Home Hub
1. Add domain: `jamaicahomehub.com`
2. Configure DNS:
   ```
   A Record: @ → 76.76.19.19
   CNAME: www → cname.vercel-dns.com
   ```
3. SSL auto-provisions in 24 hours

### Guyana Home Hub
1. Add domain: `guyanahomehub.com`
2. Configure DNS (same as above)

### Portal Admin
1. Primary domain: `portalhomehub.com`
2. Main management interface

## Post-Deployment Checklist

### ✅ Verify Core Features
- [ ] Property creation works (Agent/Landlord/FSBO)
- [ ] Image upload functional
- [ ] Property search returns results
- [ ] Admin approval workflow works
- [ ] WhatsApp buttons link correctly
- [ ] Country filtering active

### ✅ Test User Flows
- [ ] New user registration
- [ ] Login/logout
- [ ] Password reset
- [ ] Create property (all types)
- [ ] Submit for approval
- [ ] Admin approve property
- [ ] Property appears on public site

### ✅ Mobile Testing
- [ ] Forms usable on mobile
- [ ] Image upload works on Android
- [ ] Touch targets 44px minimum
- [ ] WhatsApp buttons work
- [ ] No horizontal scroll

### ✅ Admin Functions
- [ ] Can access admin dashboard
- [ ] Can approve/reject properties
- [ ] Can manage users
- [ ] Permissions enforced

### ✅ Performance
- [ ] Page load <3 seconds (3G)
- [ ] Images compressed
- [ ] No console errors
- [ ] API routes respond <1s

## Monitoring

### Vercel Analytics
- Enable in Vercel Dashboard
- Monitor page views, core web vitals
- Track error rates

### Supabase Logs
- Check database logs daily
- Monitor storage usage
- Review API logs for errors

### Weekly Review
- Property creation success rate
- Support ticket count
- Mobile vs desktop traffic
- WhatsApp click-through rate

## Rollback Procedure

### If Critical Issue Found

1. **Quick Rollback**
```bash
vercel rollback
```

2. **Redeploy Previous Version**
```bash
git revert HEAD
git push origin main
```

3. **Emergency Maintenance**
- Update site status in admin dashboard
- Notify agents via WhatsApp group
- Pause new property submissions

## Troubleshooting

### Build Fails
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues
- Check Supabase project status
- Verify connection string in env vars
- Review RLS policies

### Image Upload Fails
- Check Supabase Storage bucket exists: `property-images`
- Verify bucket is public
- Check file size limits (50MB max)

### 404 Errors on Deployment
- Clear Vercel build cache
- Verify `vercel.json` routing rules
- Check Next.js 15 App Router structure

## Support Contacts

- **Technical Issues:** Create GitHub issue
- **Vercel Support:** Vercel dashboard → Help
- **Supabase Support:** Supabase dashboard → Support
- **Domain DNS:** Domain registrar support

## Security Notes

- Never commit `.env.local` to git
- Rotate API keys quarterly
- Review Supabase RLS policies monthly
- Monitor suspicious login attempts
- Keep dependencies updated

---

**Deployment Status: ✅ PRODUCTION READY**  
Last updated: November 18, 2025
