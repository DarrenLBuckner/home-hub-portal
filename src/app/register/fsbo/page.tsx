import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import {
  getTerritorySignupContext,
  getTerritorySignupFlags,
  buildConsumerUrl,
} from '@/lib/territory-signup-flags';
import SignupDisabledInterstitial from '@/components/register/SignupDisabledInterstitial';
import FsboRegisterClient from './FsboRegisterClient';

// Resolve the territory exactly as the page render does (?country= -> cookie ->
// 'GY') and read the same fail-closed flags, so the robots tag and the rendered
// interstitial can never disagree. Disabled -> noindex, nofollow; enabled -> no
// robots tag at all.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; type?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const country = sp.country || cookieStore.get('country-code')?.value || 'GY';

  const { fsboSignupEnabled } = await getTerritorySignupFlags(country);
  if (!fsboSignupEnabled) {
    return { robots: { index: false, follow: false } };
  }
  return {};
}

// Server wrapper: reads the territory's signup flags at request time. When the
// territory disables FSBO signups, the form is replaced by the agent-only
// interstitial. The write path (api/register/fsbo/complete) re-checks the flag.
export default async function FSBORegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const country = sp.country || cookieStore.get('country-code')?.value || 'GY';

  const { flags, domain } = await getTerritorySignupContext(country);

  if (!flags.fsboSignupEnabled) {
    return (
      <SignupDisabledInterstitial
        findAgentUrl={buildConsumerUrl(domain, '/agents')}
        browseListingsUrl={buildConsumerUrl(domain, '/properties/buy')}
      />
    );
  }

  return <FsboRegisterClient />;
}
