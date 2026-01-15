'use client';

import { useState, useEffect } from 'react';

interface LastEmailIndicatorProps {
  userId: string;
}

interface LastEmail {
  id: string;
  subject: string;
  created_at: string;
  template_name?: string;
}

export default function LastEmailIndicator({ userId }: LastEmailIndicatorProps) {
  const [lastEmail, setLastEmail] = useState<LastEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchLastEmail() {
      try {
        const response = await fetch(`/api/admin/email-history?userId=${userId}&limit=1`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setLastEmail(data.emails?.[0] || null);
      } catch (err) {
        console.error('Failed to fetch last email:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchLastEmail();
  }, [userId]);

  // GRACEFUL FAILURE: If error or loading, render nothing (don't break the card)
  if (loading || error || !lastEmail) return null;

  const formattedDate = new Date(lastEmail.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
      <span>📧</span>
      <span>Last email: {lastEmail.template_name || 'Custom'} ({formattedDate})</span>
    </div>
  );
}
