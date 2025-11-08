# Portal Home Hub - Multi-Country Real Estate Platform

**Status:** ✅ FULLY OPERATIONAL | **Last Updated:** November 7, 2025  
**Live URL:** https://portalhomehub.com

A Next.js-based multi-country real estate management portal built for Jamaica and Guyana markets.

## 🌍 About

Portal Home Hub is the backend management system for real estate agents, FSBO sellers, and landlords across multiple Caribbean markets. Features complete data isolation, currency support, and country-specific theming.

### **Live Markets:**
- 🇯🇲 **Jamaica:** Fully operational and ready
- 🇬🇾 **Guyana:** Fully operational

### **Key Features:**
- Multi-country database isolation
- Country-specific pricing (JMD/GYD)  
- Theme switching (Jamaica green/Guyana blue)
- Featuring prices system (aligned with live markets)
- Mobile-responsive design
- Admin permission system
- Stripe payment integration

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

## 📋 Quick Resume Guide

**If you need to pick up where you left off:**

1. **Current Status:** Check `CURRENT_STATUS_OCT18_2025.md` for complete overview
2. **Jamaica Launch:** See `JAMAICA-LAUNCH-READY.md` for domain setup steps  
3. **Architecture:** Review `COMPLETE_ARCHITECTURE_ANALYSIS.md` for system design

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production  
npm run build

# Deploy to production
vercel --prod

# Database operations
node run-featuring-prices-alignment.js
node verify-featuring-prices-alignment.js
```

## 🌐 Key URLs

- **Jamaica Pricing:** `/pricing?site=jamaica`
- **Guyana Pricing:** `/pricing?site=guyana`  
- **Admin Dashboard:** `/admin-dashboard`
- **Agent Dashboard:** `/dashboard/agent`

## 📞 Emergency Info

- **Database:** Supabase (opjnizbtppkynxzssijy.supabase.co)
- **Deployment:** Vercel (portal-home-hub project)
- **Domain Status:** portalhomehub.com (live and operational)

## 📚 Documentation

**Current Status:**
- `CURRENT_STATUS.md` - Up-to-date system status (November 2025)

**Archived Documentation:**
- `ARCHIVE/2025-planning-docs/` - Historical planning and development docs
- Old status reports and session notes moved to archive for cleanup

---

**🏆 SYSTEM STATUS: FULLY OPERATIONAL**  
Multi-country platform live and serving Jamaica and Guyana markets.  
**Recent Updates:** Super admin security hardening, documentation cleanup.
# Force deployment
