"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { useAdminData } from '@/hooks/useAdminData';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'loading';
  data?: any;
  error?: string;
}

export default function AdminDiagnosticPage() {
  const router = useRouter();
  const { adminData, permissions, isAdmin, isLoading: adminLoading, error: adminError } = useAdminData();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Super Admin access control
  useEffect(() => {
    if (adminLoading) return;
    
    if (adminError) {
      console.error('❌ Admin data error:', adminError);
      alert('Error loading admin data. Please try again.');
      router.push('/admin-login');
      return;
    }
    
    if (!isAdmin) {
      console.log('❌ Not authorized to view diagnostics - not admin.');
      alert('Access denied. Admin privileges required.');
      router.push('/admin-login');
      return;
    }
    
    // Check if user has diagnostics access (Super Admin only)
    if (!permissions?.canAccessDiagnostics) {
      console.log('❌ Not authorized to view diagnostics - insufficient permissions.');
      alert('Access denied. Super Admin privileges required for system diagnostics.');
      router.push('/admin-dashboard');
      return;
    }
  }, [adminLoading, adminError, isAdmin, permissions, router]);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    // Step 1: Check authentication
    addResult({ step: "Checking Authentication", status: 'loading' });
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        addResult({ 
          step: "Checking Authentication", 
          status: 'error', 
          error: userError.message 
        });
        setIsRunning(false);
        return;
      }

      addResult({ 
        step: "Checking Authentication", 
        status: 'success', 
        data: { userId: user?.id, email: user?.email } 
      });

      if (!user) {
        addResult({ 
          step: "User Status", 
          status: 'error', 
          error: "No authenticated user found" 
        });
        setIsRunning(false);
        return;
      }

      // Step 2: Check profile existence
      addResult({ step: "Checking Profile", status: 'loading' });
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        addResult({ 
          step: "Checking Profile", 
          status: 'error', 
          error: profileError.message 
        });
      } else {
        addResult({ 
          step: "Checking Profile", 
          status: 'success', 
          data: profile 
        });
      }

      // Step 3: Check database connectivity
      addResult({ step: "Checking Database Connection", status: 'loading' });
      try {
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' });
          
        if (countError) {
          addResult({ 
            step: "Checking Database Connection", 
            status: 'error', 
            error: countError.message 
          });
        } else {
          addResult({ 
            step: "Checking Database Connection", 
            status: 'success', 
            data: { totalUsers: count || 0, connectionStatus: 'Connected' } 
          });
        }
      } catch (dbError) {
        addResult({ 
          step: "Checking Database Connection", 
          status: 'error', 
          error: dbError instanceof Error ? dbError.message : 'Database connection failed' 
        });
      }

      // Step 4: Check admin privileges and permissions
      addResult({ step: "Checking Admin System Status", status: 'loading' });
      const { data: adminStats, error: adminStatsError } = await supabase
        .from('profiles')
        .select('user_type, admin_level')
        .eq('user_type', 'admin');

      if (adminStatsError) {
        addResult({ 
          step: "Checking Admin System Status", 
          status: 'error', 
          error: adminStatsError.message 
        });
      } else {
        // Deduplicate and summarize admin data
        const adminSummary = adminStats?.reduce((acc: any, admin: any) => {
          const key = `${admin.user_type}_${admin.admin_level || 'basic'}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {}) || {};
        
        addResult({ 
          step: "Checking Admin System Status", 
          status: 'success', 
          data: {
            currentUserLevel: adminData?.admin_level || 'Unknown',
            adminCounts: adminSummary,
            systemAccessible: true
          }
        });
      }

      // Step 5: Check property limits system
      addResult({ step: "Checking Property Limits System", status: 'loading' });
      try {
        const { data: limitsCheck, error: limitsError } = await supabase
          .from('user_property_limits')
          .select('user_id')
          .limit(1);
          
        const { data: quotasCheck, error: quotasError } = await supabase
          .from('property_quotas')
          .select('user_type')
          .limit(1);

        if (limitsError || quotasError) {
          addResult({ 
            step: "Checking Property Limits System", 
            status: 'error', 
            error: limitsError?.message || quotasError?.message || 'Property limits system error' 
          });
        } else {
          addResult({ 
            step: "Checking Property Limits System", 
            status: 'success', 
            data: {
              userLimitsTable: limitsCheck ? 'Available' : 'Not found',
              quotasTable: quotasCheck ? 'Available' : 'Not found',
              systemStatus: 'Property limits system operational'
            }
          });
        }
      } catch (systemError) {
        addResult({ 
          step: "Checking Property Limits System", 
          status: 'error', 
          error: systemError instanceof Error ? systemError.message : 'System check failed' 
        });
      }

    } catch (error) {
      addResult({ 
        step: "General Error", 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  // Show loading while checking permissions
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Checking Super Admin access...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authorized (useEffect will handle redirect)
  if (!isAdmin || !permissions?.canAccessDiagnostics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="text-red-600 text-4xl mb-4">🔒</div>
          <p className="text-gray-900 font-bold mb-2">Super Admin Access Required</p>
          <p className="text-gray-600">System diagnostics are restricted to Super Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Header */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-4">
          <div className="flex items-center justify-between">
            <Link href="/admin-dashboard" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <span className="mr-2">←</span>
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <div className="flex space-x-2">
              <Link href="/admin-dashboard/settings">
                <button className="px-3 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors">
                  ⚙️ Settings
                </button>
              </Link>
              <Link href="/admin-dashboard/user-management">
                <button className="px-3 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors">
                  👥 Users
                </button>                
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">🔍 Admin System Diagnostics</h1>
          <p className="text-gray-600 mb-4">
            This page helps diagnose issues with the admin system. Running comprehensive checks...
          </p>
          
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-6"
          >
            {isRunning ? '🔄 Running Diagnostics...' : '🔄 Run Diagnostics Again'}
          </button>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{result.step}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  result.status === 'success' ? 'bg-green-100 text-green-800' :
                  result.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {result.status === 'success' ? '✅ SUCCESS' :
                   result.status === 'error' ? '❌ ERROR' :
                   '⏳ LOADING'}
                </span>
              </div>
              
              {result.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                  <p className="text-red-800 text-sm font-medium">Error:</p>
                  <p className="text-red-700 text-sm">{result.error}</p>
                </div>
              )}
              
              {result.data && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-700 text-sm font-medium mb-1">Results:</p>
                  {/* Format data in a more readable way */}
                  {typeof result.data === 'object' && result.data !== null ? (
                    <div className="space-y-1 text-sm text-gray-600">
                      {Object.entries(result.data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="text-right">
                            {typeof value === 'object' && value !== null 
                              ? JSON.stringify(value, null, 2)
                              : String(value)
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">{String(result.data)}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {!isRunning && results.length > 0 && (
          <>
            {/* Diagnostic Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg mt-6">
              <h2 className="text-lg font-bold text-blue-900 mb-4">📋 Diagnostic Summary</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {results.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {results.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {results.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Checks</div>
                </div>
              </div>
              {adminData && (
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Current User:</strong> {adminData.display_name || adminData.first_name || 'Admin'} ({adminData.email})
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Admin Level:</strong> {adminData.admin_level || 'Basic'} Admin
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🎯 Quick Actions</h2>
              <div className="space-y-3">
                <Link 
                  href="/admin-dashboard" 
                  className="block w-full px-4 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🏠 Back to Admin Dashboard
                </Link>
                <Link 
                  href="/admin-dashboard/users" 
                  className="block w-full px-4 py-3 border border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-50 transition-colors"
                >
                  👥 Manage Users
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Support Contact Information */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-lg mt-6">
          <h2 className="text-lg font-bold text-green-900 mb-4">💬 Need Admin Support?</h2>
          <p className="text-green-800 text-sm mb-4">
            If you're experiencing technical issues or need assistance with admin functions, our support team is here to help.
          </p>
          <div className="space-y-3">
            <a 
              href="https://wa.me/5927629797" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <span className="mr-2">📱</span>
              WhatsApp: +592 762-9797 (Fastest Response)
            </a>
            <div className="text-center text-green-700 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <span>📞</span>
                <span>Phone: <strong>+5927629797</strong></span>
              </div>
              <p className="mt-2 text-xs text-green-600">Available for urgent admin and technical support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}