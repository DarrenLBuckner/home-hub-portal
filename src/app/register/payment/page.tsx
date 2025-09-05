"use client";
import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

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
      setShowTimeoutModal(true);
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
      setShowTimeoutModal(true);
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
    setShowTimeoutModal(false);
    
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
    setTimeoutActive(false);
    setCountdown(0);
    setShowTimeoutModal(false);
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
        {showForm && !success && !timeoutActive && (
          <CardElement className="border rounded-lg p-3" options={{ hidePostalCode: true }} />
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
