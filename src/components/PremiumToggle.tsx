'use client';

import { useState } from 'react';
import { supabase } from '@/supabase';

interface PremiumToggleProps {
  agentId: string;
  initialValue: boolean;
  agentName: string;
  onToggle?: (newValue: boolean) => void;
}

export function PremiumToggle({ agentId, initialValue, agentName, onToggle }: PremiumToggleProps) {
  const [isPremium, setIsPremium] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // Get the current session to retrieve the access token


      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session || !session.access_token) {
        throw new Error('Authorization required');
      }

      const response = await fetch(`/api/admin/agents/${agentId}/premium`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_premium_agent: !isPremium }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update');
      }

      const newValue = !isPremium;
      setIsPremium(newValue);
      onToggle?.(newValue);

      setMessage({
        type: 'success',
        text: newValue ? 'Added to rotation' : 'Removed'
      });

      // Clear message after 2 seconds
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error('Premium toggle error:', error);
      setMessage({
        type: 'error',
        text: 'Failed'
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
          isPremium ? 'bg-amber-500' : 'bg-gray-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={isPremium ? 'Remove from premium rotation' : 'Add to premium rotation'}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
            isPremium ? 'translate-x-6' : 'translate-x-1'
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
