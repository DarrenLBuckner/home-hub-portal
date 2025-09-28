"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [activating, setActivating] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function activateAccount() {
      try {
        const paymentData = sessionStorage.getItem('paymentSuccess');
        if (!paymentData) {
          router.push('/register/fsbo');
          return;
        }

        const data = JSON.parse(paymentData);
        
        // Call activation API
        const response = await fetch('/api/users/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Account activation failed');
        }

        setActivating(false);
        
        // Clear session data
        sessionStorage.removeItem('fsboRegistration');
        sessionStorage.removeItem('paymentSuccess');
        
        // Auto-redirect after 3 seconds
        const timer = setTimeout(() => {
          router.push("/dashboard/owner");
        }, 3000);
        return () => clearTimeout(timer);
        
      } catch (error: any) {
        setError(error.message);
        setActivating(false);
      }
    }

    activateAccount();
  }, [router]);

  return (
    <main className="max-w-xl mx-auto py-12 px-4 text-center">
      <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
      
      {activating ? (
        <div className="mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Activating your account...</p>
        </div>
      ) : error ? (
        <div className="mb-6">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/dashboard/owner">
            <button className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition">Continue to Dashboard</button>
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-lg text-gray-700">Thank you for your payment. Your FSBO account is now active and you can begin listing your property.</p>
          <div className="mb-8">
            <Link href="/dashboard/owner">
              <button className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition">Go to Dashboard</button>
            </Link>
          </div>
        </>
      )}
      
      <div className="mt-6 flex flex-col items-center gap-3">
        <p className="text-sm text-gray-600">Need help with your account?</p>
        <a 
          href="https://wa.me/5927629797?text=Hi%20Portal%20Home%20Hub!%20I%20just%20completed%20payment%20and%20need%20help%20with%20my%20account." 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <span className="mr-2">💬</span>
          WhatsApp Support
        </a>
        <p className="text-xs text-gray-500">Instant support • +592 762-9797</p>
      </div>
    </main>
  );
}
