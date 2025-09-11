"use client";
// src/app/(dashboard)/agent/page.tsx
import AgentHeader from './components/AgentHeader';
import AgentSidebar from './components/AgentSidebar';
import ListingOverview from './components/ListingOverview';
import UploadArea from './components/UploadArea';
import MyPropertiesTab from './components/MyPropertiesTab';
// ...existing code...
import AgentProfileSettings from './components/AgentProfileSettings';
import AgentDashboardWelcome from './components/AgentDashboardWelcome';

// Temporary: Hardcoded WhatsApp number for demo. Replace with agent profile integration.


const agentWhatsapp = "5926001234";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/supabase';

export default function AgentPage() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [isAgent, setIsAgent] = useState(false);
  
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
          setIsAgent(true); // Admins have agent access
        } else {
          // Check profiles table for regular users
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', data.user.id)
            .single();
          
          if (profile) {
            setUserType(profile.user_type);
            setIsAgent(profile.user_type === 'agent');
          }
        }
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AgentHeader whatsapp={agentWhatsapp} />
      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r hidden md:block">
          <AgentSidebar 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
            userType={userType}
            isAgent={isAgent}
          />
        </aside>
        <main className="flex-1 p-6">
          {activeSection === 'dashboard' && (
            <>
              <AgentDashboardWelcome />
              <ListingOverview />
            </>
          )}
          {activeSection === 'properties' && (
            isAgent && userId ? (
              <MyPropertiesTab userId={userId} />
            ) : (
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
                  <div className="text-4xl mb-4">🏘️</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Agent Feature</h2>
                  <p className="text-gray-600 mb-6">
                    Property management is available for licensed real estate agents only.
                  </p>
                  <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">Upgrade Benefits:</h3>
                    <ul className="text-sm text-gray-600 text-left space-y-1">
                      <li>• Manage unlimited property listings</li>
                      <li>• Client inquiry management</li>
                      <li>• Sales reports and analytics</li>
                      <li>• Professional agent tools</li>
                    </ul>
                  </div>
                </div>
              </div>
            )
          )}
          {activeSection === 'listings' && (
            isAgent ? (
              <div>
                <h2 className="text-2xl font-bold mb-4">Active Listings</h2>
                <p>Show active property listings here.</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
                  <div className="text-4xl mb-4">📋</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Agent Only Feature</h2>
                  <p className="text-gray-600">Active listing management is available for agents only.</p>
                </div>
              </div>
            )
          )}
          {activeSection === 'inquiries' && (
            isAgent ? (
              <div>
                <h2 className="text-2xl font-bold mb-4">Client Inquiries</h2>
                <p>Show client inquiries here.</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
                  <div className="text-4xl mb-4">👥</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Agent Only Feature</h2>
                  <p className="text-gray-600">Client inquiry management is available for agents only.</p>
                </div>
              </div>
            )
          )}
          {activeSection === 'reports' && (
            isAgent ? (
              <div>
                <h2 className="text-2xl font-bold mb-4">Sales Reports</h2>
                <p>Show sales reports here.</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
                  <div className="text-4xl mb-4">📊</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Agent Only Feature</h2>
                  <p className="text-gray-600">Sales reports and analytics are available for agents only.</p>
                </div>
              </div>
            )
          )}
          {activeSection === 'settings' && <AgentProfileSettings initialWhatsapp={agentWhatsapp} />}
        </main>
      </div>
    </div>
  );
}
