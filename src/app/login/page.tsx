"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from "@/supabase";

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');
  
  const searchParams = useSearchParams();

  // Check for session expiry and success messages
  useEffect(() => {
    const sessionExpired = searchParams?.get('sessionExpired');
    const successType = searchParams?.get('success');
    const firstName = searchParams?.get('firstName');
    
    if (sessionExpired === 'admin') {
      setSessionMessage('🔐 Your admin session has expired after 4 hours for security. Please log in again.');
    } else if (successType === 'fsbo-founding-member') {
      setSessionMessage(`🎉 Welcome ${firstName}! Registration complete! Check your email for your founding member welcome message with exclusive benefits and tips to sell your property fast. Then login below to start listing immediately.`);
    }
  }, [searchParams]);

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
    
    // Use centralized supabase client
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    
    console.log('Login attempt result:', { data: !!data.user, error: loginError?.message });
    console.log('User details:', data.user);
    
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
        .select('user_type, email, first_name, last_name')
        .eq('id', data.user.id)
        .single();

      console.log('Profile fetch result:', { profile, profileError });
      console.log('Profile user_type:', profile?.user_type);
      console.log('Full profile data:', profile);
      console.log('Profile exists?', !!profile);
      console.log('Profile user_type exists?', !!profile?.user_type);
      console.log('Profile user_type value:', JSON.stringify(profile?.user_type));
      
      setLoading(false);
      
      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setError(`Profile access error: ${profileError.message}. Please contact support.`);
        return;
      }
      
      if (profile && profile.user_type) {
        // Redirect to appropriate dashboard based on user type
        switch(profile.user_type) {
          case 'admin':
          case 'super':
            window.location.href = '/admin-dashboard';
            break;
          case 'owner':
            window.location.href = '/dashboard/owner';
            break;
          case 'agent':
            window.location.href = '/dashboard/agent';
            break;
          case 'landlord':
          case 'property_manager':
            console.log('🏠 LANDLORD LOGIN: Redirecting to /dashboard/landlord');
            window.location.href = '/dashboard/landlord';
            break;
          default:
            setError('Account type not recognized. Please contact support.');
            return;
        }
      } else {
        setError('Profile not found. Please contact support to complete your account setup.');
        return;
      }
    } else {
      setLoading(false);
      setError('Login failed - no user data received');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus('');
    // Use centralized supabase client
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
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
    <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">Portal Home Hub Login</h2>
        <div className="mb-4">
          <label className="block mb-2 text-gray-800 font-semibold">Email <span className="text-red-600">*</span></label>
          <input
            type="email"
            className="w-full p-3 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="Enter your email address"
          />
        </div>
        <div className="mb-4 relative">
          <label className="block mb-2 text-gray-800 font-semibold">Password <span className="text-red-600">*</span></label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="w-full p-3 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
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
  {/* Session expiry message */}
        {sessionMessage && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-800 text-sm font-medium">{sessionMessage}</div>
          </div>
        )}
        
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
            href="https://www.portalhomehub.com/register/select-country"
            className="text-green-700 hover:underline text-sm font-semibold"
            target="_blank"
            rel="noopener noreferrer"
          >
            Register as Agent
          </a>
           <div className="mt-2 text-center">
             <a href="https://www.portalhomehub.com/register/select-country" className="text-blue-700 hover:underline font-semibold">
               Register as Landlord
             </a>
           </div>
           <div className="mt-2 text-center">
             <a href="https://www.portalhomehub.com/register/select-country" className="text-orange-700 hover:underline font-semibold">
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
