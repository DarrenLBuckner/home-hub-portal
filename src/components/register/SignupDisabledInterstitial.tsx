// src/components/register/SignupDisabledInterstitial.tsx
//
// Shown in place of the landlord / FSBO registration form when the territory
// disables that signup type (territories.*_signup_enabled = false). The button
// URLs are built by the caller from the territory's consumer domain — this
// component hardcodes no host.

interface SignupDisabledInterstitialProps {
  /** Absolute URL to the territory's agent directory (e.g. https://www.guyanahomehub.com/agents). */
  findAgentUrl: string;
  /** Absolute URL to the territory's listings (e.g. https://www.guyanahomehub.com/properties/buy). */
  browseListingsUrl: string;
}

export default function SignupDisabledInterstitial({
  findAgentUrl,
  browseListingsUrl,
}: SignupDisabledInterstitialProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Guyana HomeHub works with verified agents.
        </h1>
        <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-8">
          We don&apos;t take direct listings from owners or landlords here. But
          you&apos;ve got property to rent or sell &mdash; and that&apos;s exactly what
          our agents do. A verified agent will list it, market it to the diaspora in
          New York, Toronto, and London, and handle the calls. No Facebook scams. No
          chaos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={findAgentUrl}
            className="w-full sm:flex-1 text-center bg-[#059669] hover:bg-[#047857] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Find an Agent
          </a>
          <a
            href={browseListingsUrl}
            className="w-full sm:flex-1 text-center border-2 border-[#059669] text-[#059669] hover:bg-[#d1fae5] font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Browse Listings
          </a>
        </div>
      </div>
    </div>
  );
}
