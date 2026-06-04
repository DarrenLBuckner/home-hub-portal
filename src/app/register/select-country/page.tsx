import { getAllTerritorySignupFlags } from '@/lib/territory-signup-flags';
import SelectCountryClient from './SelectCountryClient';

// Server wrapper: fetches every territory's signup flags once, so the country
// hub can gate each card on its own territory's flags. Fail-closed — a country
// missing from the map renders with its owner-type (landlord/FSBO) buttons
// hidden. Agent buttons are never gated here.
export default async function SelectCountryPage() {
  const signupFlagsByCountry = await getAllTerritorySignupFlags();
  return <SelectCountryClient signupFlagsByCountry={signupFlagsByCountry} />;
}
