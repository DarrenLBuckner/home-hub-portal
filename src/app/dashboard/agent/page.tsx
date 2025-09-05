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
import { createClient } from '@/lib/supabase/client';

export default function AgentPage() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id || null);
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AgentHeader whatsapp={agentWhatsapp} />
      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r hidden md:block">
          <AgentSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        </aside>
        <main className="flex-1 p-6">
          {activeSection === 'dashboard' && (
            <>
              <AgentDashboardWelcome />
              <ListingOverview />
            </>
          )}
          {activeSection === 'properties' && userId && (
            <MyPropertiesTab userId={userId} />
          )}
          {activeSection === 'listings' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Active Listings</h2>
              <p>Show active property listings here.</p>
            </div>
          )}
          {activeSection === 'inquiries' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Client Inquiries</h2>
              <p>Show client inquiries here.</p>
            </div>
          )}
          {activeSection === 'reports' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Sales Reports</h2>
              <p>Show sales reports here.</p>
            </div>
          )}
          {activeSection === 'settings' && <AgentProfileSettings initialWhatsapp={agentWhatsapp} />}
        </main>
      </div>
    </div>
  );
}
