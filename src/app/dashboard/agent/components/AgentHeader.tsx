export default function AgentHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-green-700">
            Guyana Home Hub
          </h1>
          <span className="text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full">
            Agent Portal
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Welcome back, Agent
          </div>
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-700 font-semibold text-sm">A</span>
          </div>
        </div>
      </div>
    </header>
  )
}