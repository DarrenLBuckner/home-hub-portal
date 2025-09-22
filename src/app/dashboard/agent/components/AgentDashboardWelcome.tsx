import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

interface DashboardWelcomeProps {
  userType?: string | null;
  isAgent?: boolean;
}

export default function AgentDashboardWelcome({ userType, isAgent }: DashboardWelcomeProps) {
  const [agentName, setAgentName] = useState('');
  const [stats, setStats] = useState({
    active: 0,
    draft: 0,
    sold: 0,
  });

  useEffect(() => {
    const fetchAgentAndStats = async () => {
      const supabase = createClientComponentClient();
      const { data: userData } = await supabase.auth.getUser();
      setAgentName(userData?.user?.user_metadata?.name || 'Agent');
      if (userData?.user?.id) {
        const { data: properties } = await supabase
          .from('properties')
          .select('status')
          .eq('agent_id', userData.user.id);
        if (properties) {
          setStats({
            active: properties.filter((p: any) => p.status === 'active').length,
            draft: properties.filter((p: any) => p.status === 'draft').length,
            sold: properties.filter((p: any) => p.status === 'sold').length,
          });
        }
      }
    };
    fetchAgentAndStats();
  }, []);

  return (
    <>
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-xl p-8 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">🏢 Welcome to Portal Home Hub!</h1>
            <p className="text-blue-100 text-lg">Your Property Management Dashboard – Manage, Buy, Sell, or Rent with Ease</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.active + stats.draft}</div>
            <div className="text-blue-100 text-sm">Total Properties</div>
          </div>
        </div>
      </div>

      {/* Enterprise Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Listings</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="text-4xl">🟢</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Draft Properties</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.draft}</p>
            </div>
            <div className="text-4xl">📝</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Sold Properties</p>
              <p className="text-3xl font-bold text-blue-600">{stats.sold}</p>
            </div>
            <div className="text-4xl">🎉</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Subscription Active</p>
              <p className="text-3xl font-bold text-indigo-600">✓</p>
            </div>
            <div className="text-4xl">⭐</div>
          </div>
        </div>
      </div>

      {/* Professional Action Center */}
      <section className="bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Professional Tools</h2>
          <p className="text-gray-600">Full access to all property types and agent-specific features</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/agent/create-property">
            <button className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex flex-col items-center space-y-2">
              <span className="text-2xl">🏠</span>
              <span>Create Property</span>
              <span className="text-xs opacity-75">Sales & Rentals</span>
            </button>
          </Link>
          
          <Link href="/dashboard/agent/properties">
            <button className="w-full p-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex flex-col items-center space-y-2">
              <span className="text-2xl">📊</span>
              <span>Manage Listings</span>
              <span className="text-xs opacity-75">Full Portfolio</span>
            </button>
          </Link>

          <Link href="/dashboard/agent/inquiries">
            <button className="w-full p-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex flex-col items-center space-y-2">
              <span className="text-2xl">💬</span>
              <span>Inquiries</span>
              <span className="text-xs opacity-75">Client Communication</span>
            </button>
          </Link>

          <Link href="/dashboard/agent/settings">
            <button className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex flex-col items-center space-y-2">
              <span className="text-2xl">⚙️</span>
              <span>Settings</span>
              <span className="text-xs opacity-75">Profile & Preferences</span>
            </button>
          </Link>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="font-bold text-blue-800 mb-2">🎖️ Agent Advantages:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
            <div>✅ <strong>Full Access:</strong> Both sale and rental properties</div>
            <div>⭐ <strong>Subscription Model:</strong> Simple monthly pricing, no per-listing fees</div>
            <div>📈 <strong>Professional Tools:</strong> Advanced analytics and reporting</div>
          </div>
        </div>
      </section>
    </>
  );
}
