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
          router.push("/dashboard/fsbo");
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
          <Link href="/dashboard/fsbo">
            <button className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition">Continue to Dashboard</button>
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-lg text-gray-700">Thank you for your payment. Your FSBO account is now active and you can begin listing your property.</p>
          <div className="mb-8">
            <Link href="/dashboard/fsbo">
              <button className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition">Go to Dashboard</button>
            </Link>
          </div>
        </>
      )}
      
      <div className="text-sm text-gray-500">If you have any questions, <a href="https://wa.me/5927059857?text=May%20PortalHomeHub%20Message:%20I%20need%20help%20with%20my%20account." target="_blank" rel="noopener noreferrer" className="text-green-600 underline">contact support on WhatsApp</a>.</div>
    </main>
  );
}
