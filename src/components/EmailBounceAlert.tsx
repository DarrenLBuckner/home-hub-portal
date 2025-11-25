'use client';
import { useState, useEffect } from 'react';
import { useAdminData } from '@/hooks/useAdminData';

interface FailedEmail {
  recipient: string;
  event_type: string;
  reason: string;
  subject: string;
  created_at: string;
}

export default function EmailBounceAlert() {
  const { adminData, permissions, isAdmin } = useAdminData();
  const [failedEmails, setFailedEmails] = useState<FailedEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if user is admin
    if (isAdmin && adminData) {
      fetchFailedEmails();
    } else {
      setLoading(false);
    }
  }, [isAdmin, adminData]);

  // Only show to admins (super_admin, admin_owner, basic_admin) - not regular users
  if (!isAdmin || !adminData) {
    return null;
  }

  const fetchFailedEmails = async () => {
    try {
      const response = await fetch('/api/admin/email-events?type=failed&limit=10');
      const data = await response.json();
      setFailedEmails(data.failed_emails || []);
    } catch (error) {
      console.error('Failed to fetch email events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading email status...</div>;
  
  if (failedEmails.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-sm text-green-700">✅ No recent email failures</p>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-red-800 mb-2">
        ⚠️ Recent Email Failures ({failedEmails.length})
      </h3>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {failedEmails.slice(0, 5).map((email, index) => (
          <div key={index} className="text-xs bg-white p-2 rounded border">
            <div className="font-medium text-red-700">{email.recipient}</div>
            <div className="text-gray-600">
              {email.event_type} - {email.reason}
            </div>
            <div className="text-gray-400">
              {new Date(email.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
      {failedEmails.length > 5 && (
        <p className="text-xs text-gray-500 mt-2">
          +{failedEmails.length - 5} more failures
        </p>
      )}
    </div>
  );
}