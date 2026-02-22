"use client";

import MyPropertiesTab from './components/MyPropertiesTab';
import AgentDashboardWelcome from './components/AgentDashboardWelcome';
import PropertyEngagementMetrics from './components/PropertyEngagementMetrics';
import MyDraftsSection from './components/MyDraftsSection';
import TrainingVideosCard from '@/components/TrainingVideosCard';
import TrainingResourcesCard from '@/components/TrainingResourcesCard';
import AccountStatusBanner from '@/components/AccountStatusBanner';



import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/supabase';

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
        // Check if user is admin (admin_users table)
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', data.user.id)
          .single();
        
        if (adminUser) {
          setUserType('admin');
          
          // SECURITY: Only owner/super admins can create properties
          // Basic admins should only review/approve, not create
          const { data: adminProfile } = await supabase
            .from('profiles')
            .select('admin_level, phone, country_id')
            .eq('id', data.user.id)
            .single();

          if (adminProfile?.country_id) {
            setCountryCode(adminProfile.country_id);
          }
            
          const canCreateProperties = adminProfile?.admin_level === 'owner' || 
                                    adminProfile?.admin_level === 'super';
          
          setIsAgent(canCreateProperties); // Only owner/super admins get agent access
          
          // Set WhatsApp number from profile
          if (adminProfile?.phone) {
            setAgentWhatsapp(adminProfile.phone);
          }
        } else {
          // Check profiles table for regular users
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type, phone, country_id')
            .eq('id', data.user.id)
            .single();

          if (profile) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="text-2xl">🏘️</div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">Agent Dashboard</h1>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900">Agent</h1>
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
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
              { id: 'properties', label: 'Properties', icon: '🏘️' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="text-base">{section.icon}</span>
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
            <MyDraftsSection />
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <AgentDashboardWelcome onNavigateTab={setActiveSection} />
            </div>
            {userId && (
              <PropertyEngagementMetrics userId={userId} />
            )}
            <TrainingVideosCard userType="agent" countryCode={countryCode} />
            <TrainingResourcesCard userType="agent" countryCode={countryCode} />
          </div>
        )}
        
        {activeSection === 'properties' && (
          isAgent && userId ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
                  <span>🏘️</span>
                  <span>My Properties</span>
                </h2>
                <p className="text-blue-100 text-sm sm:text-base mt-1">
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
                <div className="text-4xl sm:text-6xl mb-4">🏘️</div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Agent Feature</h2>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">
                  Property management is available for licensed real estate agents only.
                </p>
                <div className="bg-gray-50 p-4 sm:p-6 rounded-xl border">
                  <h3 className="font-semibold mb-3 text-base sm:text-lg">Upgrade Benefits:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm sm:text-base text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span>✅</span>
                      <span>Unlimited property listings</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>✅</span>
                      <span>Client inquiry management</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>✅</span>
                      <span>Sales reports and analytics</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>✅</span>
                      <span>Professional agent tools</span>
                    </div>
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
