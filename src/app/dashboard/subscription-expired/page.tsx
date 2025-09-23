"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  user_type: string;
  subscription_status: string;
  subscription_plan?: string;
  subscription_expires?: string;
}

export default function SubscriptionExpiredPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      // Get user profile to check subscription details
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        
        // If subscription is actually active, redirect to appropriate dashboard
        if (profileData.subscription_status === 'active') {
          const dashboardPath = profileData.user_type === 'fsbo' ? '/dashboard/fsbo' : 
                               profileData.user_type === 'landlord' ? '/dashboard/landlord' :
                               profileData.user_type === 'agent' ? '/dashboard/agent' : '/dashboard';
          window.location.href = dashboardPath;
          return;
        }
      }

      setUser(authUser);
      setLoading(false);
    }

    checkAuth();
  }, []);

  const getStatusMessage = () => {
    if (!profile) return "Subscription Required";
    
    switch (profile.subscription_status) {
      case 'inactive':
        return "Subscription Required";
      case 'expired':
        return "Subscription Expired";
      case 'payment_failed':
        return "Payment Failed";
      default:
        return "Subscription Issue";
    }
  };

  const getStatusDescription = () => {
    if (!profile) return "You need an active subscription to access this feature.";
    
    switch (profile.subscription_status) {
      case 'inactive':
        return "You need an active subscription to create property listings. Choose a plan below to get started.";
      case 'expired':
        return `Your subscription expired${profile.subscription_expires ? ` on ${new Date(profile.subscription_expires).toLocaleDateString()}` : ''}. Renew now to continue creating listings.`;
      case 'payment_failed':
        return "Your last payment failed. Please update your payment method and try again.";
      default:
        return "There's an issue with your subscription. Please contact support or renew your subscription.";
    }
  };

  const getUserTypeDisplayName = () => {
    if (!profile) return "User";
    
    switch (profile.user_type) {
      case 'fsbo':
        return 'FSBO Seller';
      case 'landlord':
        return 'Landlord';
      case 'agent':
        return 'Agent';
      default:
        return 'User';
    }
  };

  const getSubscriptionPlans = () => {
    if (!profile) return [];
    
    switch (profile.user_type) {
      case 'fsbo':
        return [
          {
            name: 'Basic Listing',
            price: 'G$9,900',
            duration: '90 days',
            features: ['List one property', 'Basic analytics', 'Email support'],
            plan: 'basic'
          },
          {
            name: 'Premium Listing',
            price: 'G$19,900',
            duration: '90 days',
            features: ['List one property', 'Featured placement', 'Advanced analytics', 'Priority support'],
            plan: 'premium',
            popular: true
          }
        ];
      case 'landlord':
        return [
          {
            name: 'Basic Rental',
            price: 'G$7,900',
            duration: '60 days',
            features: ['List one rental', 'Rental tools', 'Email support'],
            plan: 'basic'
          },
          {
            name: 'Pro Rental',
            price: 'G$14,900',
            duration: '60 days',
            features: ['List one rental', 'Featured placement', 'Tenant screening', 'Lease templates'],
            plan: 'premium',
            popular: true
          }
        ];
      case 'agent':
        return [
          {
            name: 'Agent Basic',
            price: 'G$99/month',
            duration: 'Monthly',
            features: ['25 listings', 'Basic analytics', 'Email support'],
            plan: 'basic'
          },
          {
            name: 'Agent Pro',
            price: 'G$199/month',
            duration: 'Monthly',
            features: ['100 listings', 'Featured listings', 'Advanced analytics', 'Priority support'],
            plan: 'premium',
            popular: true
          }
        ];
      default:
        return [];
    }
  };

  const handleRenewSubscription = (plan: string) => {
    // Store plan selection and redirect to payment
    sessionStorage.setItem('renewalPlan', plan);
    sessionStorage.setItem('renewalUserType', profile?.user_type || '');
    router.push('/register/payment');
  };

  const handleContactSupport = () => {
    const whatsappNumber = "5927059857";
    const message = `Hi, I need help with my subscription. User: ${profile?.first_name} ${profile?.last_name}, Email: ${user?.email}, Status: ${profile?.subscription_status}`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  const plans = getSubscriptionPlans();

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <img src="/images/PHH Logo.png" alt="Portal Home Hub Logo" className="h-12 mr-3" />
            <span className="text-2xl font-extrabold text-blue-700 tracking-tight">Portal Home Hub</span>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{getStatusMessage()}</h1>
            <p className="text-lg text-gray-600 mb-6">{getStatusDescription()}</p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Account:</strong> {profile?.first_name} {profile?.last_name} ({getUserTypeDisplayName()})
                <br />
                <strong>Current Status:</strong> {profile?.subscription_status || 'Unknown'}
                {profile?.subscription_expires && (
                  <>
                    <br />
                    <strong>Expired:</strong> {new Date(profile.subscription_expires).toLocaleDateString()}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        {plans.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Choose Your Plan</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {plans.map((plan, index) => (
                <div key={index} className={`bg-white rounded-xl shadow-lg p-6 relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="text-3xl font-bold text-blue-600 mb-1">{plan.price}</div>
                    <div className="text-sm text-gray-500">{plan.duration}</div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={() => handleRenewSubscription(plan.plan)}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      plan.popular 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {profile?.subscription_status === 'expired' ? 'Renew Now' : 'Subscribe Now'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Support Options */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-6">
            Having trouble with your subscription? Our support team is here to help.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleContactSupport}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              Contact Support on WhatsApp
            </button>
            
            <Link href="/dashboard">
              <button className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Questions? Email us at support@portalhomehub.com</p>
        </div>
      </div>
    </main>
  );
}