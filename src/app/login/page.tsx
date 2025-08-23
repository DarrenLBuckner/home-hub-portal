"use client";
import React, { useState } from 'react';
import { supabaseBackend } from '../../lib/supabase-backend';

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
  const supabase = supabaseBackend;
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (loginError) {
      setError(loginError.message);
    } else {
      window.location.href = '/dashboard/agent';
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus('');
  const supabase = supabaseBackend;
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
        <h2 className="text-2xl font-bold mb-6 text-center">Agent Login</h2>
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
            href="https://www.guyanahomehub.com/agent-register"
            className="text-green-700 hover:underline text-sm font-semibold"
            target="_blank"
            rel="noopener noreferrer"
          >
            Register as Agent
          </a>
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
