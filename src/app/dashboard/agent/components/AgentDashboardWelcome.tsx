import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function AgentDashboardWelcome() {
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
    <section className="bg-white rounded-xl shadow p-6 mb-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-primary mb-2">Welcome, {agentName}!</h1>
        <p className="text-gray-600">Manage your listings and grow your business with Portal Home Hub.</p>
      </div>
      <div className="flex gap-6 flex-wrap">
        <div className="flex-1 min-w-[120px] bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-lg font-semibold text-primary">{stats.active}</div>
          <div className="text-xs text-gray-500">Active Listings</div>
        </div>
        <div className="flex-1 min-w-[120px] bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-lg font-semibold text-secondary">{stats.draft}</div>
          <div className="text-xs text-gray-500">Drafts</div>
        </div>
        <div className="flex-1 min-w-[120px] bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-lg font-semibold text-accent">{stats.sold}</div>
          <div className="text-xs text-gray-500">Sold</div>
        </div>
      </div>
      <div className="flex gap-4 flex-wrap">
        <Link href="/dashboard/agent/create-property" className="bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-primary-dark transition">Create Property</Link>
        <Link href="/dashboard/agent/properties" className="bg-secondary text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-secondary-dark transition">Manage Listings</Link>
        <Link href="/dashboard/agent/inquiries" className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold shadow hover:bg-gray-300 transition">View Inquiries</Link>
        <Link href="/dashboard/agent/settings" className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold shadow hover:bg-gray-300 transition">Profile & Settings</Link>
      </div>
    </section>
  );
}
