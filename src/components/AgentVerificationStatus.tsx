"use client";

import React, { useState, useEffect } from 'react';

interface AgentVerificationStatusProps {
  agentId: string;
  agentName: string;
  onVerificationChange?: (isVerified: boolean) => void;
}

interface VerificationData {
  is_verified_agent: boolean;
  verified_by: string | null;
  verified_by_name: string | null;
  verified_at: string | null;
}

/**
 * AgentVerificationStatus Component
 *
 * Displays the verification status of an agent and allows
 * Super Admins and Owner Admins to verify/revoke verification.
 */
export default function AgentVerificationStatus({
  agentId,
  agentName,
  onVerificationChange,
}: AgentVerificationStatusProps) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [canVerify, setCanVerify] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  // Fetch verification status on mount
  useEffect(() => {
    fetchVerificationStatus();
  }, [agentId]);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/agents/${agentId}/verify`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch verification status');
      }

      const data = await response.json();

      setVerificationData({
        is_verified_agent: data.agent.is_verified_agent,
        verified_by: data.agent.verified_by,
        verified_by_name: data.agent.verified_by_name,
        verified_at: data.agent.verified_at,
      });
      setCanVerify(data.canVerify);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error fetching verification status:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setProcessing(true);
      setError(null);

      const response = await fetch(`/api/agents/${agentId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'verify' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to verify agent');
      }

      const data = await response.json();

      setVerificationData({
        is_verified_agent: true,
        verified_by: data.verifier.id,
        verified_by_name: data.verifier.name,
        verified_at: data.agent.verified_at,
      });

      setShowVerifyModal(false);
      onVerificationChange?.(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error verifying agent:', err);
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleRevoke = async () => {
    try {
      setProcessing(true);
      setError(null);

      const response = await fetch(`/api/agents/${agentId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'revoke' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to revoke verification');
      }

      setVerificationData({
        is_verified_agent: false,
        verified_by: null,
        verified_by_name: null,
        verified_at: null,
      });

      setShowRevokeModal(false);
      onVerificationChange?.(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error revoking verification:', err);
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
          <span className="ml-2 text-gray-600">Loading verification status...</span>
        </div>
      </div>
    );
  }

  if (error && !verificationData) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-6">
        <div className="flex items-center">
          <span className="text-xl mr-2">⚠️</span>
          <span className="text-red-700">{error}</span>
        </div>
        <button
          onClick={fetchVerificationStatus}
          className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const isVerified = verificationData?.is_verified_agent;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <span className="text-xl mr-2">🛡️</span>
          <h3 className="text-lg font-semibold text-gray-900">Verification Status</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {isVerified ? (
          // Verified State
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-2xl">✓</span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-green-800">Verified Agent</h4>
                  <p className="text-sm text-green-700">
                    This agent has been verified as a legitimate professional.
                  </p>
                </div>
              </div>
              {canVerify && (
                <button
                  onClick={() => setShowRevokeModal(true)}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Revoke
                </button>
              )}
            </div>

            {/* Verification Details */}
            <div className="mt-4 pt-4 border-t border-green-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-green-700 font-medium">Verified by:</span>
                  <span className="ml-2 text-green-800">
                    {verificationData?.verified_by_name || 'Unknown Admin'}
                  </span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Verified on:</span>
                  <span className="ml-2 text-green-800">
                    {formatDate(verificationData?.verified_at || null)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Not Verified State
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-2xl text-gray-400">○</span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-700">Not Verified</h4>
                  <p className="text-sm text-gray-500">
                    This agent has not been verified yet.
                  </p>
                </div>
              </div>
              {canVerify && (
                <button
                  onClick={() => setShowVerifyModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Mark as Verified
                </button>
              )}
            </div>

            {!canVerify && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  Only Super Admins and Owner Admins can verify agents in their territory.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Verify Agent</h3>
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  You are about to mark <strong>{agentName}</strong> as a Verified Agent.
                  This badge appears publicly on all their listings.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Only verify agents you have personally
                    confirmed are legitimate professionals.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowVerifyModal(false)}
                  disabled={processing}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    'Verify Agent'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Revoke Verification</h3>
                <button
                  onClick={() => setShowRevokeModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  You are about to remove the Verified Agent badge from <strong>{agentName}</strong>.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This will remove the badge from all
                    their public listings immediately.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRevokeModal(false)}
                  disabled={processing}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Revoking...
                    </>
                  ) : (
                    'Revoke Badge'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
