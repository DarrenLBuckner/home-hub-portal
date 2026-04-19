# Business Directory

**Draft for Book 11 — Platform Features. Darren to integrate.**
**Last updated:** 2026-04-19

---

## Overview

Public directory of real estate-related service providers (contractors, lawyers, photographers, etc.) listed by category on the consumer site. Non-agent businesses submit via a public form; admins moderate in two tiers (Approve → Verify).

## Table: `service_providers`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | Business name. **Canonical.** `business_name` column does NOT exist. |
| `category` | text | Slug only (e.g. `photography-media`). NEVER display names. |
| `email`, `phone`, `website`, `address`, `description` | text (nullable) | Contact details. |
| `site_id` | text | Country code (`GY`, `JM`, `CO`…). |
| `status` | text | `pending` → `active` or `rejected`. |
| `verified` | boolean | Independent of status. Shows ✓ badge publicly. |
| `featured` | boolean | Independent of verified. Pushes to premium-banner slot. Only allowed when `status='active'`. |
| `source` | text | `self-submitted`, `agent-referred`, etc. |
| `approved_at` / `approved_by` | timestamptz / uuid FK → profiles.id | Set on Approve action. |
| `verified_at` / `verified_by` | timestamptz / uuid FK → profiles.id | Set on Verify action. |
| `rejected_at` / `rejected_by` / `rejected_reason` | timestamptz / uuid / text | Set on Reject action. Reason is required (min 5 chars). |
| `created_at` | timestamptz | Submission time. |

### RLS Policies

| Policy | For | Using |
|---|---|---|
| Public insert | `anon`/`authenticated` | `true` |
| Public read active | `anon`/`authenticated` | `status = 'active'` |
| Admins read all service_providers | `authenticated` | `profiles.admin_level IN ('super','owner','basic')` |
| Admins update service_providers | `authenticated` | `profiles.admin_level IN ('super','owner','basic')` |

Admin API routes also go through `createServiceRoleClient()` which bypasses RLS — the admin policies are defense-in-depth.

## Valid category slugs

Strict enum — rejected on submit if not matching:

```
real-estate-agents, renovations, electrical, interior, landscaping,
building-materials, moving-storage, cleaning, security, legal-financial,
insurance, inspection, photography-media, general-contractors
```

## Flows

### Submit

- Consumer form at `/business-directory/list-your-business` (homehub-consumer)
- POSTs to `https://www.portalhomehub.com/api/business-directory/submit`
- **Rate limited:** 3 submissions / hour / IP (in-memory Map, single instance — basic spam protection only)
- **Validates:** name, email, category (must be a known slug)
- **Inserts:** `status='pending'`, `verified=false`, `featured=false`, `source='self-submitted'`
- **Notifies:** all `profiles` with `user_type='admin' AND admin_level='basic' AND country_id='GY'` via Resend email. Failure is non-fatal.

### Display

- Public list at `/business-directory` (homehub-consumer, `'use client'` page)
- Fetches `https://www.portalhomehub.com/api/public/services/GY?type=directory&category=<slug>`
- Filter: `site_id='GY' AND status='active'` via service-role client (RLS bypassed)
- Category counts and filter keyed by slug ID — matches stored category values

### Moderation queue (portal admin)

- Admin UI at `/admin-dashboard/service-providers`
- Access: any `profiles.user_type='admin'` with `admin_level ∈ {super, owner, basic}`
- Tabs: Pending / Approved / Verified / Rejected
- owner_admin scoped to their `country_id`; super + basic see all

### Moderation actions (API)

| Route | Effect | Audit fields written |
|---|---|---|
| `POST /api/admin/service-providers/[id]/approve` | `status='active'` | `approved_at`, `approved_by` |
| `POST /api/admin/service-providers/[id]/verify` | `verified=true` (also approves if still pending) | `verified_at`, `verified_by` (+approve fields if newly approved) |
| `POST /api/admin/service-providers/[id]/reject` | `status='rejected'` | `rejected_at`, `rejected_by`, `rejected_reason` (required, min 5 chars) |
| `POST /api/admin/service-providers/[id]/feature` | Body `{featured: boolean}` | `featured` (row must already be `status='active'`) |

All routes: service-role client, `requireAdmin()` gate at [src/app/api/admin/service-providers/_auth.ts](../../src/app/api/admin/service-providers/_auth.ts).

## Two-tier moderation standard

### Approve (`status='active'`, no badge)
- Takes 30 seconds.
- Check: real phone/email, not obviously spam/test, category matches description, business in Guyana.
- Result: appears in public directory with no trust signal.

### Verify (`verified=true`, ✓ badge shown)
- Takes 5–10 minutes.
- Check: phoned the business, someone answered, matched business name, confirmed operating.
- Result: appears with verified checkmark.
- Can be done directly from Pending (skips Approve-then-Verify two-step).

### Reject (`status='rejected'`)
- Reason required, stored for audit. Row NOT deleted.
- Typical reasons: fake/spam, duplicate, out-of-country, category fraud.

### Feature (`featured=true`, ★ pushes to premium-banner slot)
- Independent from verified. Toggle on an already-approved row.
- Intended for paid placement / editorial highlights — not automatic.

## Known gotchas

- **Column is `name`, not `business_name`.** `business_name` does not exist. Don't add it.
- **Categories are slugs only.** Old rows (pre-2026-04-19 migration) stored display names. Migration M3 normalized them. Do not reintroduce display-name writes.
- **Rate limit is per-instance.** Vercel runs multiple instances; effective limit is per-instance × 3/hour. Adequate for basic spam deterrence; if abuse occurs, move to Upstash or similar.
- **The old `/admin/business-submissions` page and `/api/admin/business-submissions` route** (prior attempt with merged approve+verify logic, client-side anon auth, no audit fields) were **deleted** in the same PR that introduced this queue. Do not reintroduce.
- **Approve → Verify is sequential in UX** but Verify implicitly approves if row is still pending (convenience for fast-track).

## Related ops

- Alphius (basic_admin) reviews the Service Providers queue in addition to the Agent Review Queue.
- Operational email template for admin notification defined inline in submit route — not in `email_templates` table. If we ever migrate to the `email_templates` table, duplicate for consistency with agent-application-notification pattern.

## Future scope (NOT in current PR)

- Persistent rate limiting (Upstash or database-backed)
- Paid featured slots (pricing + Stripe wiring)
- Business claim/verify-by-owner flow (email magic link)
- Bulk CSV import for seeding
- Sitemap entries for each active provider (SEO)
