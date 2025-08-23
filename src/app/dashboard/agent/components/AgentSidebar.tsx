import React from 'react';

type SidebarProps = {
  activeSection: string;
  onSectionChange: (section: string) => void;
};

export default function AgentSidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-white shadow-sm h-full border-r border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-700 font-bold">GH</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Agent Dashboard</p>
            <p className="text-xs text-gray-500">Property Management</p>
          </div>
        </div>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          <li>
            <button className={`flex items-center w-full px-4 py-3 rounded-lg font-medium ${activeSection === 'dashboard' ? 'text-green-700 bg-green-50' : 'text-gray-700 hover:bg-gray-50 hover:text-green-700'}`} onClick={() => onSectionChange('dashboard')}>
              <span className="mr-3">🏠</span>
              Dashboard
            </button>
          </li>
          <li>
            <button className={`flex items-center w-full px-4 py-3 rounded-lg font-medium ${activeSection === 'properties' ? 'text-green-700 bg-green-50' : 'text-gray-700 hover:bg-gray-50 hover:text-green-700'}`} onClick={() => onSectionChange('properties')}>
              <span className="mr-3">🏘️</span>
              My Properties
            </button>
          </li>
          <li>
            <button className={`flex items-center w-full px-4 py-3 rounded-lg font-medium ${activeSection === 'listings' ? 'text-green-700 bg-green-50' : 'text-gray-700 hover:bg-gray-50 hover:text-green-700'}`} onClick={() => onSectionChange('listings')}>
              <span className="mr-3">📋</span>
              Active Listings
            </button>
          </li>
          <li>
            <button className={`flex items-center w-full px-4 py-3 rounded-lg font-medium ${activeSection === 'inquiries' ? 'text-green-700 bg-green-50' : 'text-gray-700 hover:bg-gray-50 hover:text-green-700'}`} onClick={() => onSectionChange('inquiries')}>
              <span className="mr-3">👥</span>
              Client Inquiries
            </button>
          </li>
          <li>
            <button className={`flex items-center w-full px-4 py-3 rounded-lg font-medium ${activeSection === 'reports' ? 'text-green-700 bg-green-50' : 'text-gray-700 hover:bg-gray-50 hover:text-green-700'}`} onClick={() => onSectionChange('reports')}>
              <span className="mr-3">📊</span>
              Sales Reports
            </button>
          </li>
          <li>
            <button className={`flex items-center w-full px-4 py-3 rounded-lg font-medium ${activeSection === 'settings' ? 'text-green-700 bg-green-50' : 'text-gray-700 hover:bg-gray-50 hover:text-green-700'}`} onClick={() => onSectionChange('settings')}>
              <span className="mr-3">⚙️</span>
              Settings
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}