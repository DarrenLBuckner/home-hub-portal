'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/supabase';
import { getSuspensionAdminContact } from '@/lib/userSuspensionCheck';

interface AdminContact {
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  display_name?: string;
}

export default function AccountSuspendedPage() {
  const router = useRouter();
  const [suspensionInfo, setSuspensionInfo] = useState<any>(null);
  const [adminContact, setAdminContact] = useState<AdminContact | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    checkSuspensionStatus();
  }, []);

  const checkSuspensionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Get user profile and suspension info
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        router.push('/login');
        return;
      }

      // If not suspended, redirect to dashboard
      if (!profile.is_suspended) {
        router.push('/dashboard');
        return;
      }

      setSuspensionInfo({
        reason: profile.suspension_reason,
        suspendedAt: profile.suspended_at,
        suspendedBy: profile.suspended_by
      });

      // Get admin contact for this country
      if (profile.country_id) {
        const contact = await getSuspensionAdminContact(profile.country_id);
        setAdminContact(contact);
      }

    } catch (error) {
      console.error('Error checking suspension status:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 text-red-500 mb-6">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Account Suspended
          </h2>
          
          <p className="text-gray-600 mb-8">
            Your account has been temporarily suspended and you cannot access your dashboard at this time.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {suspensionInfo?.reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Suspension Reason:</h3>
              <p className="text-red-700 text-sm">{suspensionInfo.reason}</p>
              {suspensionInfo.suspendedAt && (
                <p className="text-red-600 text-xs mt-2">
                  Suspended on {new Date(suspensionInfo.suspendedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-3">What happens now?</h3>
            <ul className="text-blue-700 text-sm space-y-2">
              <li>• Your property listings remain visible to potential buyers/renters</li>
              <li>• You cannot access your dashboard to make changes</li>
              <li>• Contact inquiries are redirected to our admin team</li>
              <li>• Your account can be reactivated once the issue is resolved</li>
            </ul>
          </div>

          {adminContact && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-3">Contact Admin to Resolve:</h3>
              <div className="text-green-700 text-sm space-y-2">
                <p>
                  <strong>{adminContact.display_name || `${adminContact.first_name} ${adminContact.last_name}`}</strong>
                  <br />Regional Administrator
                </p>
                <p>📧 <a href={`mailto:${adminContact.email}`} className="text-green-600 hover:text-green-500 underline">
                  {adminContact.email}
                </a></p>
                {adminContact.phone && (
                  <p>📱 <a href={`tel:${adminContact.phone}`} className="text-green-600 hover:text-green-500 underline">
                    {adminContact.phone}
                  </a></p>
                )}
              </div>
            </div>
          )}

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              To resolve this suspension, please contact the administrator above with your account details and any questions about the suspension reason.
            </p>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => window.location.href = `mailto:${adminContact?.email}?subject=Account Suspension Appeal&body=Hello, I would like to appeal my account suspension. My account details: [Please include your account information]`}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                📧 Email Administrator
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            If you believe this suspension is an error, please contact support immediately.
          </p>
        </div>
      </div>
    </div>
  );
}