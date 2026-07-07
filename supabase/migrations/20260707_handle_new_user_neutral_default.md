# Fix: handle_new_user defaults new signups to 'user', not 'owner'
Date: 2026-07-07 | Repo: home-hub-portal | Status: APPLIED to production via Supabase

## Problem
Trigger `on_auth_user_created` → `public.handle_new_user()` fired on every new
auth.users row and hardcoded `user_type = 'owner'`. Runs as SECURITY DEFINER, so
it bypassed the app-layer territory-signup guards (PR #8, 2026-06-04).

Effect: every social sign-in (Continue with Google/Facebook, consumer navbar)
created a phantom `owner` in `approval_status = 'pending'`, surfacing in the admin
FSBO queue as a fake application. Root cause of the 18 "FSBO applications" seen
2026-06-27/28, weeks after the signup route was believed closed.

## Fix
Point the trigger default at `'user'`, already permitted by
`profiles_user_type_check` (admin, agent, fsbo, landlord, owner, buyer, renter,
user). No ALTER TABLE / ALTER TYPE needed.

## Safe because
- Register routes set user_type explicitly AFTER account creation; ON CONFLICT
  (id) DO NOTHING preserves that overwrite.
- No code throws on unrecognized user_type; role gates are positive matches, so a
  'user' profile simply gets no seller/agent tooling.

## Scope
Forward-only. Does NOT reclassify existing owner-ghost profiles (handled
separately: triage + backfill).

## SQL applied
See 20260707_handle_new_user_neutral_default.sql (same folder).

## Rollback
Re-run the function with 'user' swapped back to 'owner'.
