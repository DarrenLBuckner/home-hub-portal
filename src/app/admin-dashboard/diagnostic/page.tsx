"use client";
import React, { useState, useEffect } from "react";
import { supabase } from '@/supabase';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'loading';
  data?: any;
  error?: string;
}

export default function AdminDiagnosticPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

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

      // Step 3: Check table structure
      addResult({ step: "Checking Table Structure", status: 'loading' });
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'profiles')
        .eq('table_schema', 'public');

      if (columnsError) {
        addResult({ 
          step: "Checking Table Structure", 
          status: 'error', 
          error: columnsError.message 
        });
      } else {
        addResult({ 
          step: "Checking Table Structure", 
          status: 'success', 
          data: columns?.map((c: any) => c.column_name) || [] 
        });
      }

      // Step 4: Check for admin users
      addResult({ step: "Checking Admin Users", status: 'loading' });
      const { data: admins, error: adminsError } = await supabase
        .from('profiles')
        .select('email, user_type, admin_level')
        .eq('user_type', 'admin');

      if (adminsError) {
        addResult({ 
          step: "Checking Admin Users", 
          status: 'error', 
          error: adminsError.message 
        });
      } else {
        addResult({ 
          step: "Checking Admin Users", 
          status: 'success', 
          data: admins || [] 
        });
      }

      // Step 5: Check new tables
      addResult({ step: "Checking New Tables", status: 'loading' });
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .in('table_name', ['admin_permissions', 'admin_activity_log'])
        .eq('table_schema', 'public');

      if (tablesError) {
        addResult({ 
          step: "Checking New Tables", 
          status: 'error', 
          error: tablesError.message 
        });
      } else {
        addResult({ 
          step: "Checking New Tables", 
          status: 'success', 
          data: tables?.map((t: any) => t.table_name) || [] 
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
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
                  <p className="text-gray-700 text-sm font-medium mb-1">Data:</p>
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {!isRunning && results.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🎯 Quick Actions</h2>
            <div className="space-y-3">
              <a 
                href="/admin-login" 
                className="block w-full px-4 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔑 Go to Admin Login
              </a>
              <a 
                href="/" 
                className="block w-full px-4 py-3 border border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-50 transition-colors"
              >
                🏠 Go to Home
              </a>
            </div>
          </div>
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