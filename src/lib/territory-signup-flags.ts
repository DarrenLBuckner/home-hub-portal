// src/lib/territory-signup-flags.ts
//
// Single source of truth for "which signup types may a territory accept?".
// Reads the three boolean columns on the `territories` table:
//   agent_signup_enabled, landlord_signup_enabled, fsbo_signup_enabled
//
// Used by the register API write paths (server-side guards) and the register
// pages/nav (conditional rendering). Never hardcodes a country — pass the
// country_code the request already carries.

import { createServiceRoleClient } from '@/lib/supabase/server';

export interface TerritorySignupFlags {
  agentSignupEnabled: boolean;
  landlordSignupEnabled: boolean;
  fsboSignupEnabled: boolean;
}

export interface TerritorySignupContext {
  flags: TerritorySignupFlags;
  // The territory's consumer domain (e.g. "guyanahomehub.com"), used to build
  // cross-site links on the interstitial. Null when unknown.
  domain: string | null;
}

// FAIL CLOSED: if the territory row or its flags cannot be read, every signup
// type is treated as DISABLED. A lookup failure must never open a funnel.
const DISABLED: TerritorySignupFlags = {
  agentSignupEnabled: false,
  landlordSignupEnabled: false,
  fsboSignupEnabled: false,
};

// Matches the existing `|| 'GY'` default used across the register routes and
// the middleware country-code fallback.
const DEFAULT_COUNTRY_CODE = 'GY';

/**
 * Read the per-territory signup flags for a given country_code.
 * Returns all-disabled on any lookup failure (fail closed).
 *
 * @param countryCode e.g. the form's `country` / `country_id`. Falls back to
 *                    the existing 'GY' default when empty.
 */
export async function getTerritorySignupFlags(
  countryCode?: string | null,
): Promise<TerritorySignupFlags> {
  const code = (countryCode || DEFAULT_COUNTRY_CODE).toUpperCase();

  try {
    // Untyped service-role client — `territories` is not in the generated
    // Database types; this is the same client founder/page.tsx uses for it.
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('territories')
      .select('agent_signup_enabled, landlord_signup_enabled, fsbo_signup_enabled')
      .eq('country_code', code)
      .single();

    if (error || !data) {
      console.error(
        `[territory-signup-flags] flag lookup failed for "${code}" — failing closed (all disabled):`,
        error?.message ?? 'no territory row',
      );
      return DISABLED;
    }

    // `=== true` so NULL/undefined columns also fail closed.
    return {
      agentSignupEnabled: data.agent_signup_enabled === true,
      landlordSignupEnabled: data.landlord_signup_enabled === true,
      fsboSignupEnabled: data.fsbo_signup_enabled === true,
    };
  } catch (err) {
    console.error(
      `[territory-signup-flags] unexpected error for "${code}" — failing closed (all disabled):`,
      err,
    );
    return DISABLED;
  }
}

/**
 * Like getTerritorySignupFlags, but also returns the territory's consumer
 * `domain` so callers can build cross-site links (e.g. the interstitial's
 * "Find an Agent" / "Browse Listings" buttons). Fails closed: all-disabled
 * flags and a null domain on any lookup failure.
 *
 * Used by the register pages (server components). The API write-path guards
 * use getTerritorySignupFlags, which does not need the domain.
 */
export async function getTerritorySignupContext(
  countryCode?: string | null,
): Promise<TerritorySignupContext> {
  const code = (countryCode || DEFAULT_COUNTRY_CODE).toUpperCase();

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('territories')
      .select('agent_signup_enabled, landlord_signup_enabled, fsbo_signup_enabled, domain')
      .eq('country_code', code)
      .single();

    if (error || !data) {
      console.error(
        `[territory-signup-flags] context lookup failed for "${code}" — failing closed (all disabled):`,
        error?.message ?? 'no territory row',
      );
      return { flags: DISABLED, domain: null };
    }

    return {
      flags: {
        agentSignupEnabled: data.agent_signup_enabled === true,
        landlordSignupEnabled: data.landlord_signup_enabled === true,
        fsboSignupEnabled: data.fsbo_signup_enabled === true,
      },
      domain: typeof data.domain === 'string' && data.domain ? data.domain : null,
    };
  } catch (err) {
    console.error(
      `[territory-signup-flags] unexpected error (context) for "${code}" — failing closed (all disabled):`,
      err,
    );
    return { flags: DISABLED, domain: null };
  }
}

/**
 * Read signup flags for ALL territories in a single query, keyed by uppercase
 * country_code. Used by the multi-country register hub (select-country), which
 * must gate each country card on its own territory's flags.
 *
 * Fails closed: returns {} on any lookup failure, and any country_code absent
 * from the map is treated by callers as all-disabled.
 */
export async function getAllTerritorySignupFlags(): Promise<
  Record<string, TerritorySignupFlags>
> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('territories')
      .select('country_code, agent_signup_enabled, landlord_signup_enabled, fsbo_signup_enabled');

    if (error || !data) {
      console.error(
        '[territory-signup-flags] map lookup failed — failing closed (empty map):',
        error?.message ?? 'no rows',
      );
      return {};
    }

    const map: Record<string, TerritorySignupFlags> = {};
    for (const row of data as Array<Record<string, unknown>>) {
      const code = row.country_code;
      if (typeof code !== 'string' || !code) continue;
      map[code.toUpperCase()] = {
        agentSignupEnabled: row.agent_signup_enabled === true,
        landlordSignupEnabled: row.landlord_signup_enabled === true,
        fsboSignupEnabled: row.fsbo_signup_enabled === true,
      };
    }
    return map;
  } catch (err) {
    console.error(
      '[territory-signup-flags] unexpected error (map) — failing closed (empty map):',
      err,
    );
    return {};
  }
}

/**
 * Build an absolute consumer URL for a territory from its `domain` column and
 * a path. Normalizes any protocol/www/trailing slash already present and emits
 * a canonical `https://www.<host><path>`. Never hardcodes a territory.
 *
 * Falls back to the relative `path` when the domain is unknown (should not
 * occur for an active territory, but avoids emitting a broken absolute URL).
 */
export function buildConsumerUrl(domain: string | null, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!domain) return normalizedPath;
  const host = domain
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
  return `https://www.${host}${normalizedPath}`;
}
