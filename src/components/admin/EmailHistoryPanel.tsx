'use client';

import { useState } from 'react';

interface Email {
  id: string;
  subject: string;
  body: string;
  created_at: string;
  template_name?: string;
  sender_name?: string;
}

interface EmailHistoryPanelProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailHistoryPanel({ userId, userName, isOpen, onClose }: EmailHistoryPanelProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // LAZY LOADING: Only fetch when panel is opened
  const fetchHistory = async () => {
    if (loaded) return; // Don't refetch if already loaded

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/email-history?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch email history');
      const data = await response.json();
      setEmails(data.emails || []);
      setLoaded(true);
    } catch (err) {
      console.error('Failed to fetch email history:', err);
      setError('Failed to load email history');
    } finally {
      setLoading(false);
    }
  };

  // Fetch when panel opens
  if (isOpen && !loaded && !loading) {
    fetchHistory();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Email History - {userName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="text-center py-8 text-gray-500">Loading email history...</div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">{error}</div>
          )}

          {!loading && !error && emails.length === 0 && (
            <div className="text-center py-8 text-gray-500">No emails sent to this user yet.</div>
          )}

          {!loading && !error && emails.length > 0 && (
            <div className="space-y-4">
              {emails.map((email) => (
                <div key={email.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{email.subject}</p>
                      {email.template_name && (
                        <p className="text-xs text-blue-600">Template: {email.template_name}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(email.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                    {email.body}
                  </p>
                  {email.sender_name && (
                    <p className="text-xs text-gray-400 mt-2">Sent by: {email.sender_name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
