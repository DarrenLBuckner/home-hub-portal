"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminData, getAdminDisplayName } from '@/hooks/useAdminData';
import DashboardHeader from '@/components/admin/DashboardHeader';

interface AgentData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  country_id: string | null;
  subscription_status: string | null;
  subscription_tier: string | null;
  is_verified_agent: boolean;
  is_premium_agent: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  active_listings: number;
  draft_listings: number;
  total_listings: number;
  days_since_signup: number;
}

interface EngagementStats {
  totalAgents: number;
  zeroListings: number;
  inactive15Days: number;
  inactive30Days: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

type TabType = 'inactive' | 'activity' | 'payment';
type InactiveFilter = 'all' | '7' | '15' | '30';

// Built-in engagement email templates
const ENGAGEMENT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome-first-listing',
    name: 'Welcome - Post Your First Listing',
    subject: 'Welcome to {{site_name}}! Ready to post your first listing?',
    body: `Hi {{first_name}},

Welcome to {{site_name}}! We're so glad you joined us.

We noticed you haven't posted your first property listing yet. Getting started is quick and easy - it only takes a few minutes to create your first listing and start reaching potential buyers and renters.

Here's how to get started:
1. Log in to your dashboard: {{login_url}}
2. Click "Add New Property"
3. Fill in the property details and upload photos
4. Submit for review - we'll have it live within 24 hours!

If you need any help, check out our training video or reach out to our support team.

Best regards,
The {{site_name}} Team`,
  },
  {
    id: 'inactive-15-days',
    name: '15 Day Check-in',
    subject: 'Quick check-in - Your {{site_name}} Account',
    body: `Hi {{first_name}},

It's been {{days_inactive}} days since you joined {{site_name}}, and we wanted to check in!

We noticed your account doesn't have any active listings yet. Your fellow agents are already getting leads and connecting with buyers - we'd love to see you get started too.

Getting your first listing up is simple:
- Log in at {{login_url}}
- Click "Add New Property" from your dashboard
- Add your property details and photos
- Submit for review

Properties typically go live within 24 hours of submission. The sooner you list, the sooner you start getting leads!

Need help? Reply to this email or contact our support team.

Best regards,
The {{site_name}} Team`,
  },
  {
    id: 'inactive-30-days',
    name: '30 Day Final Notice',
    subject: 'Your {{site_name}} account - action needed',
    body: `Hi {{first_name}},

It's been {{days_inactive}} days since you signed up for {{site_name}}, and your account still has no active listings.

We want to make sure you're getting the most out of your membership. If you're having trouble getting started, we're here to help!

Here's what you can do:
- Log in now: {{login_url}}
- Watch our quick tutorial on posting your first property
- Contact our support team for one-on-one help

Your account is still active, but we'd love to see you start listing properties and growing your business on {{site_name}}.

Best regards,
The {{site_name}} Team`,
  },
  {
    id: 'training-video',
    name: 'Training Video (Re-send)',
    subject: 'Quick Tutorial: Post Your First Property in Minutes',
    body: `Hi {{first_name}},

We wanted to share our quick tutorial video that shows you exactly how to post your first property on {{site_name}} in just a few minutes.

The process is straightforward:
1. Log in to your dashboard: {{login_url}}
2. Click "Add New Property"
3. Fill in the details - title, description, price, location
4. Upload high-quality photos (at least 3-5 recommended)
5. Submit for review

That's it! Our team will review your listing and have it live within 24 hours.

Pro tips for a great listing:
- Use clear, well-lit photos
- Write a detailed description highlighting key features
- Set a competitive price for your area
- Include accurate location information

Ready to get started? Log in now: {{login_url}}

Best regards,
The {{site_name}} Team`,
  },
];

export default function AgentEngagementPage() {
  const router = useRouter();
  const { adminData, permissions, isAdmin, isLoading: adminLoading } = useAdminData();

  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [stats, setStats] = useState<EngagementStats>({ totalAgents: 0, zeroListings: 0, inactive15Days: 0, inactive30Days: 0 });
  const [activeTab, setActiveTab] = useState<TabType>('activity');
  const [inactiveFilter, setInactiveFilter] = useState<InactiveFilter>('all');
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(ENGAGEMENT_TEMPLATES[0]);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAgentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/agent-engagement', {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to load agent data: ${response.status}`);
      }

      const data = await response.json();
      setAgents(data.agents || []);
      setStats(data.stats || { totalAgents: 0, zeroListings: 0, inactive15Days: 0, inactive30Days: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      router.push('/admin-login');
      return;
    }
    loadAgentData();
  }, [adminLoading, isAdmin, loadAgentData, router]);

  // Filter inactive agents based on filter selection
  const inactiveAgents = agents.filter(a => {
    if (a.total_listings > 0) return false;
    switch (inactiveFilter) {
      case '7': return a.days_since_signup >= 7;
      case '15': return a.days_since_signup >= 15;
      case '30': return a.days_since_signup >= 30;
      default: return true;
    }
  }).sort((a, b) => b.days_since_signup - a.days_since_signup);

  // All agents sorted by listing count ascending
  const activityAgents = [...agents].sort((a, b) => a.total_listings - b.total_listings);

  // Agents with payment data
  const paymentAgents = [...agents].sort((a, b) => {
    const statusOrder = (s: string | null) => s === 'active' ? 0 : s === 'trialing' ? 1 : 2;
    return statusOrder(a.subscription_status) - statusOrder(b.subscription_status);
  });

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgents(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  };

  const selectAllVisible = () => {
    const visibleIds = inactiveAgents.map(a => a.id);
    setSelectedAgents(new Set(visibleIds));
  };

  const clearSelection = () => setSelectedAgents(new Set());

  const openReminderModal = (singleAgentId?: string) => {
    if (singleAgentId) {
      setSelectedAgents(new Set([singleAgentId]));
    }
    setSendResult(null);
    setShowReminderModal(true);
  };

  const handleSendReminder = async () => {
    if (selectedAgents.size === 0) return;
    setSending(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/admin/agent-engagement/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          agentIds: Array.from(selectedAgents),
          templateId: selectedTemplate.id,
          templateSubject: selectedTemplate.subject,
          templateBody: selectedTemplate.body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSendResult({ success: false, message: data.error || 'Failed to send' });
      } else {
        setSendResult({ success: true, message: data.message });
        // Clear selection after successful send
        setTimeout(() => {
          setShowReminderModal(false);
          setSelectedAgents(new Set());
          setSendResult(null);
        }, 3000);
      }
    } catch (err) {
      setSendResult({ success: false, message: 'Network error - please try again' });
    } finally {
      setSending(false);
    }
  };

  // Preview template with sample data
  const getPreviewBody = () => {
    const sampleAgent = selectedAgents.size > 0
      ? agents.find(a => selectedAgents.has(a.id))
      : agents[0];

    if (!sampleAgent) return selectedTemplate.body;

    return selectedTemplate.body
      .replace(/\{\{first_name\}\}/g, sampleAgent.first_name || 'Agent')
      .replace(/\{\{last_name\}\}/g, sampleAgent.last_name || '')
      .replace(/\{\{full_name\}\}/g, `${sampleAgent.first_name || ''} ${sampleAgent.last_name || ''}`.trim())
      .replace(/\{\{agent_name\}\}/g, `${sampleAgent.first_name || ''} ${sampleAgent.last_name || ''}`.trim())
      .replace(/\{\{email\}\}/g, sampleAgent.email)
      .replace(/\{\{days_inactive\}\}/g, String(sampleAgent.days_since_signup))
      .replace(/\{\{listing_count\}\}/g, String(sampleAgent.total_listings))
      .replace(/\{\{site_name\}\}/g, sampleAgent.country_id === 'JM' ? 'Jamaica HomeHub' : 'Guyana HomeHub')
      .replace(/\{\{login_url\}\}/g, sampleAgent.country_id === 'JM' ? 'https://jm.portalhomehub.com/login' : 'https://gy.portalhomehub.com/login');
  };

  const handleLogout = async () => {
    const { supabase } = await import('@/supabase');
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading agent engagement data...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader
        title="Agent Engagement"
        description="Track agent activity and send engagement reminders"
        icon="📨"
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={loadAgentData}
              className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        }
        adminInfo={`${getAdminDisplayName(adminData)} • ${permissions?.displayRole || 'Admin'}`}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Total Agents</div>
            <div className="text-3xl font-black text-gray-900">{stats.totalAgents}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
            <div className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">0 Listings</div>
            <div className="text-3xl font-black text-red-600">{stats.zeroListings}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
            <div className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-1">Inactive 15+ Days</div>
            <div className="text-3xl font-black text-orange-600">{stats.inactive15Days}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-red-300 shadow-sm">
            <div className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">Inactive 30+ Days</div>
            <div className="text-3xl font-black text-red-700">{stats.inactive30Days}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 rounded-t-xl mb-0">
          <div className="flex">
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'activity'
                  ? 'border-cyan-600 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Agent Activity ({stats.totalAgents})
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'inactive'
                  ? 'border-cyan-600 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Inactive Agents ({stats.zeroListings})
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'payment'
                  ? 'border-cyan-600 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payment Status
              {adminData?.admin_level === 'basic' && (
                <span className="ml-1 text-xs text-gray-400">🔒</span>
              )}
            </button>
          </div>
        </div>

        {/* Section Explanation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div
            onClick={() => setActiveTab('activity')}
            className={`rounded-xl p-4 border cursor-pointer transition-all ${
              activeTab === 'activity'
                ? 'bg-cyan-50 border-cyan-300 ring-2 ring-cyan-200'
                : 'bg-white border-gray-200 hover:border-cyan-200'
            }`}
          >
            <div className="text-lg mb-1">📨 Agent Activity</div>
            <p className="text-xs text-gray-600 leading-relaxed">
              View all agents and their listing activity. Use the <strong>"Send Message"</strong> button next to any agent to send them a direct email
              (e.g., reminders, instructions, or follow-ups sent to you via WhatsApp).
            </p>
          </div>
          <div
            onClick={() => setActiveTab('inactive')}
            className={`rounded-xl p-4 border cursor-pointer transition-all ${
              activeTab === 'inactive'
                ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200'
                : 'bg-white border-gray-200 hover:border-orange-200'
            }`}
          >
            <div className="text-lg mb-1">🚨 Inactive Agents</div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Agents who signed up but have <strong>zero property listings</strong>. Select one or more agents and send bulk reminder emails to encourage them to post their first listing.
            </p>
          </div>
          <div
            onClick={() => setActiveTab('payment')}
            className={`rounded-xl p-4 border cursor-pointer transition-all ${
              activeTab === 'payment'
                ? 'bg-green-50 border-green-300 ring-2 ring-green-200'
                : 'bg-white border-gray-200 hover:border-green-200'
            }`}
          >
            <div className="text-lg mb-1">💳 Payment Status</div>
            <p className="text-xs text-gray-600 leading-relaxed">
              View agent subscription plans and payment status. See who is active, trialing, or has overdue payments.
              {adminData?.admin_level === 'basic' && <span className="text-gray-400"> (View only for Basic Admin)</span>}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-sm">
          {/* Tab 1: Agent Activity Overview */}
          {activeTab === 'activity' && (
            <div className="p-4">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>How to use:</strong> Find the agent you need to contact, then click <strong>"Send Message"</strong> to email them directly.
                  You can use pre-built templates or customize the message. Perfect for forwarding instructions received via WhatsApp.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drafts</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activityAgents.map(agent => (
                      <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center mr-3">
                              <span className="text-xs font-medium text-cyan-700">
                                {agent.first_name?.charAt(0) || 'A'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {agent.first_name} {agent.last_name}
                                {agent.is_verified_agent && <span className="ml-1 text-green-500">✓</span>}
                                {agent.is_premium_agent && <span className="ml-1 text-yellow-500">⭐</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{agent.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${agent.active_listings > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {agent.active_listings}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{agent.draft_listings}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            agent.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                            agent.subscription_status === 'trialing' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {agent.subscription_status || 'none'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin-dashboard/agents/${agent.id}`}>
                              <button className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                                View Profile
                              </button>
                            </Link>
                            <button
                              onClick={() => openReminderModal(agent.id)}
                              className="px-2 py-1 text-xs font-medium bg-cyan-50 text-cyan-700 rounded hover:bg-cyan-100"
                            >
                              Send Message
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Inactive Agents */}
          {activeTab === 'inactive' && (
            <div className="p-4">
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-800 text-sm">
                  <strong>How to use:</strong> These are agents who signed up but never posted a listing. Use the filter buttons to narrow by days since signup.
                  Select agents with the checkboxes, then click <strong>"Send Reminder"</strong> to email them a templated follow-up encouraging them to list their first property.
                </p>
              </div>
              {/* Filters and Actions */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex gap-2">
                  {(['all', '7', '15', '30'] as InactiveFilter[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setInactiveFilter(f)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        inactiveFilter === f
                          ? 'bg-cyan-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {f === 'all' ? 'All' : `${f}+ days`}
                    </button>
                  ))}
                </div>
                <div className="flex-1" />
                <button
                  onClick={selectAllVisible}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  Select All ({inactiveAgents.length})
                </button>
                {selectedAgents.size > 0 && (
                  <>
                    <button
                      onClick={clearSelection}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    >
                      Clear ({selectedAgents.size})
                    </button>
                    <button
                      onClick={() => openReminderModal()}
                      className="px-4 py-1.5 text-xs font-bold bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                    >
                      📨 Send Reminder ({selectedAgents.size})
                    </button>
                  </>
                )}
              </div>

              {/* Table */}
              {inactiveAgents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">🎉</div>
                  <p className="font-medium">No inactive agents found for this filter</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">
                          <input
                            type="checkbox"
                            checked={selectedAgents.size === inactiveAgents.length && inactiveAgents.length > 0}
                            onChange={(e) => e.target.checked ? selectAllVisible() : clearSelection()}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signed Up</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listings</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {inactiveAgents.map(agent => (
                        <tr key={agent.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedAgents.has(agent.id)}
                              onChange={() => toggleAgentSelection(agent.id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {agent.first_name} {agent.last_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{agent.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{agent.phone || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(agent.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${
                              agent.days_since_signup >= 30 ? 'bg-red-100 text-red-700' :
                              agent.days_since_signup >= 15 ? 'bg-orange-100 text-orange-700' :
                              agent.days_since_signup >= 7 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {agent.days_since_signup}d
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-red-600 font-medium">0</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openReminderModal(agent.id)}
                              className="px-3 py-1 text-xs font-medium bg-cyan-50 text-cyan-700 rounded hover:bg-cyan-100"
                            >
                              Send Reminder
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Payment Status */}
          {activeTab === 'payment' && (
            <div className="p-4">
              {adminData?.admin_level === 'basic' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">🔒 Payment management actions are disabled for Basic Administrators. Contact an Owner or Super Admin for payment-related actions.</p>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listings</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paymentAgents.map(agent => (
                      <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {agent.first_name} {agent.last_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{agent.email}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700 capitalize">
                            {agent.subscription_tier || 'None'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            agent.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                            agent.subscription_status === 'trialing' ? 'bg-blue-100 text-blue-700' :
                            agent.subscription_status === 'past_due' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {agent.subscription_status || 'none'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{agent.total_listings}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openReminderModal(agent.id)}
                            disabled={adminData?.admin_level === 'basic'}
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              adminData?.admin_level === 'basic'
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                            }`}
                          >
                            Send Payment Reminder
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">📨 Send Reminder Email</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Sending to {selectedAgents.size} agent{selectedAgents.size !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Template</label>
                <select
                  value={selectedTemplate.id}
                  onChange={(e) => {
                    const tmpl = ENGAGEMENT_TEMPLATES.find(t => t.id === e.target.value);
                    if (tmpl) setSelectedTemplate(tmpl);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {ENGAGEMENT_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Email Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <p className="text-xs text-gray-500">Subject:</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedTemplate.subject
                        .replace(/\{\{site_name\}\}/g, 'Guyana HomeHub')
                        .replace(/\{\{first_name\}\}/g, agents.find(a => selectedAgents.has(a.id))?.first_name || 'Agent')}
                    </p>
                  </div>
                  <div className="p-4 bg-white max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {getPreviewBody()}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Placeholder Reference */}
              <div className="text-xs text-gray-500">
                <p className="font-medium mb-1">Available placeholders:</p>
                <div className="flex flex-wrap gap-1">
                  {['{{first_name}}', '{{last_name}}', '{{agent_name}}', '{{email}}', '{{site_name}}', '{{login_url}}', '{{days_inactive}}', '{{listing_count}}'].map(p => (
                    <span key={p} className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">{p}</span>
                  ))}
                </div>
              </div>

              {/* Send Result */}
              {sendResult && (
                <div className={`p-3 rounded-lg text-sm ${sendResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {sendResult.success ? '✅' : '❌'} {sendResult.message}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setShowReminderModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReminder}
                disabled={sending || selectedAgents.size === 0}
                className="px-6 py-2 text-sm font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : `Send to ${selectedAgents.size} agent${selectedAgents.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
