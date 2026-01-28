"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import Link from 'next/link';

interface AgentVetting {
  id: string;
  status: 'pending_review' | 'approved' | 'denied';
  rejection_reason?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  years_experience?: string;
  current_listings?: string;
  specialties?: string;
  license_number?: string;
  license_type?: string;
  target_region?: string;
  reference1_name?: string;
  reference1_phone?: string;
  reference1_email?: string;
  reference2_name?: string;
  reference2_phone?: string;
  reference2_email?: string;
  country?: string;
  selected_plan?: string;
}

export default function EditApplicationPage() {
  const router = useRouter();
  const [applicationData, setApplicationData] = useState<AgentVetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    company_name: '',
    years_experience: '',
    current_listings: '',
    specialties: '',
    license_number: '',
    license_type: '',
    target_region: '',
    reference1_name: '',
    reference1_phone: '',
    reference1_email: '',
    reference2_name: '',
    reference2_phone: '',
    reference2_email: '',
  });

  useEffect(() => {
    const loadApplicationData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        setUserId(user.id);

        const { data: application, error: appError } = await supabase
          .from('agent_vetting')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (appError) {
          console.error('Error loading application:', appError);
          setError('Could not load your application');
          setLoading(false);
          return;
        }

        if (!application) {
          router.push('/dashboard/agent/application-status');
          return;
        }

        if (application.status !== 'denied') {
          router.push('/dashboard/agent/application-status');
          return;
        }

        setApplicationData(application);

        // Pre-fill form with existing data
        setForm({
          first_name: application.first_name || '',
          last_name: application.last_name || '',
          phone: application.phone || '',
          email: application.email || '',
          company_name: application.company_name || '',
          years_experience: application.years_experience || '',
          current_listings: application.current_listings || '',
          specialties: application.specialties || '',
          license_number: application.license_number || '',
          license_type: application.license_type || '',
          target_region: application.target_region || '',
          reference1_name: application.reference1_name || '',
          reference1_phone: application.reference1_phone || '',
          reference1_email: application.reference1_email || '',
          reference2_name: application.reference2_name || '',
          reference2_phone: application.reference2_phone || '',
          reference2_email: application.reference2_email || '',
        });

        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
        setLoading(false);
      }
    };

    loadApplicationData();
  }, [router]);

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!form.first_name.trim()) return 'First name is required';
    if (!form.last_name.trim()) return 'Last name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!form.phone.trim()) return 'Phone is required';
    if (!form.reference1_name.trim()) return 'First reference name is required';
    if (!form.reference1_phone.trim()) return 'First reference phone is required';
    if (!form.reference1_email.trim()) return 'First reference email is required';
    if (!form.reference2_name.trim()) return 'Second reference name is required';
    if (!form.reference2_phone.trim()) return 'Second reference phone is required';
    if (!form.reference2_email.trim()) return 'Second reference email is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!applicationData?.id) {
      setError('Application ID not found');
      return;
    }

    setSubmitting(true);

    try {
      // Update the application with new data
      const { error: updateError } = await supabase
        .from('agent_vetting')
        .update({
          ...form,
          status: 'pending_review',
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationData.id);

      if (updateError) {
        setError(updateError.message || 'Failed to update application');
        setSubmitting(false);
        return;
      }

      // Send notification email to admin
      try {
        await fetch('/api/send-agent-resubmission-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: applicationData.id,
            agentEmail: form.email,
            agentName: `${form.first_name} ${form.last_name}`.trim(),
            previousRejectionReason: applicationData.rejection_reason,
            country: applicationData.country || 'GY'
          })
        });
        console.log('✅ Resubmission notification sent to admin');
      } catch (emailError) {
        console.warn('⚠️ Failed to send notification email:', emailError);
        // Continue anyway - the important part (updating status) succeeded
      }

      setSuccess('✅ Your application has been resubmitted! The admin team will review it shortly.');
      
      setTimeout(() => {
        router.push('/dashboard/agent/application-status');
      }, 2000);

    } catch (err) {
      console.error('Error submitting application:', err);
      setError('An error occurred while submitting your application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/agent/application-status">
            <button className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Status
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Update Your Application</h1>
          <p className="text-gray-600 mt-2">Make corrections and resubmit your agent application</p>
        </div>

        {/* Previous Rejection Reason */}
        {applicationData?.rejection_reason && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2">Previous Feedback:</h3>
            <p className="text-yellow-800">{applicationData.rejection_reason}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Professional Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Years of Experience</label>
                <input
                  type="text"
                  value={form.years_experience}
                  onChange={(e) => handleInputChange('years_experience', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 5, 10, 15+"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">License Type</label>
                <input
                  type="text"
                  value={form.license_type}
                  onChange={(e) => handleInputChange('license_type', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Realtor, Broker"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">License Number</label>
                <input
                  type="text"
                  value={form.license_number}
                  onChange={(e) => handleInputChange('license_number', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Specialties</label>
              <textarea
                value={form.specialties}
                onChange={(e) => handleInputChange('specialties', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Residential, Commercial, Rentals"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">Target Region</label>
              <input
                type="text"
                value={form.target_region}
                onChange={(e) => handleInputChange('target_region', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Downtown, North Region"
              />
            </div>
          </div>

          {/* References */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Professional References</h2>
            <p className="text-gray-600 text-sm mb-4">Please provide two professional references who can verify your experience</p>

            {/* Reference 1 */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-4">Reference 1</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={form.reference1_name}
                    onChange={(e) => handleInputChange('reference1_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={form.reference1_phone}
                    onChange={(e) => handleInputChange('reference1_phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={form.reference1_email}
                    onChange={(e) => handleInputChange('reference1_email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Reference 2 */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="font-bold text-purple-900 mb-4">Reference 2</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={form.reference2_name}
                    onChange={(e) => handleInputChange('reference2_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={form.reference2_phone}
                    onChange={(e) => handleInputChange('reference2_phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={form.reference2_email}
                    onChange={(e) => handleInputChange('reference2_email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link href="/dashboard/agent/application-status" className="flex-1">
              <button
                type="button"
                className="w-full px-6 py-3 bg-gray-200 text-gray-900 font-bold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? '⏳ Submitting...' : '✅ Resubmit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
