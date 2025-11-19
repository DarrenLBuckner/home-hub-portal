# Developer Quick Reference

## 🚀 Common Commands

### Development
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm start            # Run production build locally
```

### Deployment
```bash
vercel --prod        # Deploy to production
vercel rollback      # Rollback to previous deployment
```

### Database
```bash
# Supabase Dashboard
https://supabase.com/dashboard/project/opjnizbtppkynxzssijy

# SQL Editor: Run migrations from database-migrations/
```

## 📂 Key File Locations

### API Routes
- Property Creation: `src/app/api/properties/create/route.ts`
- Property Search: `src/app/api/properties/route.ts`
- Admin Actions: `src/app/api/admin/`

### Dashboard Pages
- Agent: `src/app/dashboard/agent/`
- Landlord: `src/app/dashboard/landlord/`
- FSBO: `src/app/dashboard/fsbo/`
- Admin: `src/app/admin-dashboard/`

### Components
- Property Forms: `src/app/dashboard/{role}/create-property/page.tsx`
- Image Upload: `src/components/EnhancedImageUpload.tsx`
- Property Details: `src/components/PropertyDetailClient.tsx`
- Property List: `src/components/PropertiesListClient.tsx`

## 🔧 Admin Registry

Location: `src/app/api/properties/create/route.ts` (lines 195-199)

```typescript
const ADMIN_USERS = {
  super_admins: ['mrdarrenbuckner@gmail.com'],
  owner_admins: ['qumar@guyanahomehub.com'],
  basic_admins: []
};
```

## 🌍 Country Codes

- Jamaica: `JM` (country_id: 1)
- Guyana: `GY` (country_id: 2)

## 📱 Important URLs

### Development
- Local: http://localhost:3000
- Admin: http://localhost:3000/admin-dashboard
- Agent Dashboard: http://localhost:3000/dashboard/agent

### Production
- Portal: https://portalhomehub.com
- Jamaica: https://jamaicahomehub.com
- Guyana: https://guyanahomehub.com

## 🐛 Debugging

### Common Issues

**Property Not Showing**
- Check status is `active` (not `pending` or `draft`)
- Verify country_id matches site parameter
- Confirm images array is populated

**Upload Failing**
- Check Supabase Storage bucket: `property-images`
- Verify bucket is public
- Check file size <50MB
- Review browser console for errors

**Admin Can't Approve**
- Verify email in admin registry
- Check country_id matches admin's country (non-super)
- Confirm user logged in with correct account

### Useful SQL Queries

```sql
-- Check property status
SELECT id, title, status, country_id FROM properties WHERE id = 'property-id';

-- Find pending properties
SELECT * FROM properties WHERE status = 'pending' ORDER BY created_at DESC;

-- Check user role
SELECT email, country_id FROM profiles WHERE email = 'user@example.com';

-- Count properties by country
SELECT c.name, COUNT(*) FROM properties p
JOIN countries c ON p.country_id = c.id
GROUP BY c.name;
```

## 🔐 Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://opjnizbtppkynxzssijy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## 📊 Property Workflow

```
User Creates → draft
User Submits → pending
Admin Reviews → pending
Admin Approves → active (LIVE)
Admin Rejects → inactive
```

## 🎨 Theme Colors

### Jamaica (Green)
- Primary: #10B981 (emerald-500)
- Dark: #059669 (emerald-600)

### Guyana (Blue)
- Primary: #3B82F6 (blue-500)
- Dark: #2563EB (blue-600)

## 📞 Support Contacts

- **WhatsApp Support:** +592-762-9797
- **Supabase Project:** opjnizbtppkynxzssijy
- **Vercel Project:** portal-home-hub

## 🚨 Emergency Procedures

### Site Down
1. Check Vercel status dashboard
2. Check Supabase status
3. Review recent deployments
4. Rollback if needed: `vercel rollback`

### Database Issues
1. Check Supabase dashboard logs
2. Verify RLS policies not blocking queries
3. Check connection pooling limits
4. Review recent migrations

### Critical Bug
1. Hotfix branch from main
2. Test locally
3. Deploy to preview
4. Merge and deploy to prod
5. Monitor logs

---

**Last Updated:** November 18, 2025
