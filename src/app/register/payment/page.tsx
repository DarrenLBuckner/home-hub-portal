"use client";
import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface BankTransferData {
  reference_code: string;
  amount_gyd: number;
  amount_display: string;
  expires_at: string;
  bank_details: {
    bank_name: string;
    account_name: string;
    account_number: string;
    routing_number: string;
    swift_code: string;
    branch: string;
  };
}

function EnterprisePaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(true);
  // Removed timeout functionality to prevent React errors
  const [timeoutActive] = useState(false);
  const [countdown] = useState(0);
  const [showTimeoutModal] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
  const [bankTransferData, setBankTransferData] = useState<BankTransferData | null>(null);
  const [copied, setCopied] = useState<string>('');
  const [loadingBankTransfer, setLoadingBankTransfer] = useState(false);

  // Load registration data from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('fsboRegistration');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRegistrationData(parsed);
      } else {
        // Redirect if no registration data
        if (typeof window !== 'undefined') {
          window.location.href = '/register/fsbo';
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
    basic: 420,
    extended: 420, // TEST: Set to $2 USD for testing
    premium: 420,  // TEST: Set to $2 USD for testing
  };
  const amount = planAmounts[plan];
  const email = registrationData.email;

  // Handle bank transfer selection
  const handleBankTransferSelection = async () => {
    if (paymentMethod === 'bank_transfer' && !bankTransferData) {
      setLoadingBankTransfer(true);
      try {
        const response = await fetch('/api/payment/bank-transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount_gyd: amount,
            plan_type: plan
          })
        });
        
        const data = await response.json();
        if (response.ok) {
          setBankTransferData(data);
          // Store for success page
          sessionStorage.setItem('bankTransferReference', data.reference_code);
        } else {
          setError(data.error || 'Failed to setup bank transfer');
        }
      } catch (error) {
        setError('Network error. Please try again.');
      } finally {
        setLoadingBankTransfer(false);
      }
    }
  };

  useEffect(() => {
    handleBankTransferSelection();
  }, [paymentMethod]);

  // Copy to clipboard function
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  // WhatsApp support for bank transfer
  const handleBankTransferNotification = () => {
    const referenceCode = bankTransferData?.reference_code || '';
    const amount = bankTransferData?.amount_display || '';
    const message = encodeURIComponent(
      `Portal Home Hub Payment Notification: I have completed a bank transfer for ${amount} with reference code ${referenceCode}. Please verify my payment.`
    );
    const whatsappUrl = `https://wa.me/5927059857?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  // Timeout logic temporarily disabled to prevent React errors
  // TODO: Re-implement timeout functionality after fixing React issues

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    // Call backend to create PaymentIntent
    const res = await fetch("/api/payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, email, plan }), // TODO: use real email
    });
    const data = await res.json();
    if (!res.ok || !data.clientSecret) {
      setError(data.error || "Payment setup failed");
      setIsLoading(false);
      setShowForm(false); // Hide card info
      // Timeout functionality removed
      return;
    }
    // Confirm card payment
    const result = await stripe?.confirmCardPayment(data.clientSecret, {
      payment_method: {
        card: elements?.getElement(CardElement)!,
      },
    });
    if (result?.error) {
      setError(result.error.message || "Payment failed. Please contact your bank or try another payment method.");
      setIsLoading(false);
      setShowForm(false); // Hide card info
      // Timeout functionality removed
      return;
    }
    
    // Store payment success and redirect
    sessionStorage.setItem('paymentSuccess', JSON.stringify({
      userId: registrationData.userId,
      plan: plan,
      paymentIntentId: result?.paymentIntent?.id
    }));
    
    setSuccess(true);
    setIsLoading(false);
    setShowForm(false); // Hide card info
    // Timeout functionality removed
    
    // Redirect to payment success page after a brief delay
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/payment-success';
      }
    }, 2000);
  }

  function handleRetry() {
    setError("");
    setShowForm(true);
    // Timeout functionality removed
  }

  // WhatsApp support link
  const whatsappNumber = "5927059857";
  const whatsappMsg = encodeURIComponent("May PortalHomeHub Message: I need help with my payment.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-center mb-6">
        <img src="/images/PHH Logo.png" alt="Portal Home Hub Logo" className="h-12 mr-3" />
        <span className="text-2xl font-extrabold text-blue-700 tracking-tight">Portal Home Hub</span>
      </div>
      <h1 className="text-3xl font-bold mb-2 text-center">Secure Payment</h1>
      <p className="mb-4 text-center text-gray-700">Pay with confidence. Your payment is encrypted and processed securely by Stripe.</p>
      <div className="bg-white border rounded-xl shadow-lg p-6">
        <div className="mb-4">
          <span className="font-semibold text-lg text-blue-700">Selected Plan:</span> <span className="font-bold text-orange-600">{plan.charAt(0).toUpperCase() + plan.slice(1)} Listing</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold text-lg text-blue-700">Amount:</span> <span className="font-bold text-green-600">G${amount.toLocaleString()} GYD</span>
        </div>
        
        {/* Payment Method Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Choose Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">💳</div>
              <div className="font-medium">Credit/Debit Card</div>
              <div className="text-xs text-gray-500">Instant processing via Stripe</div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('bank_transfer')}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                paymentMethod === 'bank_transfer'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">🏦</div>
              <div className="font-medium">Bank Transfer</div>
              <div className="text-xs text-gray-500">Transfer from any bank</div>
            </button>
          </div>
        </div>

        {/* Card Payment Form */}
        {paymentMethod === 'card' && showForm && !success && !timeoutActive && (
          <CardElement className="border rounded-lg p-3" options={{ hidePostalCode: true }} />
        )}

        {/* Bank Transfer Details */}
        {paymentMethod === 'bank_transfer' && (
          <div className="space-y-4">
            {loadingBankTransfer ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Setting up bank transfer...</p>
              </div>
            ) : bankTransferData ? (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                {/* Reference Code */}
                <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-800 mb-2">Your Payment Reference Code</h3>
                  <div className="flex items-center justify-between bg-white rounded p-3 border border-blue-300">
                    <span className="font-mono text-xl font-bold text-blue-600">{bankTransferData.reference_code}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bankTransferData.reference_code, 'reference')}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      {copied === 'reference' ? '✅ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">Include this code in your transfer description/memo</p>
                </div>

                {/* Bank Details */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3">Transfer To:</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-600">Bank:</span>
                      <span className="font-semibold">{bankTransferData.bank_details.bank_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-600">Account Name:</span>
                      <span className="font-semibold">{bankTransferData.bank_details.account_name}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="font-medium text-gray-600">Account Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{bankTransferData.bank_details.account_number}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(bankTransferData.bank_details.account_number, 'account')}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-colors"
                        >
                          {copied === 'account' ? '✅' : '📋'}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-600">Branch:</span>
                      <span className="font-semibold">{bankTransferData.bank_details.branch}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-600">SWIFT Code:</span>
                      <span className="font-mono font-semibold">{bankTransferData.bank_details.swift_code}</span>
                    </div>
                  </div>
                </div>

                {/* Amount to Transfer */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-bold text-green-800 mb-2">Amount to Transfer</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600">{bankTransferData.amount_display}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bankTransferData.amount_gyd.toString(), 'amount')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      {copied === 'amount' ? '✅ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <p className="text-sm text-green-700 mt-1">Transfer exactly this amount</p>
                </div>

                {/* Instructions */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-bold text-orange-800 mb-2">Important Instructions</h3>
                  <ul className="space-y-1 text-sm text-orange-700">
                    <li>• Include reference code <strong>{bankTransferData.reference_code}</strong> in transfer memo</li>
                    <li>• Transfer the exact amount: <strong>{bankTransferData.amount_display}</strong></li>
                    <li>• Complete transfer within 24 hours</li>
                    <li>• Click "Notify us after payment" below once completed</li>
                  </ul>
                </div>

                {/* WhatsApp Notification Button */}
                <button
                  type="button"
                  onClick={handleBankTransferNotification}
                  className="w-full py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span>💬</span> Notify us after payment (WhatsApp)
                </button>
              </div>
            ) : (
              <div className="text-center py-4 text-red-600">
                Failed to load bank transfer details. Please try again.
              </div>
            )}
          </div>
        )}

        {timeoutActive && !success && (
          <div className="text-orange-600 font-bold text-center mt-4">
            Are you still there? Card info will be cleared in {countdown} seconds.<br />
            <button type="button" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded" onClick={handleRetry}>I'm still here</button>
          </div>
        )}
      </div>
      {error && (
        <div className="text-red-500 text-sm font-semibold animate-shake">
          {error}<br />
          <button type="button" className="mt-2 px-4 py-2 bg-orange-500 text-white rounded" onClick={handleRetry}>Try another payment method</button>
        </div>
      )}
      {success ? (
        <div className="text-green-600 font-bold text-lg text-center">Payment successful! Thank you for your purchase.</div>
      ) : paymentMethod === 'bank_transfer' ? (
        <div className="text-center text-gray-600">
          <p className="text-sm">Complete your bank transfer using the details above.</p>
          <p className="text-sm font-medium mt-1">Verification usually takes 1-2 business hours after transfer.</p>
        </div>
      ) : (
        showForm && !timeoutActive && (
          <button
            type="submit"
            disabled={!stripe || isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-green-400 to-orange-400 text-white font-bold text-lg shadow-lg transition-all duration-200 hover:scale-105"
          >
            {isLoading ? "Processing..." : "Pay Now"}
          </button>
        )
      )}
      <div className="mt-4 text-center text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3zm0 0c0-1.657-1.343-3-3-3s-3 1.343-3 3 1.343 3 3 3 3-1.343 3-3zm0 8v-2m0-12V3m0 0a9 9 0 110 18 9 9 0 010-18z" /></svg>
          Payments are processed securely by Stripe.
        </span>
      </div>
      {/* Timeout Modal */}
      {showTimeoutModal && !success && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-orange-600 mb-4">Session Expired</h2>
            <p className="mb-4 text-gray-700">Your session expired for security. Ready to complete your payment?</p>
            <button type="button" className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-green-400 to-orange-400 text-white font-bold text-lg shadow-lg mb-4" onClick={handleRetry}>
              Resume Payment
            </button>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full block py-3 rounded-xl bg-green-500 text-white font-bold text-lg shadow-lg mb-2">
              Chat with Support on WhatsApp
            </a>
            <div className="text-xs text-gray-500 mt-2">We’re here to help! Contact support or chat with us for assistance.</div>
          </div>
        </div>
      )}
    </form>
  );
}

export default function PaymentPage() {
  if (!stripePublicKey) {
    return (
      <main className="max-w-xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Configuration Error</h1>
        <p className="text-gray-700">Payment system is not properly configured. Please contact support.</p>
        <a href="https://wa.me/5927059857?text=Payment%20configuration%20error" className="mt-4 inline-block px-4 py-2 bg-green-500 text-white rounded">
          Contact Support
        </a>
      </main>
    );
  }

  if (!stripePromise) {
    return (
      <main className="max-w-xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Loading Error</h1>
        <p className="text-gray-700">Failed to load payment system. Please refresh and try again.</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Refresh Page
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto py-12 px-4">
      <Elements stripe={stripePromise}>
        <EnterprisePaymentForm />
      </Elements>
    </main>
  );
}
