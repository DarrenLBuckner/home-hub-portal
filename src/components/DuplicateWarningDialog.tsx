import React from 'react';

interface DuplicateProperty {
  id: string;
  title: string;
  created_at: string;
  listing_type: string;
  price: number;
  location?: string;
}

interface DuplicateWarningDialogProps {
  potentialDuplicate: DuplicateProperty;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DuplicateWarningDialog({ 
  potentialDuplicate, 
  onConfirm, 
  onCancel 
}: DuplicateWarningDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        
        {/* Warning Icon */}
        <div className="mb-6 text-center">
          <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
          Possible Duplicate Property
        </h2>
        
        <p className="text-gray-600 mb-4">
          You recently created a similar property. Are you sure you want to create another one?
        </p>

        {/* Show existing property info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-1">Existing Property:</p>
          <p className="text-gray-900 font-medium">{potentialDuplicate.title}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              📅 Created: {new Date(potentialDuplicate.created_at).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              💰 Price: {potentialDuplicate.price ? `$${potentialDuplicate.price.toLocaleString()}` : 'Not specified'}
            </p>
            <p className="text-sm text-gray-600">
              🏠 Type: {potentialDuplicate.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
            </p>
            {potentialDuplicate.location && (
              <p className="text-sm text-gray-600">
                📍 Location: {potentialDuplicate.location}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            ✅ Yes, Create Anyway
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            ❌ Cancel, Go Back to Edit
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          💡 Tip: Check your properties dashboard to see if it was already created
        </p>
      </div>
    </div>
  );
}