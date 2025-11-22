# Portal Home Hub - System Architecture

## Overview
Portal Home Hub is a multi-country real estate platform built with Next.js 15, Supabase, and Vercel.

## Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom React components
- **Forms:** React Hook Form
- **State Management:** React Context + Server Components

### Backend
- **Database:** Supabase PostgreSQL
- **Storage:** Supabase Storage
- **Auth:** Supabase Auth
- **API:** Next.js API Routes (App Router)

### Infrastructure
- **Hosting:** Vercel (edge functions, automatic deployments)
- **CDN:** Vercel Edge Network
- **Payments:** Stripe

## Database Schema

### Core Tables
- `profiles` - User accounts (agents, landlords, FSBO, admins)
- `properties` - Property listings (residential & commercial)
- `countries` - Market configuration (Jamaica, Guyana)
- `regions` - Geographic areas within countries
- `property_likes` - User favorites

### Admin System
- Hardcoded admin registry in `/api/properties/create/route.ts`
- Roles: super_admin, owner_admin, basic_admin
- Country-scoped permissions for non-super admins

## Multi-Country Architecture

### Data Isolation
Properties filtered by `country_id` at database level:
```sql
WHERE country_id = (SELECT id FROM countries WHERE code = 'GY')
```

### Country Detection
Public site uses query parameter:
```
jamaicahomehub.com → site=jamaica
guyanahomehub.com → site=guyana
```

### Currency & Theme
- Jamaica: JMD currency, green theme
- Guyana: GYD currency, blue theme

## Property Workflow

### Status Progression
1. **draft** - User is creating (auto-saved)
2. **pending** - Submitted for review
3. **active** - Admin approved, live on site
4. **inactive** - Admin rejected or user deactivated

### Approval Process
- All non-admin properties require manual approval
- Admins review in `/admin-dashboard/property-review`
- Can edit prices during approval

## Image Storage

### Structure
```
property-images/
  ├── {userId}/
  │   ├── {timestamp}-{filename}.jpg
  │   └── ...
```

### Upload Flow
1. Browser compresses to 89% quality
2. Direct upload to Supabase Storage (no API proxy)
3. Public URLs stored in `properties.images` JSON array
4. Max 50MB per file

## Mobile Optimization

### Constraints
- 60% mobile traffic
- 85-90% Android devices
- Primarily 3G/4G networks
- WhatsApp primary communication

### Optimizations
- 44px minimum touch targets
- 89% image compression
- Progress indicators for uploads
- Mobile-first form design
- Direct Supabase upload (avoids 413 errors)

## Security

### Authentication
- Supabase Auth (email/password)
- Row Level Security (RLS) policies
- Admin permissions enforced at API level

### Data Privacy
- Country filtering enforced in queries
- Users only see own country's data (non-admins)
- Admin registry hardcoded (not in database)

## Performance

### Server Components
- Property lists use React Server Components
- Reduces client-side JavaScript
- Faster initial page loads

### Image Optimization
- Next.js Image component
- Automatic webp conversion
- Lazy loading below fold

### Caching
- Static pages: ISR with revalidation
- API routes: Supabase connection pooling
- CDN: Vercel Edge Network

## Monitoring

### Week 1 Metrics (Soft Launch)
- Property creation success rate
- Support tickets per agent
- WhatsApp click-through rate
- Mobile vs desktop usage
- Draft accumulation per user

### Error Tracking
- Supabase logs for database errors
- Vercel logs for API errors
- Client-side console errors (development)

## Deployment

### Environments
- **Development:** `npm run dev` (localhost:3000)
- **Preview:** Vercel preview deployments (PRs)
- **Production:** Vercel production (portalhomehub.com)

### CI/CD
1. Push to `main` branch
2. Vercel auto-builds
3. Runs TypeScript checks
4. Deploys to production
5. Automatic DNS propagation

## Known Limitations

### Trial System
- No countdown timer (manual management for soft launch)
- 5-agent soft launch phase
- Future: Automated trial enforcement

### Auto-Approve
- Disabled by design (manual review required)
- Admin must approve all properties
- Future: Auto-approve for trusted agents

### WhatsApp Integration
- FSBO users must manually enter WhatsApp
- Agents/Landlords auto-populated from profile
- Future: Universal auto-population

### Search
- Basic PostgreSQL text search
- No advanced NLP or fuzzy matching
- Future: Elasticsearch integration

## Future Enhancements

### Phase 2 (Post-Launch Month 1)
- Loading skeletons for property lists
- Enhanced error messages
- Empty state illustrations
- Email notifications

### Phase 3 (Month 2-3)
- Advanced search filters
- Saved searches
- Agent analytics dashboard
- Automated trial management

### Phase 4 (Month 4+)
- Mobile app (React Native)
- WhatsApp API integration
- Virtual property tours
- AI-powered property descriptions
