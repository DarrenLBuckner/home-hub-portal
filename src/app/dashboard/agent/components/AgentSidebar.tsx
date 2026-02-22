import React, { useState, useEffect } from 'react';

type SidebarProps = {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userType?: string | null;
  isAgent?: boolean;
  draftCount?: number;
};

export default function AgentSidebar({ activeSection, onSectionChange, userType, isAgent, draftCount: draftCountProp }: SidebarProps) {
  const [draftCount, setDraftCount] = useState(draftCountProp ?? 0);

  // Fetch draft count if not provided as prop
  useEffect(() => {
    if (draftCountProp !== undefined) {
      setDraftCount(draftCountProp);
      return;
    }
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/properties/drafts');
        const data = await res.json();
        if (data.success) setDraftCount(data.drafts?.length || 0);
      } catch {}
    };
    fetchCount();
  }, [draftCountProp]);
  const handleSectionChange = (section: string) => {
    // Allow access to dashboard for all users
    if (section === 'dashboard') {
      onSectionChange(section);
      return;
    }
    
    // Settings redirects to dedicated settings page
    if (section === 'settings') {
      window.location.href = '/dashboard/agent/settings';
      return;
    }
    
    // For professional features, show notification if not agent
    if (!isAgent) {
      alert('This feature is available for professional users only. Contact support to upgrade your account.');
      return;
    }
    
    onSectionChange(section);
  };

  // Dynamic dashboard title based on user type
  const getDashboardTitle = () => {
    if (userType === 'admin') return 'Admin Portal';
    if (userType === 'agent') return 'Agent Dashboard';
    if (userType === 'fsbo') return 'FSBO Portal';
    if (userType === 'landlord') return 'Landlord Portal';
    return 'Property Portal'; // Universal fallback
  };

  const getDashboardSubtitle = () => {
    if (userType === 'admin') return 'System Management';
    if (userType === 'agent') return 'Professional Tools';
    if (userType === 'fsbo') return 'Sell Your Property';
    if (userType === 'landlord') return 'Rental Management';
    return 'Property Management'; // Universal fallback
  };
  return (
    <aside className="w-64 bg-white shadow-sm h-full border-r border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-700 font-bold">GH</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{getDashboardTitle()}</p>
            <p className="text-xs text-gray-500">{getDashboardSubtitle()}</p>
          </div>
        </div>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          <li>
            <button className={`flex items-center justify-between w-full px-4 py-3 rounded-lg font-medium ${activeSection === 'dashboard' ? 'text-green-700 bg-green-50' : 'text-gray-700 hover:bg-gray-50 hover:text-green-700'}`} onClick={() => handleSectionChange('dashboard')}>
              <div className="flex items-center">
                <span className="mr-3">🏠</span>
                Dashboard
              </div>
            </button>
          </li>
          <li>
            <button className={`flex items-center justify-between w-full px-4 py-3 rounded-lg font-medium ${
              !isAgent 
                ? 'text-gray-400 bg-gray-50 cursor-not-allowed' 
                : activeSection === 'properties' 
                  ? 'text-green-700 bg-green-50' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-green-700'
            }`} onClick={() => handleSectionChange('properties')}>
              <div className="flex items-center">
                <span className="mr-3">🏘️</span>
                My Properties
              </div>
              {!isAgent && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Agent Only</span>}
            </button>
          </li>
          <li>
            <button className={`flex items-center justify-between w-full px-4 py-3 rounded-lg font-medium ${
              !isAgent 
                ? 'text-gray-400 bg-gray-50 cursor-not-allowed' 
                : activeSection === 'listings' 
                  ? 'text-green-700 bg-green-50' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-green-700'
            }`} onClick={() => handleSectionChange('listings')}>
              <div className="flex items-center">
                <span className="mr-3">📋</span>
                Active Listings
              </div>
              {!isAgent && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Agent Only</span>}
            </button>
          </li>
          <li>
            <button
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 hover:text-green-700"
              onClick={() => window.location.href = '/dashboard/drafts'}
            >
              <div className="flex items-center">
                <span className="mr-3">💾</span>
                My Drafts
              </div>
              {draftCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-semibold">
                  {draftCount}
                </span>
              )}
            </button>
          </li>
          <li>
            <button className={`flex items-center justify-between w-full px-4 py-3 rounded-lg font-medium ${
              !isAgent 
                ? 'text-gray-400 bg-gray-50 cursor-not-allowed' 
                : activeSection === 'inquiries' 
                  ? 'text-green-700 bg-green-50' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-green-700'
            }`} onClick={() => handleSectionChange('inquiries')}>
              <div className="flex items-center">
                <span className="mr-3">👥</span>
                Client Inquiries
              </div>
              {!isAgent && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Agent Only</span>}
            </button>
          </li>
          <li>
            <button className={`flex items-center justify-between w-full px-4 py-3 rounded-lg font-medium ${
              !isAgent 
                ? 'text-gray-400 bg-gray-50 cursor-not-allowed' 
                : activeSection === 'reports' 
                  ? 'text-green-700 bg-green-50' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-green-700'
            }`} onClick={() => handleSectionChange('reports')}>
              <div className="flex items-center">
                <span className="mr-3">📊</span>
                Sales Reports
              </div>
              {!isAgent && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Agent Only</span>}
            </button>
          </li>
          <li>
            <button className={`flex items-center justify-between w-full px-4 py-3 rounded-lg font-medium ${activeSection === 'settings' ? 'text-green-700 bg-green-50' : 'text-gray-700 hover:bg-gray-50 hover:text-green-700'}`} onClick={() => handleSectionChange('settings')}>
              <div className="flex items-center">
                <span className="mr-3">⚙️</span>
                Settings
              </div>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}