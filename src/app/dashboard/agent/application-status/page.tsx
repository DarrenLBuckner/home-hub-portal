"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import Link from 'next/link';

interface AgentVetting {
  id: string;
  status: 'pending_review' | 'approved' | 'denied';
  rejection_reason?: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  company_name?: string;
  years_experience?: string;
  specialties?: string;
  license_number?: string;
  license_type?: string;
  selected_plan?: string;
  reference1_name?: string;
  reference1_phone?: string;
  reference1_email?: string;
  reference2_name?: string;
  reference2_phone?: string;
  reference2_email?: string;
}

export default function ApplicationStatusPage() {
  const router = useRouter();
  const [applicationData, setApplicationData] = useState<AgentVetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkApplicationStatus = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        setUserId(user.id);

        // Check if user has an agent application
        const { data: application, error: appError } = await supabase
          .from('agent_vetting')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (appError && appError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is expected for non-agents
          console.error('Error fetching application:', appError);
          setError('Could not load application data');
          setLoading(false);
          return;
        }

        if (!application) {
          // User is not an agent or hasn't applied yet
          setApplicationData(null);
          setLoading(false);
          return;
        }

        setApplicationData(application);
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
        setLoading(false);
      }
    };

    checkApplicationStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading application status...</p>
        </div>
      </div>
    );
  }

  if (!applicationData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Application Found</h1>
            <p className="text-gray-600 mb-6">
              You haven't submitted an agent application yet.
            </p>
            <Link href="/list-agent">
              <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                Apply as Agent
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (applicationData.status) {
      case 'pending_review':
        return 'orange';
      case 'approved':
        return 'green';
      case 'denied':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = () => {
    switch (applicationData.status) {
      case 'pending_review':
        return '⏳';
      case 'approved':
        return '✅';
      case 'denied':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusMessage = () => {
    switch (applicationData.status) {
      case 'pending_review':
        return 'Your application is under review';
      case 'approved':
        return 'Your application has been approved!';
      case 'denied':
        return 'Your application was not approved';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/agent">
            <button className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Dashboard
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Application Status</h1>
        </div>

        {/* Status Card */}
        <div className={`bg-white rounded-2xl shadow-sm border-2 border-${getStatusColor()}-200 p-8 mb-6`}>
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{getStatusIcon()}</div>
            <h2 className={`text-2xl font-bold text-${getStatusColor()}-900 mb-2`}>
              {getStatusMessage()}
            </h2>
            <p className={`text-${getStatusColor()}-700`}>
              Submitted on {new Date(applicationData.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Rejection Reason */}
          {applicationData.status === 'denied' && applicationData.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-900 mb-2">Reason for Rejection:</h3>
              <p className="text-red-800">{applicationData.rejection_reason}</p>
            </div>
          )}

          {/* Approved Message */}
          {applicationData.status === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">Welcome!</h3>
              <p className="text-green-800 mb-4">
                Your agent account is now active. You can access all agent features and start listing properties.
              </p>
              <Link href="/dashboard/agent">
                <button className="w-full px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors">
                  Go to Dashboard
                </button>
              </Link>
            </div>
          )}

          {/* Pending Message */}
          {applicationData.status === 'pending_review' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-orange-900 mb-2">We're Reviewing Your Application</h3>
              <p className="text-orange-800">
                Thank you for submitting your agent application. Our team is reviewing your information and will contact you within 48-72 hours. Please check your email for updates.
              </p>
            </div>
          )}
        </div>

        {/* Application Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Application Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {applicationData.first_name && (
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">First Name</label>
                <p className="text-gray-900">{applicationData.first_name}</p>
              </div>
            )}
            {applicationData.last_name && (
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Last Name</label>
                <p className="text-gray-900">{applicationData.last_name}</p>
              </div>
            )}
            {applicationData.email && (
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Email</label>
                <p className="text-gray-900">{applicationData.email}</p>
              </div>
            )}
            {applicationData.company_name && (
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Company</label>
                <p className="text-gray-900">{applicationData.company_name}</p>
              </div>
            )}
            {applicationData.years_experience && (
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Experience</label>
                <p className="text-gray-900">{applicationData.years_experience} years</p>
              </div>
            )}
            {applicationData.selected_plan && (
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Plan</label>
                <p className="text-gray-900">{applicationData.selected_plan}</p>
              </div>
            )}
          </div>

          {applicationData.specialties && (
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-600 uppercase">Specialties</label>
              <p className="text-gray-900">{applicationData.specialties}</p>
            </div>
          )}

          {applicationData.license_number && (
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-600 uppercase">License</label>
              <p className="text-gray-900">
                {applicationData.license_type && `${applicationData.license_type}: `}
                {applicationData.license_number}
              </p>
            </div>
          )}
        </div>

        {/* Resubmit Button for Denied Applications */}
        {applicationData.status === 'denied' && (
          <div className="bg-blue-50 rounded-2xl shadow-sm border border-blue-200 p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">Ready to Resubmit?</h3>
            <p className="text-blue-800 mb-4">
              You can update your information and resubmit your application. Make sure to address the reason for the previous rejection.
            </p>
            <Link href={`/dashboard/agent/application-status/edit`}>
              <button className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                ✏️ Edit & Resubmit Application
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
