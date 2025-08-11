// src/app/(dashboard)/agent/page.tsx
import AgentHeader from './components/AgentHeader'
import AgentSidebar from './components/Agentidebar'
import ListingOverview from './components/ListingOverview'

export default async function AgentDashboard() {
  // For now, we'll create a basic dashboard without authentication
  // You can add authentication later when you implement the auth system
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AgentHeader />
      
      <div className="flex">
        <AgentSidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to Your Agent Dashboard
              </h1>
              <p className="text-gray-600">
                Manage your properties and clients across Guyana&apos;s real estate market
              </p>
            </div>
            
            <div className="space-y-6">
              <ListingOverview />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      <span className="text-gray-600">New inquiry for Georgetown property</span>
                      <span className="ml-auto text-gray-400">2 hours ago</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      <span className="text-gray-600">Property listing updated</span>
                      <span className="ml-auto text-gray-400">5 hours ago</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                      <span className="text-gray-600">Client meeting scheduled</span>
                      <span className="ml-auto text-gray-400">1 day ago</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
                      <div className="text-green-700 font-medium">Add Property</div>
                      <div className="text-green-600 text-sm">Create new listing</div>
                    </button>
                    <button className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">
                      <div className="text-blue-700 font-medium">View Inquiries</div>
                      <div className="text-blue-600 text-sm">Manage client requests</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}