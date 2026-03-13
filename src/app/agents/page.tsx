import { createAdminClient } from '@/supabase-admin';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Premier Agents | Guyana HomeHub',
  description: 'Browse verified real estate agents in Guyana. Find experienced professionals with active listings on Guyana HomeHub.',
  openGraph: {
    title: 'Premier Agents | Guyana HomeHub',
    description: 'Browse verified real estate agents in Guyana.',
    type: 'website',
  },
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default async function PremierAgentsPage() {
  const supabase = createAdminClient();

  const { data: agents } = await supabase
    .from('premier_agents' as any)
    .select('*')
    .order('active_listing_count', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Premier Agents</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Guyana&apos;s top-performing real estate professionals with 6+ active listings on the platform.
          </p>
        </div>
      </section>

      {/* Agent Grid */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {!agents || agents.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No premier agents found at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent: any) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.slug}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
              >
                <div className="p-6">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-4 mb-4">
                    {agent.profile_image ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-emerald-500 shrink-0">
                        <Image
                          src={agent.profile_image}
                          alt={agent.full_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center ring-2 ring-emerald-500 shrink-0">
                        <span className="text-xl font-bold text-white">
                          {getInitials(agent.full_name)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="font-bold text-gray-900 text-lg truncate group-hover:text-emerald-600 transition-colors">
                        {agent.full_name}
                      </h2>
                      {agent.company && (
                        <p className="text-sm text-gray-500 truncate">{agent.company}</p>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {agent.is_founding_member && (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-medium">
                        Founding Member
                      </span>
                    )}
                    {agent.is_verified_agent && (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-medium">
                        Verified
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm border-t pt-3">
                    <span className="text-gray-500">
                      <span className="font-semibold text-emerald-600">{agent.active_listing_count}</span> active listings
                    </span>
                    {agent.years_experience && (
                      <span className="text-gray-500">
                        {agent.years_experience}+ yrs experience
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
