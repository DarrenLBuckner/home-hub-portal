"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { formatGYD, PRIMARY_BANK_DETAILS, SUPPORTED_BANKS } from '@/lib/bankConfig';

interface BankTransferResponse {
  reference_code: string;
  amount_gyd: number;
  amount_display: string;
  plan_type: string;
  expires_at: string;
  expires_in_hours: number;
  bank_details: any;
  payment_instructions: string[];
  user_info: {
    name: string;
    user_type: string;
  };
}

export default function BankTransferPaymentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [bankTransferData, setBankTransferData] = useState<BankTransferResponse | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copied, setCopied] = useState<string>('');

  // Load registration data from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('fsboRegistration') || 
                    sessionStorage.getItem('renewalPlan');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRegistrationData(parsed);
      } else {
        // Check if we have renewal data
        const renewalPlan = sessionStorage.getItem('renewalPlan');
        const renewalUserType = sessionStorage.getItem('renewalUserType');
        if (renewalPlan && renewalUserType) {
          setRegistrationData({
            plan: renewalPlan,
            user_type: renewalUserType,
            isRenewal: true
          });
        } else {
          // Redirect if no registration data
          if (typeof window !== 'undefined') {
            window.location.href = '/register/fsbo';
          }
        }
      }
    } catch (error) {
      console.error('Error loading registration data:', error);
      if (typeof window !== 'undefined') {
        window.location.href = '/register/fsbo';
      }
    }
  }, []);

  if (!registrationData) {
    return <div className="text-center py-12">Loading...</div>;
  }

  // Plan/amount mapping
  type PlanType = "basic" | "extended" | "premium";
  const plan: PlanType = registrationData.plan || "extended";
  const planAmounts: Record<PlanType, number> = {
    basic: 9900, // G$99
    extended: 19900, // G$199
    premium: 29900, // G$299
  };
  const amount = planAmounts[plan];

  const handleGenerateBankTransfer = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/payment/bank-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_gyd: amount,
          plan_type: plan,
          user_notes: `${registrationData.isRenewal ? 'Renewal' : 'New'} ${plan} plan payment`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate bank transfer');
      }

      setBankTransferData(data);
      setShowInstructions(true);

    } catch (error: any) {
      setError(error.message || 'Failed to generate bank transfer reference');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleBackToStripe = () => {
    router.push('/register/payment');
  };

  const handleContactSupport = () => {
    const whatsappNumber = "5927059857";
    const message = `Hi, I need help with bank transfer payment. Reference: ${bankTransferData?.reference_code || 'Not generated'}`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (showInstructions && bankTransferData) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src="/images/PHH Logo.png" alt="Portal Home Hub Logo" className="h-12 mr-3" />
              <span className="text-2xl font-extrabold text-blue-700 tracking-tight">Portal Home Hub</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank Transfer Payment</h1>
            <p className="text-lg text-gray-600">Complete your payment using bank transfer</p>
          </div>

          {/* Payment Summary */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Payment Summary</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p><strong>Plan:</strong> {plan.charAt(0).toUpperCase() + plan.slice(1)} Listing</p>
                <p><strong>Amount:</strong> {bankTransferData.amount_display}</p>
                <p><strong>Customer:</strong> {bankTransferData.user_info.name}</p>
              </div>
              <div>
                <p><strong>Reference Code:</strong> 
                  <span className="font-mono ml-2 bg-white px-2 py-1 rounded border">
                    {bankTransferData.reference_code}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(bankTransferData.reference_code, 'reference')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                    title="Copy reference code"
                  >
                    {copied === 'reference' ? '✓' : '📋'}
                  </button>
                </p>
                <p><strong>Expires:</strong> {new Date(bankTransferData.expires_at).toLocaleString()}</p>
                <p className="text-red-600 font-medium">⏰ Payment expires in {bankTransferData.expires_in_hours} hours</p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-green-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-green-900 mb-4">Bank Transfer Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                  <div className="flex items-center">
                    <span className="font-mono bg-white px-3 py-2 rounded border flex-1">
                      {bankTransferData.bank_details.bank_name}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(bankTransferData.bank_details.bank_name, 'bank')}
                      className="ml-2 text-green-600 hover:text-green-800"
                      title="Copy bank name"
                    >
                      {copied === 'bank' ? '✓' : '📋'}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Name</label>
                  <div className="flex items-center">
                    <span className="font-mono bg-white px-3 py-2 rounded border flex-1">
                      {bankTransferData.bank_details.account_name}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(bankTransferData.bank_details.account_name, 'account_name')}
                      className="ml-2 text-green-600 hover:text-green-800"
                      title="Copy account name"
                    >
                      {copied === 'account_name' ? '✓' : '📋'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Number</label>
                  <div className="flex items-center">
                    <span className="font-mono bg-white px-3 py-2 rounded border flex-1 text-lg font-bold">
                      {bankTransferData.bank_details.account_number}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(bankTransferData.bank_details.account_number, 'account_number')}
                      className="ml-2 text-green-600 hover:text-green-800"
                      title="Copy account number"
                    >
                      {copied === 'account_number' ? '✓' : '📋'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Branch</label>
                  <span className="block bg-white px-3 py-2 rounded border">
                    {bankTransferData.bank_details.branch}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Routing Number</label>
                  <div className="flex items-center">
                    <span className="font-mono bg-white px-3 py-2 rounded border flex-1">
                      {bankTransferData.bank_details.routing_number}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(bankTransferData.bank_details.routing_number, 'routing')}
                      className="ml-2 text-green-600 hover:text-green-800"
                      title="Copy routing number"
                    >
                      {copied === 'routing' ? '✓' : '📋'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">SWIFT Code</label>
                  <div className="flex items-center">
                    <span className="font-mono bg-white px-3 py-2 rounded border flex-1">
                      {bankTransferData.bank_details.swift_code}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(bankTransferData.bank_details.swift_code, 'swift')}
                      className="ml-2 text-green-600 hover:text-green-800"
                      title="Copy SWIFT code"
                    >
                      {copied === 'swift' ? '✓' : '📋'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-yellow-900 mb-4">⚠️ Important Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-yellow-800">
              {bankTransferData.payment_instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
            
            <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
              <p className="font-bold text-yellow-900">
                Critical: Use reference code "{bankTransferData.reference_code}" in your transfer memo/description
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                Without this reference code, we cannot automatically verify your payment.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleContactSupport}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              💬 Contact Support on WhatsApp
            </button>
            
            <button
              onClick={handleBackToStripe}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              💳 Pay with Card Instead
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Once you complete the transfer, our team will verify and activate your account within 24 hours.</p>
            <p className="mt-2">For immediate assistance, contact us on WhatsApp at +592-705-9857</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto py-12 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src="/images/PHH Logo.png" alt="Portal Home Hub Logo" className="h-12 mr-3" />
            <span className="text-2xl font-extrabold text-blue-700 tracking-tight">Portal Home Hub</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank Transfer Payment</h1>
          <p className="text-lg text-gray-600">Pay securely using your local bank</p>
        </div>

        {/* Plan Summary */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-blue-900 mb-3">Payment Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-blue-800">Selected Plan:</span>
              <span className="font-bold text-orange-600">{plan.charAt(0).toUpperCase() + plan.slice(1)} Listing</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-800">Amount:</span>
              <span className="font-bold text-green-600">{formatGYD(amount)}</span>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-green-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-green-900 mb-3">Why Choose Bank Transfer?</h3>
          <ul className="space-y-2 text-green-800">
            <li className="flex items-center">
              <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs mr-3">✓</span>
              No additional processing fees
            </li>
            <li className="flex items-center">
              <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs mr-3">✓</span>
              Use your existing bank account
            </li>
            <li className="flex items-center">
              <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs mr-3">✓</span>
              Secure local banking system
            </li>
            <li className="flex items-center">
              <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs mr-3">✓</span>
              24-hour verification process
            </li>
          </ul>
        </div>

        {/* Supported Banks */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">🏦 Supported Banks</h3>
          <p className="text-blue-800 text-sm mb-4">You can transfer from any of these Guyana banks:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SUPPORTED_BANKS.filter(bank => bank.popular).map((bank, index) => (
              <div key={index} className="flex items-center bg-white rounded-lg p-3 border border-blue-200">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-3">
                  🏦
                </div>
                <div>
                  <div className="font-medium text-blue-900 text-sm">{bank.name}</div>
                  <div className="text-xs text-blue-600">
                    {bank.online_banking && "💻 Online"} {bank.mobile_banking && "📱 Mobile"}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-blue-700 text-xs mt-3 text-center">
            + Other major Guyana banks also supported
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleGenerateBankTransfer}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold text-lg shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? "Generating Payment Reference..." : "Generate Bank Transfer Details"}
          </button>

          <button
            onClick={handleBackToStripe}
            className="w-full py-3 rounded-xl border-2 border-blue-600 text-blue-600 font-bold text-lg hover:bg-blue-50 transition-colors"
          >
            💳 Pay with Credit/Debit Card Instead
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Secure payments • No hidden fees • 24/7 support</p>
        </div>
      </div>
    </main>
  );
}