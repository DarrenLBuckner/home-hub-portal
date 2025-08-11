export default function AgentSidebar() {
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
            <a href="/dashboard/agent" className="flex items-center px-4 py-3 text-green-700 bg-green-50 rounded-lg font-medium">
              <span className="mr-3">🏠</span>
              Dashboard
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-green-700 rounded-lg transition-colors">
              <span className="mr-3">🏘️</span>
              My Properties
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-green-700 rounded-lg transition-colors">
              <span className="mr-3">📋</span>
              Active Listings
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-green-700 rounded-lg transition-colors">
              <span className="mr-3">👥</span>
              Client Inquiries
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-green-700 rounded-lg transition-colors">
              <span className="mr-3">📊</span>
              Sales Reports
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-green-700 rounded-lg transition-colors">
              <span className="mr-3">⚙️</span>
              Settings
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  )
}