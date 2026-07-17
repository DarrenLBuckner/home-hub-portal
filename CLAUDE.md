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
3. **Admin queries need service-role keys — with ONE exception.**
   For every table except `agent_documents`, admin (super/owner/basic) reads and writes
   require Supabase service-role keys. Those tables have no admin RLS policies, so RLS
   silently blocks client-side admin queries — they return nothing.
   **EXCEPTION — `agent_documents` and the `agent-documents` bucket:** both carry real
   admin RLS policies enforcing a territory boundary. Admin reads there MUST use the
   admin's own JWT. Service-role bypasses RLS entirely and would make the boundary
   decorative. See "Agent documents — storage & RLS" §1.
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

## Agent documents — storage & RLS (locked 2026-07-16)

Table `agent_documents` + private bucket `agent-documents`. Agents upload GRA House Agent
Licences; supporting documents may include national IDs. Design is **ephemeral storage**:
admin reviews via short-lived Signed URL, file is deleted the moment the decision is
submitted (approve OR reject). The row is then the only surviving record — an attestation,
not an artifact.

**1. Admin storage reads use the ADMIN'S OWN JWT. Never service-role.**
This is a deliberate deviation from the `requireAdmin` + service-role pattern used elsewhere
in this repo. `service_role` bypasses RLS entirely — it is not subject to policies at all.
Sign Signed URLs with the admin's JWT or the storage RLS never executes and the territory
boundary is decorative. A policy already exists in this database granting SELECT to
`service_role` on a verification bucket; it is a no-op and it is the mistake this rule prevents.

**2. Path contract:** `agent-documents/{country_code}/{user_id}/{document_type}-{timestamp}.{ext}`
Country FIRST. RLS reads `(storage.foldername(name))[1]` = country_code and `[2]` = user_id.
Do not reorder.

**3. Storage RLS and table RLS express the SAME rule.**
The only permitted difference: storage reads `(storage.foldername(name))[1]`; the table reads
`agent_documents.country_code`. If they ever diverge, that is a bug, not a refactor. The two
policies deliberately share a name so the mirror is visible in `pg_policies`.

**4. `admin_level = 'super'` ignores `admin_country`, and both supers have `admin_country` NULL.**
The super branch MUST be evaluated before any country comparison. Country-first logic returns
zero rows for every Super Admin. Access model: `user_type='admin'` is the gate;
`super` → all countries; `owner`/`basic` → own `admin_country` only; `owner` and `basic` are
identical for this table.

**5. `profiles.country` is client-supplied at registration. NEVER an authorization input.**
Use `profiles.admin_country` (values are `'GY'`, not `'Guyana'`). `profiles.country_id` and
`profiles.roles` are not authorization inputs either — `roles` is 100% NULL.

**6. A policy's bucket_id string must match `storage.buckets.id` exactly.**
Hyphen-vs-underscore drift has already produced FOUR dead policies in this database — they
reference buckets that do not exist and silently enforce nothing. After any storage policy
change, verify:
`SELECT count(*) FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND (qual LIKE '%<bucket>%' OR with_check LIKE '%<bucket>%');`
against `SELECT id FROM storage.buckets WHERE id='<bucket>';` — the policy count must match
what you created and the bucket must exist.

**7. Blank strings are not values.**
`''` is counted by `count()`. Found live: `agent_vetting.license_number` is `''` for 53 of 61
approved agents, so the column reported 60 agents holding a licence when the real figure was 5.
A fake metric with no author. Text columns that carry evidence get
`CHECK (col IS NULL OR length(trim(col)) > 0)`. NULL means not provided; blank means nothing
and may not pretend otherwise.

**8. No DELETE policy on `public.agent_documents`, deliberately.**
"Rejected rows are never deleted. Status flips; the row stays." The audit trail is enforced by
the ABSENCE of a policy. Do not add one.

**9. `agent-documents` rejects HEIC.**
Bucket allows pdf/jpeg/png only. iPhones shoot HEIC by default and browsers cannot render it —
an accepted-but-unviewable document is worse than a rejected upload. Clients convert to JPEG
before upload.
