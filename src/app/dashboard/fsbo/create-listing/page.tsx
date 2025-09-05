"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CreateFSBOListing() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      // Check if user is FSBO
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, subscription_status')
        .eq('id', authUser.id)
        .single();

      if (!profile || profile.user_type !== 'fsbo') {
        window.location.href = '/dashboard';
        return;
      }

      setUser(authUser);
      setLoading(false);
    }

    checkAuth();
  }, []);

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-6">
        <Link href="/dashboard/fsbo" className="text-blue-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-orange-700 mb-6">Create New Property Listing</h1>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Choose Your Listing Plan</h2>
          <p className="text-gray-600 mb-4">
            Select a plan for your property listing. Each property requires its own payment.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Basic Plan */}
          <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition">
            <h3 className="text-lg font-semibold text-orange-600 mb-2">Basic</h3>
            <div className="text-2xl font-bold mb-2">$25</div>
            <div className="text-sm text-gray-500 mb-4">30 days</div>
            <ul className="text-sm space-y-2 mb-4">
              <li>✓ Basic property listing</li>
              <li>✓ Up to 5 photos</li>
              <li>✓ Contact information display</li>
              <li>✓ 30-day listing duration</li>
            </ul>
            <Link href="/properties/create?plan=basic">
              <button className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition">
                Select Basic
              </button>
            </Link>
          </div>

          {/* Premium Plan */}
          <div className="border-2 border-orange-500 rounded-lg p-6 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
              Most Popular
            </div>
            <h3 className="text-lg font-semibold text-orange-600 mb-2">Premium</h3>
            <div className="text-2xl font-bold mb-2">$50</div>
            <div className="text-sm text-gray-500 mb-4">60 days</div>
            <ul className="text-sm space-y-2 mb-4">
              <li>✓ Featured property listing</li>
              <li>✓ Up to 15 photos</li>
              <li>✓ Virtual tour support</li>
              <li>✓ Priority in search results</li>
              <li>✓ 60-day listing duration</li>
              <li>✓ Social media promotion</li>
            </ul>
            <Link href="/properties/create?plan=premium">
              <button className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition">
                Select Premium
              </button>
            </Link>
          </div>

          {/* Elite Plan */}
          <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition">
            <h3 className="text-lg font-semibold text-orange-600 mb-2">Elite</h3>
            <div className="text-2xl font-bold mb-2">$100</div>
            <div className="text-sm text-gray-500 mb-4">90 days</div>
            <ul className="text-sm space-y-2 mb-4">
              <li>✓ Premium listing features</li>
              <li>✓ Unlimited photos</li>
              <li>✓ Professional photography tips</li>
              <li>✓ Marketing consultation</li>
              <li>✓ 90-day listing duration</li>
              <li>✓ Extended social media promotion</li>
              <li>✓ Priority customer support</li>
            </ul>
            <Link href="/properties/create?plan=elite">
              <button className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition">
                Select Elite
              </button>
            </Link>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-3">What happens next?</h3>
          <ol className="text-sm space-y-2 text-gray-600">
            <li>1. Choose your plan and complete payment</li>
            <li>2. Fill out your property details and upload photos</li>
            <li>3. Your listing will be reviewed and published within 24 hours</li>
            <li>4. Start receiving inquiries from potential buyers</li>
          </ol>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team at{" "}
            <a href="mailto:support@guyanahomehub.com" className="text-orange-600 hover:underline">
              support@guyanahomehub.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}