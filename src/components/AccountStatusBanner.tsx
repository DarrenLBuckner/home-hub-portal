'use client';

import Link from 'next/link';

interface AccountStatusBannerProps {
  status: 'pending' | 'pending_review' | 'approved' | 'rejected' | 'denied' | 'needs_correction' | null;
  rejectionReason?: string | null;
  userType: 'agent' | 'fsbo' | 'landlord' | 'owner';
  userName?: string;
}

/**
 * AccountStatusBanner - Shows account approval status at the top of dashboards
 *
 * Displays a prominent banner when user's account is:
 * - pending/pending_review: Yellow - Application under review
 * - rejected/denied: Red - Application rejected with reason
 * - needs_correction: Orange - Needs fixes before approval
 * - approved: No banner shown (normal access)
 */
export default function AccountStatusBanner({
  status,
  rejectionReason,
  userType,
  userName
}: AccountStatusBannerProps) {
  // Don't show banner for approved accounts or null status
  if (!status || status === 'approved') {
    return null;
  }

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'agent': return 'Agent';
      case 'fsbo': return 'Property Owner (FSBO)';
      case 'landlord': return 'Landlord';
      case 'owner': return 'Property Owner';
      default: return 'User';
    }
  };

  const getEditLink = () => {
    switch (userType) {
      case 'agent': return '/dashboard/agent/application-status/edit';
      default: return null; // FSBO/Landlord edit profile in settings
    }
  };

  // Pending Review Status
  if (status === 'pending' || status === 'pending_review') {
    return (
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg shadow-sm">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⏳</div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 text-lg">
              Application Under Review
            </h3>
            <p className="text-amber-800 mt-1">
              {userName ? `Hi ${userName}! ` : ''}Your {getUserTypeLabel()} application is being reviewed by our team.
              This typically takes 24-48 hours. You'll receive an email once approved.
            </p>
            <div className="mt-3 text-sm text-amber-700">
              <strong>What you can do now:</strong>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Explore the dashboard and familiarize yourself with the features</li>
                <li>Prepare your property photos and descriptions</li>
                <li>Check your email for updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Needs Correction Status
  if (status === 'needs_correction') {
    return (
      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded-r-lg shadow-sm">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⚠️</div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 text-lg">
              Action Required - Please Update Your Application
            </h3>
            <p className="text-orange-800 mt-1">
              We've reviewed your {getUserTypeLabel()} application and need some additional information or corrections before we can approve it.
            </p>

            {rejectionReason && (
              <div className="bg-white border border-orange-200 rounded-lg p-3 mt-3">
                <p className="text-sm font-medium text-orange-900 mb-1">What needs to be corrected:</p>
                <p className="text-orange-800 whitespace-pre-line">{rejectionReason}</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {userType === 'agent' && (
                <Link href="/dashboard/agent/application-status/edit">
                  <button className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors">
                    Edit & Resubmit Application
                  </button>
                </Link>
              )}
              <a
                href="https://wa.me/5927629797"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
              >
                <span>💬</span> Contact Support on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rejected/Denied Status
  if (status === 'rejected' || status === 'denied') {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm">
        <div className="flex items-start gap-3">
          <div className="text-2xl">❌</div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 text-lg">
              Application Not Approved
            </h3>
            <p className="text-red-800 mt-1">
              Unfortunately, your {getUserTypeLabel()} application was not approved at this time.
            </p>

            {rejectionReason && (
              <div className="bg-white border border-red-200 rounded-lg p-3 mt-3">
                <p className="text-sm font-medium text-red-900 mb-1">Reason:</p>
                <p className="text-red-800 whitespace-pre-line">{rejectionReason}</p>
              </div>
            )}

            <div className="mt-4 bg-red-100 rounded-lg p-3">
              <p className="text-sm text-red-800">
                <strong>What can you do?</strong>
              </p>
              <ul className="list-disc ml-5 mt-1 text-sm text-red-700 space-y-1">
                <li>Review the reason above and address any issues</li>
                <li>Contact our support team if you believe this was in error</li>
                <li>You may be able to reapply after addressing the concerns</li>
              </ul>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {userType === 'agent' && (
                <Link href="/dashboard/agent/application-status/edit">
                  <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Edit & Resubmit Application
                  </button>
                </Link>
              )}
              <a
                href="mailto:support@portalhomehub.com?subject=Application%20Review%20Request"
                className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center gap-2"
              >
                <span>📧</span> Email Support
              </a>
              <a
                href="https://wa.me/5927629797"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
              >
                <span>💬</span> WhatsApp Support
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
