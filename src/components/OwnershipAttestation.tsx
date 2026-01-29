'use client';

import { getAttestationText } from '@/config/legal-attestation';

interface OwnershipAttestationProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  countryCode?: string;
  listingType?: 'sale' | 'rental';
  disabled?: boolean;
}

/**
 * Legal Ownership Attestation Component
 *
 * Displays country-specific legal language that users must agree to
 * before submitting a property listing. This provides legal protection
 * for Portal HomeHub and creates a deterrent against fraudulent listings.
 */
export default function OwnershipAttestation({
  checked,
  onChange,
  countryCode = 'GY',
  listingType = 'sale',
  disabled = false
}: OwnershipAttestationProps) {
  const attestation = getAttestationText(countryCode);
  const listingAction = listingType === 'rental' ? 'list this property for rental' : 'list this property for sale';

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="mt-1 h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer disabled:cursor-not-allowed"
          required
        />
        <div className="text-sm text-gray-700">
          <p className="font-semibold mb-2">{attestation.title}</p>
          <ul className="list-disc list-inside space-y-1 mb-3">
            {attestation.bulletPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
          <p className="text-gray-600 mb-2">
            {attestation.legalWarning}
          </p>
          <p className="text-gray-600 mb-2">
            {attestation.consentText}
          </p>
          <p className="text-gray-600">
            {attestation.usJurisdictionText}
          </p>
        </div>
      </label>
    </div>
  );
}

/**
 * Compact version for use in multi-step forms
 * with less vertical space
 */
export function OwnershipAttestationCompact({
  checked,
  onChange,
  countryCode = 'GY',
  listingType = 'sale',
  disabled = false
}: OwnershipAttestationProps) {
  const attestation = getAttestationText(countryCode);

  return (
    <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
      <h3 className="font-medium text-red-900 mb-3 flex items-center gap-2">
        <span className="text-lg">&#9878;</span> Legal Attestation Required
      </h3>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-5 h-5 mt-1 text-red-600 rounded focus:ring-2 focus:ring-red-500 cursor-pointer disabled:cursor-not-allowed"
          required
        />
        <div className="text-sm text-red-900">
          <p className="font-semibold mb-2">{attestation.title}</p>
          <ul className="list-disc list-inside space-y-1 mb-2 text-red-800">
            {attestation.bulletPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
          <p className="text-xs text-red-700 leading-relaxed">
            {attestation.legalWarning} {attestation.consentText} {attestation.usJurisdictionText}
          </p>
        </div>
      </label>
    </div>
  );
}

/**
 * Full-page version with prominent styling
 * Used in the final step before submission
 */
export function OwnershipAttestationFull({
  checked,
  onChange,
  countryCode = 'GY',
  listingType = 'sale',
  disabled = false
}: OwnershipAttestationProps) {
  const attestation = getAttestationText(countryCode);

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">&#9878;</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-red-900">Legal Ownership Attestation</h3>
          <p className="text-sm text-red-700">Required before submission</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-5 mb-4 border border-red-200">
        <p className="font-semibold text-gray-900 mb-3">{attestation.title}</p>
        <ul className="space-y-2 mb-4">
          {attestation.bulletPoints.map((point, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-green-600 font-bold">&#10003;</span>
              <span className="text-gray-800">{point}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-3 text-sm text-gray-700">
          <p className="bg-amber-50 p-3 rounded border-l-4 border-amber-400">
            <strong className="text-amber-800">Criminal Liability:</strong> {attestation.legalWarning}
          </p>
          <p className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
            <strong className="text-blue-800">Law Enforcement:</strong> {attestation.consentText}
          </p>
          <p className="bg-purple-50 p-3 rounded border-l-4 border-purple-400">
            <strong className="text-purple-800">US Jurisdiction:</strong> {attestation.usJurisdictionText}
          </p>
        </div>
      </div>

      <label className="flex items-center gap-4 cursor-pointer p-4 bg-white rounded-lg border-2 border-dashed border-red-300 hover:border-red-400 transition-colors">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-6 h-6 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer disabled:cursor-not-allowed"
          required
        />
        <span className="text-base font-medium text-gray-900">
          I have read, understand, and agree to the above attestation
        </span>
      </label>
    </div>
  );
}
