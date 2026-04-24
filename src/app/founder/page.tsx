import type { Metadata } from 'next';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Darren L. Buckner — Founder & CEO of Portal HomeHub',
  description:
    'Darren L. Buckner is the founder and CEO of Portal HomeHub — the platform powering real estate infrastructure across the Caribbean, Latin America, and Africa. Built with AI in 7 months.',
};

type Territory = {
  country_code: string;
  country_name: string;
  display_name: string;
  flag_emoji: string | null;
  domain: string | null;
  status: string;
};

async function fetchActiveTerritories(): Promise<Territory[]> {
  const supabaseAdmin = createServiceRoleClient();
  const { data, error } = await supabaseAdmin
    .from('territories')
    .select('country_code, country_name, display_name, flag_emoji, domain, status')
    .eq('status', 'active')
    .order('launched_at', { ascending: true });

  if (error) {
    console.error('[founder/page] territories fetch error:', error.message);
    return [];
  }

  return (data as Territory[]) ?? [];
}

function normalizeDomain(domain: string | null): string | null {
  if (!domain) return null;
  const trimmed = domain.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default async function FounderPage() {
  const territories = await fetchActiveTerritories();

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Darren L. Buckner',
    alternateName: 'Darren Buckner',
    jobTitle: 'Founder & CEO',
    url: 'https://darrenlbuckner.com',
    sameAs: [
      'https://darrenlbuckner.com',
      'https://portalhomehub.com/founder',
      'https://guyanahomehub.com',
      'https://en.wikipedia.org/wiki/Milton_Pydanna',
    ],
    worksFor: {
      '@type': 'Organization',
      name: 'Portal HomeHub',
      url: 'https://portalhomehub.com',
    },
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Portal HomeHub',
    url: 'https://portalhomehub.com',
    founder: {
      '@type': 'Person',
      name: 'Darren L. Buckner',
      url: 'https://darrenlbuckner.com',
    },
    description:
      'Portal HomeHub is the platform powering real estate infrastructure across the Caribbean, Latin America, and Africa.',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <div className="container mx-auto px-4 py-16">
        {/* Section 1 — Hero */}
        <div className="text-center mb-20">
          <div className="text-sm font-semibold tracking-widest text-blue-400 uppercase mb-4">
            Founder &amp; CEO
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Darren L. Buckner
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Founder of Portal HomeHub — the platform powering real estate
            infrastructure across the Caribbean, Latin America, and Africa.
            Built with AI. Built for the markets the world&apos;s tech giants overlooked.
          </p>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
            U.S. Army veteran, self-taught technologist, and founder of Portal
            HomeHub, Guyana HomeHub, and PivotPoint AI — building the Zillow of
            the Global South from St. Louis, Missouri.
          </p>
          <a
            href="https://darrenlbuckner.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg"
          >
            Visit darrenlbuckner.com →
          </a>
        </div>

        {/* Section 2 — The Platform He Built */}
        <div className="bg-slate-800/30 backdrop-blur rounded-lg p-8 md:p-12 mb-16 border border-slate-700 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">
            One Platform. Every Territory.
          </h2>
          <div className="space-y-4 text-slate-300 text-lg leading-relaxed">
            <p>
              Portal HomeHub is not a single country website. It is the
              infrastructure layer behind every HomeHub territory — a single
              platform that powers verified listings, trusted agents, and
              secure transactions across multiple countries from one codebase.
            </p>
            <p>
              Darren L. Buckner built the entire platform using AI tools as
              his sole development team — Claude Code, GitHub Copilot,
              ChatGPT — for $150–$200 per month over 7 months. No co-founder.
              No dev agency. No venture capital.
            </p>
          </div>
        </div>

        {/* Section 3 — Active Territories */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-10 text-center">
            Powered by Portal HomeHub
          </h2>

          {territories.length === 0 ? (
            <p className="text-slate-300 text-center text-lg">
              Territories launching soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {territories.map((t) => {
                const href = normalizeDomain(t.domain);
                const cardInner = (
                  <>
                    <div className="text-2xl font-bold text-white mb-2">
                      <span className="mr-2">{t.flag_emoji}</span>
                      {t.display_name}
                    </div>
                    <div className="text-slate-400">{t.country_name}</div>
                  </>
                );

                return href ? (
                  <a
                    key={t.country_code}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700 hover:border-blue-400 hover:bg-slate-800/70 transition-colors"
                  >
                    {cardInner}
                  </a>
                ) : (
                  <div
                    key={t.country_code}
                    className="block bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700"
                  >
                    {cardInner}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 4 — Origin Story */}
        <div className="bg-slate-800/30 backdrop-blur rounded-lg p-8 md:p-12 mb-16 border border-slate-700 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">
            Why He Built It
          </h2>
          <div className="space-y-4 text-slate-300 text-lg leading-relaxed">
            <p>
              His wife Rochelle is Guyanese. Her late father, Milton Pydana,
              was a West Indies cricketer and a legend of Guyanese cricket.
              That personal connection — family, heritage, trust — is why
              Guyana was the first market. Not market analysis. A family
              conversation that turned into a founding decision.
            </p>
            <p>
              This is not a story about disrupting Silicon Valley. It is a
              story about going where the next billion homeowners live —
              because they deserve better, and somebody had to build it.
            </p>
          </div>
        </div>

        {/* Section 5 — Founder CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 md:p-12 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Learn More About the Founder
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto text-lg">
            Darren L. Buckner&apos;s full story, ventures, speaking engagements,
            and thought leadership live at his personal brand site.
          </p>
          <a
            href="https://darrenlbuckner.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
          >
            darrenlbuckner.com →
          </a>
        </div>
      </div>
    </div>
  );
}
