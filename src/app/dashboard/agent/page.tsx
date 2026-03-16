"use client";

import MyPropertiesTab from './components/MyPropertiesTab';
import AgentDashboardWelcome from './components/AgentDashboardWelcome';
import PortfolioSummary from './components/PortfolioSummary';
import MyDraftsSection from './components/MyDraftsSection';
import TrainingVideosCard from '@/components/TrainingVideosCard';
import TrainingResourcesCard from '@/components/TrainingResourcesCard';
import AccountStatusBanner from '@/components/AccountStatusBanner';
import BioCompletionBanner from '@/components/BioCompletionBanner';

import { Inter } from 'next/font/google';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/supabase';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function AgentPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [isAgent, setIsAgent] = useState(false);
  const [agentWhatsapp, setAgentWhatsapp] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('GY');
  const [agentVettingStatus, setAgentVettingStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id || null);
      
      if (data?.user?.id) {
        // Check if user is admin via profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, admin_level, phone, country_id')
          .eq('id', data.user.id)
          .single();

        if (profile?.user_type === 'admin' && profile.admin_level) {
          setUserType('admin');

          if (profile.country_id) {
            setCountryCode(profile.country_id);
          }

          const canCreateProperties = profile.admin_level === 'owner' ||
                                    profile.admin_level === 'super' ||
                                    profile.admin_level === 'basic';

          setIsAgent(canCreateProperties);

          // Set WhatsApp number from profile
          if (profile.phone) {
            setAgentWhatsapp(profile.phone);
          }
        } else if (profile) {
          // Regular user (agent, landlord, fsbo, etc.)
          setUserType(profile.user_type);
          setIsAgent(profile.user_type === 'agent');

          // Set WhatsApp number from profile
          if (profile.phone) {
            setAgentWhatsapp(profile.phone);
          }

          // Set country code from profile
          if (profile.country_id) {
            setCountryCode(profile.country_id);
          }

          // Fetch agent vetting status for agents
          if (profile.user_type === 'agent') {
            const { data: vetting } = await supabase
              .from('agent_vetting')
              .select('status, rejection_reason, first_name')
              .eq('user_id', data.user.id)
              .single();

            if (vetting) {
              setAgentVettingStatus(vetting.status);
              setRejectionReason(vetting.rejection_reason);
              if (vetting.first_name) {
                setUserName(vetting.first_name);
              }
            }
          }
        }
      }
    };
    fetchUser();
  }, []);

  // Redirect to full settings page when settings tab is selected
  useEffect(() => {
    if (activeSection === 'settings') {
      router.push('/dashboard/agent/settings');
    }
  }, [activeSection, router]);

  return (
    <div className={`min-h-screen bg-gray-50 ${inter.className}`}>
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-gray-900">Agent Dashboard</h1>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-semibold text-gray-900">Agent</h1>
              </div>
            </div>
            {agentWhatsapp && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="hidden sm:inline">WhatsApp:</span>
                <a href={`https://wa.me/${agentWhatsapp}`} className="text-green-600 font-medium hover:text-green-700">
                  +{agentWhatsapp}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-2 py-3">
            {([
              { id: 'dashboard', label: 'Dashboard', icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" /></svg> },
              { id: 'properties', label: 'Properties', icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
              { id: 'settings', label: 'Settings', icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
            ] as { id: string; label: string; icon: React.ReactNode }[]).map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeSection === section.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {section.icon}
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile-First Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Account Status Banner - shows if pending/rejected/needs_correction */}
        <AccountStatusBanner
          status={agentVettingStatus as any}
          rejectionReason={rejectionReason}
          userType="agent"
          userName={userName}
        />

        {activeSection === 'dashboard' && (
          <div className="space-y-6 sm:space-y-8">
            <BioCompletionBanner />
            <MyDraftsSection />
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <AgentDashboardWelcome onNavigateTab={setActiveSection} />
            </div>
            {userId && (
              <PortfolioSummary userId={userId} />
            )}
            <TrainingVideosCard userType="agent" countryCode={countryCode} />
            <TrainingResourcesCard userType="agent" countryCode={countryCode} />
          </div>
        )}
        
        {activeSection === 'properties' && (
          isAgent && userId ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-white flex items-center space-x-2">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <span>My Properties</span>
                </h2>
                <p className="text-emerald-100 text-sm sm:text-base mt-1">
                  Manage your agent property portfolio
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <MyPropertiesTab userId={userId} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
              <div className="max-w-2xl mx-auto text-center">
                <svg className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Agent Feature</h2>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">
                  Property management is available for licensed real estate agents only.
                </p>
                <div className="bg-gray-50 p-4 sm:p-6 rounded-xl border">
                  <h3 className="font-semibold mb-3 text-base sm:text-lg">Upgrade Benefits:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm sm:text-base text-gray-600">
                    {['Unlimited property listings', 'Client inquiry management', 'Sales reports and analytics', 'Professional agent tools'].map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
        
        {/* Settings redirects via useEffect above */}
      </main>
    </div>
  );
}
