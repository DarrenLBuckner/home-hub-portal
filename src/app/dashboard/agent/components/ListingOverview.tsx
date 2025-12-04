// import UploadArea from './UploadArea';

export default function ListingOverview() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Property Overview</h2>
        <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
          Guyana Market
        </span>
      </div>

  {/* Drag-and-drop image upload removed from dashboard */}
      
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <div className="text-3xl font-bold text-blue-700 mb-2">0</div>
          <div className="text-sm font-medium text-blue-600">Active Listings</div>
          <div className="text-xs text-blue-500 mt-1">Ready to start listing</div>
        </div>
        
        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <div className="text-3xl font-bold text-green-700 mb-2">0</div>
          <div className="text-sm font-medium text-green-600">Sold This Month</div>
          <div className="text-xs text-green-500 mt-1">Start building your track record</div>
        </div>
        
        <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
          <div className="text-3xl font-bold text-amber-700 mb-2">0</div>
          <div className="text-sm font-medium text-amber-600">Pending Inquiries</div>
          <div className="text-xs text-amber-500 mt-1">Inquiries will appear here</div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Your Journey Starts Here</span>
          <span className="text-blue-600 font-medium">Create your first listing to begin</span>
        </div>
      </div>
    </div>
  )
}