# 🚨 CRITICAL ISSUE REPORT: API Route Returns 404

## Problem Summary
The `/api/viewing-requests` endpoint returns **404 - Page Not Found** even though the route file exists at `src/app/api/viewing-requests/route.ts`. Next.js is unable to compile this route (and even a simple test route).

---

## Root Cause Analysis

1. **Route File Exists**: Confirmed at `c:\LocalFiles\Home Hub Folders\Portal-home-hub\src\app\api\viewing-requests\route.ts`

2. **No TypeScript Errors**: The file has no compilation errors when checked by VS Code/TypeScript

3. **Server Starts Successfully**: Next.js dev server starts with "✓ Ready in 1640ms"

4. **Route Not Compiled**: When hitting the endpoint:
   ```
   POST /api/viewing-requests 404 in 844ms
   ```
   Other routes like `/_not-found` compile on-demand, but `viewing-requests` does not.

5. **Test Route Also Fails**: Created a simple test route (`/api/test-viewing/route.ts`) with minimal code - also returns 404

---

## What We Changed (That May Have Caused This)

### 1. Modified `src/lib/supabase/server.ts`
- Added `createServiceRoleClient()` function
- Changed from using `@supabase/ssr`'s `createServerClient` to `@supabase/supabase-js`'s `createClient` for the service role
- Made it synchronous (removed `async`)

### 2. Updated `src/app/api/viewing-requests/route.ts`
- Changed import from `createClient` to `createServiceRoleClient`
- Removed `await` when calling `createServiceRoleClient()`

### 3. Deleted duplicate file
- `app/api/viewing-requests/route.ts` (was conflicting with `src/app/api/viewing-requests/route.ts`)

---

## Debugging Attempted

- ✅ Verified file structure is correct
- ✅ Confirmed no TypeScript errors
- ✅ Checked environment variables exist (`SUPABASE_SERVICE_ROLE_KEY` present)
- ✅ Cleared `.next` build cache
- ✅ Created simple test route - also fails with 404
- ❌ Route won't compile even with minimal code

---

## Current Route Code Structure

### `src/app/api/viewing-requests/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '../../../lib/supabase/server';
import { sendViewingRequestEmails, SharedEmailParams } from '../../../lib/email/viewing-requests';

export async function POST(request: NextRequest) {
  console.log('=== VIEWING REQUEST API CALLED ==='); // Never executes
  const supabase = createServiceRoleClient(); // Changed from: await createClient()
  // ... rest of code
}
```

### `src/lib/supabase/server.ts`
```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createServiceRoleClient() { // Synchronous, no async
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
```

---

## Possible Causes

1. **Import Resolution Issue**: The relative imports `../../../lib/supabase/server` might be failing at runtime
2. **Module Loading Error**: Next.js can't load `@supabase/supabase-js` in this context
3. **Next.js Config Issue**: Something in `next.config.js` or `tsconfig.json` is preventing API route compilation
4. **Middleware Interference**: The middleware might be intercepting and blocking API routes
5. **Runtime Compilation Error**: There's a silent error during route compilation that's not being logged

---

## Suggested Solutions

### 1. Check Next.js Terminal Output
Look for ANY error messages (even warnings) when routes are accessed. The compilation error might be logged but not displayed prominently.

### 2. Try Absolute Imports
Change from relative imports to absolute:
```typescript
// Instead of:
import { createServiceRoleClient } from '../../../lib/supabase/server';

// Try:
import { createServiceRoleClient } from '@/lib/supabase/server';
```

### 3. Revert Service Role Changes
Go back to using the anon client to see if the route works again:
```typescript
const supabase = await createClient(); // Original code
```
Then address RLS separately.

### 4. Check Middleware
Review `src/middleware.ts` to ensure it's not blocking `/api/viewing-requests`:
- Check if there's a matcher that excludes this route
- Verify middleware isn't throwing errors for this path

### 5. Try Different Import Style
Create the Supabase client directly in the route file as a test:
```typescript
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // ... rest of code
}
```

### 6. Check Next.js Version Compatibility
Next.js 15.4.7 might have issues with certain import patterns or the way we're using the Supabase client.

### 7. Enable Verbose Logging
Add to `next.config.js`:
```javascript
const nextConfig = {
  // ... existing config
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    logging: 'verbose',
  },
};
```

---

## Quick Test to Isolate Issue

Create a minimal route file to test if ANY new API routes work:

```typescript
// src/app/api/debug-test/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Route works!' });
}
```

**If this also returns 404**, the issue is with Next.js itself, not our code.

---

## Terminal Output Example

```bash
PS C:\LocalFiles\Home Hub Folders\Portal-home-hub> npm run dev

> guyana-home-hub-portal@0.1.0 dev
> next dev

   ▲ Next.js 15.4.7
   - Local:        http://localhost:3000
   - Network:      http://192.168.68.120:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 1640ms
 ✓ Compiled /middleware in 227ms (181 modules)
🌍 MIDDLEWARE: Detected country: GY, site: public from hostname: localhost
🍪 MIDDLEWARE: Set country-code cookie to: GY, site-type: public
 ○ Compiling /_not-found ...
 ✓ Compiled /_not-found in 577ms (502 modules)
 POST /api/viewing-requests 404 in 844ms
```

Note: The route shows as 404, and there's NO compilation attempt for `/api/viewing-requests` like there is for `/_not-found`.

---

## Environment Info

- **Next.js Version**: 15.4.7
- **Node Version**: 20.x
- **OS**: Windows
- **Package Manager**: npm 10.x

---

## Original Working Code (Before Changes)

The route was working when it used:
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient(); // Used anon key
```

But this failed because RLS policies blocked the `anon` role from reading the `profiles` table when joined with `properties`.

---

## Next Steps

1. Check the Next.js dev server terminal for any compilation errors
2. Try the absolute import path (`@/lib/supabase/server`)
3. Test if reverting to the anon client makes the route work again
4. Review middleware configuration
5. Consider using a different approach for bypassing RLS (e.g., RLS policy changes instead of service role)
