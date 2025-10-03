# 🏗️ GUYANA HOME HUB - TECHNICAL ARCHITECTURE REFERENCE

## 📊 SYSTEM OVERVIEW
- **Platform**: Next.js 15 + TypeScript + Supabase PostgreSQL
- **Domain**: Portal-home-hub.com (multi-country ready)
- **Primary Market**: Guyana (expanding to Jamaica, Trinidad, Barbados)
- **Launch Status**: Live but stealth (no marketing yet)

## 🗄️ DATABASE SCHEMA SUMMARY

### Core Tables:
- `profiles` - User accounts with role-based permissions
- `properties` - Property listings (sale/rental)
- `countries` - Multi-country support (6 countries configured)
- `user_property_limits` - Trial periods and listing limits
- `property_quotas` - Role-based property limits
- `admin_trial_extensions` - Admin trial management
- `payment_history` - Payment tracking
- `pricing_plans` - Country-specific pricing

### Key Relationships:
- Users → Properties (one-to-many)
- Users → Countries (many-to-one)
- Admins → Country Assignment (role-based filtering)

## 👥 USER ROLES & PERMISSIONS

### User Types:
1. **FSBO** - 1 property, 60-day trial, upgrade required
2. **Landlord** - 1 rental property, 60-day trial, upgrade required  
3. **Agent** - 10 properties, 60-day trial, upgrade required
4. **Admin** - 20 sale + 5 rental, no upgrade required

### Admin Hierarchy:
1. **Super Admin** (mrdarrenbuckner@gmail.com) - Global access, all countries
2. **Owner Admin** - Country-specific access (Jamaica Admin, Trinidad Admin, etc.)
3. **Basic Admin** - Front-line support, limited permissions

## 🎯 BUSINESS MODEL
- **Freemium**: Free trials, then paid subscriptions
- **Multi-tier**: Different limits per user type
- **Multi-country**: Country-specific pricing and admin management
- **Revenue**: Property listing fees, premium features

## 🔒 SECURITY FEATURES
- Row Level Security (RLS) policies
- Country-based data filtering
- Role-based access control (RBAC)
- Admin permission inheritance
- Email-based super admin bypass

## 🌍 MULTI-COUNTRY READINESS
- Database: ✅ Country table populated
- Admin System: ✅ Country-aware permissions  
- Pricing: ✅ Country-specific pricing plans
- Architecture: ✅ 80% ready for expansion

**Next Countries**: Jamaica, Trinidad & Tobago, Barbados
**Timeline**: 6-12 months after Guyana optimization

---
*Last Updated: October 2, 2025*
*Status: Production Ready - Testing Phase*