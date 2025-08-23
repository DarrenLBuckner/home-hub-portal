"use client";
import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ConfirmEmailPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    setLoading(true);
    const supabase = createClientComponentClient();
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setLoading(false);
    if (error) {
      setStatus(error.message);
    } else {
      setStatus('Confirmation email resent! Check your inbox.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">Confirm Your Email</h2>
        <p className="mb-4 text-gray-700">Please check your email and click the confirmation link to activate your account.</p>
        <form onSubmit={handleResend} className="mb-4">
          <input
            type="email"
            className="w-full p-3 border rounded mb-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="Enter your email to resend confirmation"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Resending...' : 'Resend Confirmation Email'}
          </button>
        </form>
        {status && <div className={`text-sm ${status.includes('resent') ? 'text-green-600' : 'text-red-500'}`}>{status}</div>}
      </div>
    </div>
  );
}
