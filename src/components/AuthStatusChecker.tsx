'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export default function AuthStatusChecker() {
  const [status, setStatus] = useState('Checking authentication...');
  const [details, setDetails] = useState<any>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current auth state from browser client
        const supabase = createClient();
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setStatus(`Auth error: ${error.message}`);
          return;
        }
        
        if (!data.session) {
          setStatus('Not authenticated');
          return;
        }
        
        setStatus(`Authenticated as: ${data.session.user.email}`);
        setDetails({
          userId: data.session.user.id,
          email: data.session.user.email,
          lastAccess: new Date().toLocaleString()
        });
        
        // Also check our custom auth endpoint
        const apiCheck = await fetch('/api/auth/check');
        const apiResult = await apiCheck.json();
        
        if (!apiResult.authenticated) {
          setStatus(`API reports NOT authenticated: ${apiResult.message || apiResult.error || 'Unknown error'}`);
        }
      } catch (error) {
        setStatus(`Error checking auth: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    checkAuth();
  }, []);
  
  return (
    <div style={{
      margin: '10px 0',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Authentication Status:</h3>
      <p><strong>{status}</strong></p>
      {details && (
        <div>
          <p>User ID: {details.userId}</p>
          <p>Email: {details.email}</p>
          <p>Session created: {details.lastAccess}</p>
        </div>
      )}
    </div>
  );
}