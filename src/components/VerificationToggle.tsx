'use client';

import { useState } from 'react';

interface VerificationToggleProps {
  agentId: string;
  initialValue: boolean;
  agentName: string;
  onToggle?: (newValue: boolean) => void;
}

export function VerificationToggle({ agentId, initialValue, agentName, onToggle }: VerificationToggleProps) {
  const [isVerified, setIsVerified] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const action = isVerified ? 'revoke' : 'verify';

      const response = await fetch(`/api/agents/${agentId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update');
      }

      const newValue = !isVerified;
      setIsVerified(newValue);
      onToggle?.(newValue);

      setMessage({
        type: 'success',
        text: newValue ? 'Verified' : 'Revoked',
      });

      // Clear message after 2 seconds
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error('Verification toggle error:', error);
      setMessage({
        type: 'error',
        text: 'Failed',
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isVerified ? 'bg-green-500' : 'bg-gray-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={isVerified ? `Revoke verification for ${agentName}` : `Verify ${agentName}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
            isVerified ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          </span>
        )}
      </button>
      {message && (
        <span className={`text-xs ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}
