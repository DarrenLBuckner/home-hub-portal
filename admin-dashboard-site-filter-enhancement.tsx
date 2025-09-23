// ADMIN DASHBOARD ENHANCEMENT FOR SITE FILTERING
// Replace the statistics loading section in admin-dashboard/page.tsx (lines 173-285)

// Add state for site filter at the top with other useState declarations:
const [siteFilter, setSiteFilter] = useState<string>('all');
const [availableSites, setAvailableSites] = useState<{id: string, name: string}[]>([]);

// Enhanced loadDashboardData function with site filtering:
async function loadDashboardData(selectedSite: string = 'all') {
  try {
    // Load available sites from tenants table
    console.log('Loading available sites...');
    const { data: sitesData, error: sitesError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    if (!sitesError && sitesData) {
      setAvailableSites([
        { id: 'all', name: 'All Sites' },
        ...sitesData
      ]);
    }

    // Build base query with optional site filtering
    let pendingQuery = supabase
      .from('properties')
      .select('*')
      .eq('status', 'pending');
    
    if (selectedSite !== 'all') {
      pendingQuery = pendingQuery.eq('site_id', selectedSite);
    }

    const { data: pendingData, error: pendingError } = await pendingQuery
      .order('created_at', { ascending: true });

    if (pendingError) {
      console.error('Error loading pending properties:', pendingError);
      throw pendingError;
    }
    
    console.log('Loaded pending properties:', pendingData?.length || 0, 'for site:', selectedSite);
    setPendingProperties(pendingData || []);

    // Load statistics with site filtering
    const today = new Date().toISOString().split('T')[0];
    console.log('Loading statistics for site:', selectedSite);
    
    // Build base queries for statistics
    let baseQuery = supabase.from('properties');
    let countOptions = { count: 'exact', head: true };
    
    // Count pending with site filter
    let pendingStatsQuery = baseQuery.select('*', countOptions).eq('status', 'pending');
    if (selectedSite !== 'all') {
      pendingStatsQuery = pendingStatsQuery.eq('site_id', selectedSite);
    }
    const { count: totalPending } = await pendingStatsQuery;

    // Count today's submissions with site filter
    let todayStatsQuery = baseQuery.select('*', countOptions)
      .gte('created_at', today + 'T00:00:00.000Z')
      .lt('created_at', today + 'T23:59:59.999Z');
    if (selectedSite !== 'all') {
      todayStatsQuery = todayStatsQuery.eq('site_id', selectedSite);
    }
    const { count: todaySubmissions } = await todayStatsQuery;

    // Count by user type for pending properties with site filter
    let byUserType = { fsbo: 0, agent: 0, landlord: 0 };
    let userTypeQuery = baseQuery.select('listed_by_type').eq('status', 'pending');
    if (selectedSite !== 'all') {
      userTypeQuery = userTypeQuery.eq('site_id', selectedSite);
    }
    
    const { data: byUserTypeData, error: typeError } = await userTypeQuery;
    if (!typeError && byUserTypeData) {
      byUserType = {
        fsbo: byUserTypeData.filter(p => p.listed_by_type === 'owner' || p.listed_by_type === 'fsbo').length,
        agent: byUserTypeData.filter(p => p.listed_by_type === 'agent').length,
        landlord: byUserTypeData.filter(p => p.listed_by_type === 'landlord').length,
      };
    }

    // Count active properties with site filter
    let activeStatsQuery = baseQuery.select('*', countOptions).eq('status', 'available');
    if (selectedSite !== 'all') {
      activeStatsQuery = activeStatsQuery.eq('site_id', selectedSite);
    }
    const { count: totalActive } = await activeStatsQuery;

    // Count rejected properties with site filter
    let rejectedStatsQuery = baseQuery.select('*', countOptions).eq('status', 'rejected');
    if (selectedSite !== 'all') {
      rejectedStatsQuery = rejectedStatsQuery.eq('site_id', selectedSite);
    }
    const { count: totalRejected } = await rejectedStatsQuery;

    setStatistics({
      totalPending: totalPending || 0,
      todaySubmissions: todaySubmissions || 0,
      byUserType,
      totalActive: totalActive || 0,
      totalRejected: totalRejected || 0,
    });

  } catch (err: any) {
    console.error('Failed to load dashboard data:', err);
    setError(`Failed to load dashboard data: ${err?.message || 'Unknown error'}`);
    setPendingProperties([]);
    setStatistics({
      totalPending: 0,
      todaySubmissions: 0,
      byUserType: { fsbo: 0, agent: 0, landlord: 0 },
      totalActive: 0,
      totalRejected: 0,
    });
  }
}

// Update the initial load in useEffect:
// Replace loadDashboardData() call with:
await loadDashboardData(siteFilter);

// Add site filter dropdown in the header section (after line 535):
// Replace the header section with:
<div className="max-w-6xl mx-auto px-4 py-8">
  {/* Site Filter and Statistics Header */}
  <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Property Management Dashboard</h2>
        <p className="text-gray-600 text-sm">Filter by site to view region-specific properties</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Site:</label>
          <select
            value={siteFilter}
            onChange={(e) => {
              setSiteFilter(e.target.value);
              loadDashboardData(e.target.value);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableSites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => loadDashboardData(siteFilter)}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>
    </div>
    
    {siteFilter !== 'all' && (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600 text-sm">📍</span>
          <span className="text-blue-800 text-sm font-medium">
            Showing data for: {availableSites.find(s => s.id === siteFilter)?.name || siteFilter}
          </span>
          <button
            onClick={() => {
              setSiteFilter('all');
              loadDashboardData('all');
            }}
            className="text-blue-600 text-sm hover:text-blue-800 underline ml-2"
          >
            View all sites
          </button>
        </div>
      </div>
    )}
  </div>

  {/* Statistics Cards - existing code stays the same */}
  
// Update the PropertyCard component to show site information:
// Add this to the property card display (around line 446):
<div className="flex items-center space-x-4 text-xs text-gray-500">
  <span>🛏️ {property.bedrooms} bed</span>
  <span>🚿 {property.bathrooms} bath</span>
  <span>📍 {property.city}, {property.region}</span>
  {property.site_id && (
    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
      🌐 {property.site_id}
    </span>
  )}
</div>

// Enhanced approval and rejection functions to maintain site context:
async function approveProperty(propertyId: string) {
  setProcessingPropertyId(propertyId);

  try {
    const { error } = await supabase
      .from('properties')
      .update({ 
        status: 'available', // Changed from 'active' to 'available' to match public API
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId);

    if (error) throw error;

    // Remove from pending list and update statistics
    setPendingProperties(prev => prev.filter(p => p.id !== propertyId));
    setStatistics(prev => ({
      ...prev,
      totalPending: prev.totalPending - 1,
      totalActive: prev.totalActive + 1,
    }));

    // Send approval email notification
    await sendApprovalEmail(propertyId);
    
  } catch (err: any) {
    setError('Failed to approve property: ' + err.message);
  }
  setProcessingPropertyId(null);
}

// Add site context to statistics cards titles:
// Update the statistics section (around line 539):
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
  <div className="bg-white rounded-lg p-6 border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">
          Pending Review {siteFilter !== 'all' ? `(${siteFilter})` : ''}
        </p>
        <p className="text-2xl font-bold text-yellow-600">{statistics.totalPending}</p>
      </div>
      <div className="text-3xl">⏳</div>
    </div>
  </div>
  
  <div className="bg-white rounded-lg p-6 border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">
          Today's Submissions {siteFilter !== 'all' ? `(${siteFilter})` : ''}
        </p>
        <p className="text-2xl font-bold text-blue-600">{statistics.todaySubmissions}</p>
      </div>
      <div className="text-3xl">📈</div>
    </div>
  </div>
  
  <div className="bg-white rounded-lg p-6 border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">
          Active Properties {siteFilter !== 'all' ? `(${siteFilter})` : ''}
        </p>
        <p className="text-2xl font-bold text-green-600">{statistics.totalActive}</p>
      </div>
      <div className="text-3xl">✅</div>
    </div>
  </div>
  
  <div className="bg-white rounded-lg p-6 border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">
          Rejected {siteFilter !== 'all' ? `(${siteFilter})` : ''}
        </p>
        <p className="text-2xl font-bold text-red-600">{statistics.totalRejected}</p>
      </div>
      <div className="text-3xl">❌</div>
    </div>
  </div>
  
  {/* By Type card stays the same */}
</div>