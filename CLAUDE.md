# CLAUDE.md — home-hub-portal

> Repo: `DarrenLBuckner/home-hub-portal`
> Agent + admin backend. Serves portalhomehub.com under the Portal HomeHub parent
> brand. This is the infrastructure side: agent onboarding, listing management,
> admin tooling, and the Territory Launch System. Built to launch 50+ countries
> from one codebase and one database.

## Stack
- Next.js (App Router) + Supabase (Postgres + Auth + Storage) + Vercel + Resend.
- One codebase, one database. New country launch = one row in the `territories`
  table (and, in progress, one click in the Territory Launch Dashboard) — never a
  code change. Build every feature as territory-agnostic from day one. No shortcuts
  that create scaling debt.

## Infrastructure IDs
- Vercel team: `team_srVGTZ3DuFz2zT1HD2k6LsxZ`
- Vercel project (this repo): `prj_n9QfgjZkDJksXb6ipfvEM21HREdo`
- Supabase project: `opjnizbtppkynxzssijy`

## Critical gotchas — read before touching data, APIs, or deploys
1. **Portal API requires the `www.` prefix.** Call `https://www.portalhomehub.com/...`.
   Omitting `www.` triggers a redirect that STRIPS the POST body — requests silently
   lose their data. Always include `www.`.
2. **RLS country header.** Any query path that does NOT send the `x-country-code`
   header returns ZERO rows — `country_id = ''` is a deny-all fallback. Empty results
   are usually a missing header, not missing data.
3. **Admin queries need service-role keys.** All admin (super/owner/basic) reads and
   writes require Supabase service-role keys. RLS silently blocks client-side admin
   queries — they return nothing. Any future client-side admin query path WILL hit
   this; design around it.
4. **Storage path is canonical.** Uploads to the `property-images` bucket use
   `property-images/{property.user_id}/{filename}` — NEVER `currentUser.id`. When an
   admin edits on behalf of an agent, files belong under the AGENT's user_id, not the
   admin's. (Misattribution to the admin folder has caused orphaned/duplicate files.)

## Brand
- Primary emerald `#059669` | hover `#047857` | light bg `#d1fae5` | amber accent
  `#f59e0b` (sparingly).

## How to work in this repo (workflow rules — follow exactly)
- Read the architecture spec and the live source BEFORE writing anything. Confirm the
  full list of files you intend to change before making changes.
- Show diffs for review. Do not commit until I give explicit approval AND the exact
  commit message to use.
- `npm run build` must pass before you report a task complete.
- No heroics: strict sequential execution, explicit sign-off at each step. List
  explicit out-of-scope items to prevent scope creep.
- **Never push to remote or trigger a Vercel deploy without my explicit approval.**
- Atomic single-file PRs, when the working tree has uncommitted WIP, are built in an
  isolated git worktree off `origin/main`. Remove the worktree after the PR merges.

## Commit standard (sale-readiness / due diligence)
- Single-line commit messages. No body. No `Co-Authored-By` line. Ever.

## SQL
- I run all SQL myself in Supabase and bring back results. Do not run SQL directly.
  When you hand me SQL, do NOT wrap it in backticks/code fences — backticks cause
  syntax errors when I paste into the Supabase editor.

## Verification
- "Done" is not a deploy status or a preview URL. Production verification = I load the
  live production URL in my own browser. Vercel READY status and preview links are not
  verification.

## Internal / token-gated content — NEVER expose publicly
- The AI-context page (`src/app/ai-context/[token]/page.tsx`) is a TOKEN-GATED,
  `robots: noindex/nofollow` briefing for the external GEO/AI-search consultant
  ("Sorilbran"). It is NOT public. Never remove the token gate or the noindex; never
  link it from any public page; never copy its rows onto public surfaces, schema, or
  marketing — several rows are explicitly marked **CONFIDENTIAL — DO NOT PUBLISH**.
- Updating it is a content-only edit per `.claude/UPDATE_AI_CONTEXT.md`: edit only the
  `PAGE_BODY` / `LAST_UPDATED` constants, run the contradiction gate, show the diff,
  commit `chore: update ai-context page [DATE]` ONLY on explicit approval. Do NOT run a
  build, push, or deploy to "verify" or publish it — I trigger the Vercel deploy myself,
  then send the token URL to the consultant. It is not a public-facing build task.
- Internal ops briefings kept outside the repo (e.g. the Facebook Ads Resumption
  Command) are local-only working docs — never add them to the repo or the live site.
