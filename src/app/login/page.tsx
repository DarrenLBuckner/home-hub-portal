"use client";
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState('');

  const validatePassword = (pw: string) => {
    // Require at least one special character
    return /[!@#$%^&*(),.?":{}|<>]/.test(pw);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validatePassword(password)) {
      setError('Password must include at least one special character (!@#$%^&* etc).');
      return;
    }
    setLoading(true);
    
    const supabase = createClient();
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    
    console.log('Login attempt result:', { data: !!data.user, error: loginError?.message });
    
    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    // Get user profile to determine correct dashboard
    if (data.user) {
      console.log('User logged in, fetching profile...');
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', data.user.id)
        .single();

      console.log('Profile fetch result:', { profile, profileError });
      
      setLoading(false);
      
      if (profile && profile.user_type) {
        // Redirect to appropriate dashboard based on user type
        const dashboardRoutes = {
          admin: '/dashboard/admin',
          super_admin: '/dashboard/admin',
          agent: '/dashboard/agent',
          fsbo: '/dashboard/fsbo',
          landlord: '/dashboard/landlord'
        };
        
        const redirectUrl = dashboardRoutes[profile.user_type as keyof typeof dashboardRoutes] || '/dashboard/agent';
        console.log('Redirecting to:', redirectUrl);
        
        // Force a page reload to the dashboard to ensure auth state updates
        window.location.href = redirectUrl;
      } else {
        // Fallback if profile not found
        console.log('Profile not found, redirecting to agent dashboard');
        window.location.href = '/dashboard/agent';
      }
    } else {
      setLoading(false);
      setError('Login failed - no user data received');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus('');
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      setResetStatus(error.message);
    } else {
      setResetStatus('Password reset email sent! Check your inbox.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-full max-w-md">
    <h2 className="text-2xl font-bold mb-6 text-center">Portal Home Hub Login</h2>
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Email</label>
          <input
            type="email"
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="mb-4 relative">
          <label className="block mb-2 font-semibold">Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(v => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <span role="img" aria-label="Hide">🙈</span>
            ) : (
              <span role="img" aria-label="Show">👁️</span>
            )}
          </button>
        </div>
  {/* Password requirements removed since password is set on registration */}
        {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="mt-4 text-center flex flex-col gap-2">
          <button
            type="button"
            className="text-blue-600 hover:underline text-sm"
            onClick={() => setShowReset(true)}
          >
            Forgot your password?
          </button>
          <a
            href="https://portalhomehub.com/register"
            className="text-green-700 hover:underline text-sm font-semibold"
            target="_blank"
            rel="noopener noreferrer"
          >
            Register as Agent
          </a>
           <div className="mt-2 text-center">
             <a href="/register/landlord" className="text-blue-700 hover:underline font-semibold">
               Register as Landlord
             </a>
           </div>
           <div className="mt-2 text-center">
             <a href="/register/fsbo" className="text-orange-700 hover:underline font-semibold">
               Register as For Sale By Owner
             </a>
           </div>
        </div>
      </form>
      {showReset && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-10">
          <form onSubmit={handleReset} className="bg-white p-6 rounded shadow-md w-full max-w-sm relative">
            <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => { setShowReset(false); setResetStatus(''); }}>&times;</button>
            <h3 className="text-lg font-bold mb-4">Reset Password</h3>
            <input
              type="email"
              className="w-full p-3 border rounded mb-3"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition mb-2">Send Reset Email</button>
            {resetStatus && <div className={`text-sm mt-2 ${resetStatus.includes('sent') ? 'text-green-600' : 'text-red-500'}`}>{resetStatus}</div>}
          </form>
        </div>
      )}
    </div>
  );
}
