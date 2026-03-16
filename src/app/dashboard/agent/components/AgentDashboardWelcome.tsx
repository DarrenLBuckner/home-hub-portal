import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/supabase';
import Link from 'next/link';
import { trackAgentRegistration } from '@/lib/fbPixel';
import FoundingAgentBadge from '@/components/FoundingAgentBadge';
import FoundingAdvisorBadge from '@/components/FoundingAdvisorBadge';

interface DashboardWelcomeProps {
  userType?: string | null;
  isAgent?: boolean;
  onNavigateTab?: (tab: string) => void;
}

export default function AgentDashboardWelcome({ userType, isAgent, onNavigateTab }: DashboardWelcomeProps) {
  const [agentName, setAgentName] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [subscriptionTier, setSubscriptionTier] = useState<string | undefined>();
  const [isFoundingAdvisor, setIsFoundingAdvisor] = useState(false);
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    draft: 0,
    sold: 0,
    rented: 0,
    under_contract: 0,
    off_market: 0,
    rejected: 0,
    total: 0,
  });
  const trackingChecked = useRef(false);

  useEffect(() => {
    const fetchAgentAndStats = async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();

      if (userData?.user?.id) {
        // Fetch user profile with account code, approval status, and tracking flag
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, account_code, display_name, user_type, approval_status, registration_tracked, country_id, subscription_tier, is_founding_advisor')
          .eq('id', userData.user.id)
          .single();

        if (profile) {
          const fullName = profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          setAgentName(fullName || 'Agent');
          setAccountCode(profile.account_code || '');
          setSubscriptionTier(profile.subscription_tier);
          setIsFoundingAdvisor(profile.is_founding_advisor || false);

          // Track CompleteRegistration for newly approved agents (only once)
          if (
            !trackingChecked.current &&
            profile.user_type === 'agent' &&
            profile.approval_status === 'approved' &&
            !profile.registration_tracked
          ) {
            trackingChecked.current = true;

            // Fire Facebook Pixel event
            trackAgentRegistration({ country: profile.country_id || undefined });

            // Mark as tracked to prevent duplicate events
            await supabase
              .from('profiles')
              .update({ registration_tracked: true })
              .eq('id', userData.user.id);
          }
        }

        // Fetch property stats
        const { data: properties } = await supabase
          .from('properties')
          .select('status')
          .eq('user_id', userData.user.id);
        if (properties) {
          const count = (status: string) => properties.filter((p: any) => p.status === status).length;
          setStats({
            active: count('active'),
            pending: count('pending'),
            draft: count('draft'),
            sold: count('sold'),
            rented: count('rented'),
            under_contract: count('under_contract'),
            off_market: count('off_market'),
            rejected: count('rejected'),
            total: properties.length,
          });
        }
      }
    };
    fetchAgentAndStats();
  }, []);

  return (
    <>
      {/* Professional Header Bar */}
      <div className="bg-white border-b border-gray-200 rounded-xl px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900">{agentName || 'Agent'}</h1>
              <FoundingAgentBadge subscriptionTier={subscriptionTier} />
              <FoundingAdvisorBadge isFoundingAdvisor={isFoundingAdvisor} />
            </div>
            {accountCode && (
              <p className="text-sm text-gray-500">Account ID: {accountCode}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold text-emerald-600">{stats.total}</div>
            <div className="text-xs text-gray-500">Total Properties</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">Active Listings</p>
              <p className="text-2xl md:text-3xl font-semibold text-green-600">{stats.active}</p>
            </div>
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">Pending Review</p>
              <p className="text-2xl md:text-3xl font-semibold text-orange-600">{stats.pending}</p>
            </div>
            <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">Drafts</p>
              <p className="text-2xl md:text-3xl font-semibold text-yellow-600">{stats.draft}</p>
            </div>
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-medium">Sold / Rented</p>
              <p className="text-2xl md:text-3xl font-semibold text-emerald-600">{stats.sold + stats.rented}</p>
            </div>
            <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Professional Tools */}
      <section className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Professional Tools</h2>
          <p className="text-sm text-gray-500">Full access to all property types and agent-specific features</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/agent/create-property">
            <button className="w-full p-5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col items-center space-y-2">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
              </svg>
              <span className="text-lg">Create Property</span>
              <span className="text-xs opacity-75">Sales & Rentals</span>
            </button>
          </Link>

          <Link href="/dashboard/agent/listings">
            <button className="w-full p-5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col items-center space-y-2">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="text-lg">Manage Listings</span>
              <span className="text-xs opacity-75">Full Portfolio</span>
            </button>
          </Link>

          <Link href="/dashboard/agent/bio-builder">
            <button className="w-full p-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col items-center space-y-2">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-lg">Build My Bio</span>
              <span className="text-xs opacity-75">AI-Powered Profile</span>
            </button>
          </Link>

          <Link href="/dashboard/agent/settings">
            <button className="w-full p-5 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col items-center space-y-2">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-lg">Settings</span>
              <span className="text-xs opacity-75">Profile & Preferences</span>
            </button>
          </Link>
        </div>

        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <h3 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Agent Advantages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-emerald-700">
            <div className="flex items-start gap-2">
              <svg className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Full Access:</strong> Both sale and rental properties</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Subscription Model:</strong> Simple monthly pricing, no per-listing fees</span>
            </div>
            <div className="flex items-start gap-2">
              <svg className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Professional Tools:</strong> Advanced analytics and reporting</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
