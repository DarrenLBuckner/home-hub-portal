# Portal Home Hub - Multi-Country Real Estate Platform

**Status:** ✅ LAUNCH READY | **Last Updated:** November 18, 2025  
**Live URL:** https://portalhomehub.com

A Next.js 15 real estate management portal built for Caribbean markets (Jamaica & Guyana).

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
vercel --prod
```

## 🏗️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase PostgreSQL
- **Storage:** Supabase Storage (direct upload)
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Payments:** Stripe

## 🌍 Multi-Country Architecture

### Live Markets
- 🇯🇲 **Jamaica:** JamaicaHomeHub.com (JMD currency, green theme)
- 🇬🇾 **Guyana:** GuyanaHomeHub.com (GYD currency, blue theme)

### Data Isolation
- Country-specific filtering at database level
- Separate featuring prices per market
- Admin permissions scoped by country
- Complete data privacy between markets

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── api/                 # API routes
│   ├── dashboard/           # User dashboards
│   ├── admin-dashboard/     # Admin interface
│   └── (auth)/              # Auth pages
├── components/              # React components
├── lib/                     # Utilities and helpers
└── types/                   # TypeScript definitions

database-migrations/         # SQL migration scripts
scripts/                     # Utility scripts
supabase/                    # Supabase config
```

## 🔑 Key Features

### For Agents & Landlords
- Property listing management (residential/commercial)
- Image upload with compression
- Draft auto-save
- WhatsApp contact integration
- Mobile-optimized forms

### For Buyers
- Advanced property search
- Country-specific results
- Mobile-friendly browsing
- Direct WhatsApp contact

### For Admins
- Property approval workflow
- User management
- Analytics dashboard
- Multi-country permissions

## 🔧 Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## 📱 Mobile Optimization

- 60% mobile traffic (85-90% Android)
- 44px minimum touch targets
- Image compression (89%)
- WhatsApp-first communication
- 3G/4G network optimized

## 🛠️ Development Notes

### Property Creation Flow
1. User creates property (Agent/Landlord/FSBO)
2. Status: `draft` → `pending` (on submit)
3. Admin reviews and approves
4. Status: `pending` → `active` (live on site)

### Admin Registry
Hardcoded in `src/app/api/properties/create/route.ts`:
- Super Admins: Full access all countries
- Owner Admins: Country-specific management
- Basic Admins: Limited permissions

### Image Storage
- Bucket: `property-images`
- Organization: `userId/timestamp-filename.ext`
- Direct browser upload (no server proxy)
- Max 50MB per file, auto-compress to 89%

## 📊 Launch Readiness

See `FINAL_LAUNCH_READINESS_REVIEW.md` for:
- Comprehensive audit results (84/100 score)
- GO/NO-GO recommendation
- Known limitations
- Week 1 monitoring plan

## 🆘 Support

- **Technical Issues:** GitHub Issues
- **Supabase:** opjnizbtppkynxzssijy.supabase.co
- **Deployment:** Vercel portal-home-hub project

---

**Built with ❤️ for Caribbean real estate markets**
