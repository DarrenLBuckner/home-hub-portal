import React from 'react';
import Link from 'next/link';

interface PendingApprovalMessageProps {
  message?: string;
  approvalStatus: 'pending' | 'rejected';
  rejectionReason?: string;
}

export default function PendingApprovalMessage({ 
  message, 
  approvalStatus,
  rejectionReason 
}: PendingApprovalMessageProps) {
  const isRejected = approvalStatus === 'rejected';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full">
          <div className={`rounded-lg shadow-lg p-8 text-center bg-white border-t-4 ${
            isRejected ? 'border-red-500' : 'border-yellow-500'
          }`}>
            <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${
              isRejected ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {isRejected ? (
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 13.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            
            <h2 className={`text-2xl font-bold mb-4 ${
              isRejected ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {isRejected ? 'Account Declined' : 'Account Pending Approval'}
            </h2>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              {message || (isRejected 
                ? 'Your account application has been declined. Please contact support if you believe this is an error.'
                : 'Your account is awaiting approval (usually within 24 hours). You will receive an email notification once approved.'
              )}
            </p>
            
            {rejectionReason && isRejected && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded">
                <p className="text-sm font-medium text-red-800 mb-1">Reason for rejection:</p>
                <p className="text-sm text-red-700">{rejectionReason}</p>
              </div>
            )}
            
            {isRejected ? (
              <div className="space-y-4">
                <a
                  href="mailto:support@portalhomehub.com"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Contact Support
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  In the meantime, you can:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Browse existing property listings</li>
                  <li>• Update your profile information</li>
                  <li>• Prepare your property details</li>
                </ul>
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link 
                href="/dashboard" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}