import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PropertySuccessScreenProps {
  redirectPath?: string;
  redirectDelay?: number;
  userType?: 'agent' | 'landlord' | 'fsbo' | 'owner';
}

export default function PropertySuccessScreen({ 
  redirectPath = '/dashboard', 
  redirectDelay = 2000, // Reduced from 3000ms to 2000ms
  userType = 'agent'
}: PropertySuccessScreenProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(Math.ceil(redirectDelay / 1000));

  useEffect(() => {
    console.log('🔄 PropertySuccessScreen: Setting up redirect to:', redirectPath, 'in', redirectDelay, 'ms');
    
    const timer = setTimeout(() => {
      console.log('🔄 PropertySuccessScreen: Attempting redirect to:', redirectPath);
      try {
        router.push(redirectPath);
        console.log('✅ PropertySuccessScreen: Redirect initiated successfully');
      } catch (error) {
        console.error('❌ PropertySuccessScreen: Redirect failed:', error);
        // Fallback: try window.location as backup
        window.location.href = redirectPath;
      }
    }, redirectDelay);

    return () => {
      console.log('🧹 PropertySuccessScreen: Cleaning up redirect timer');
      clearTimeout(timer);
    };
  }, [router, redirectPath, redirectDelay]);

  // Countdown timer
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, []);

  const getUserTypeMessage = () => {
    switch (userType) {
      case 'agent':
        return "Your property has been submitted for review and will be visible to buyers once approved.";
      case 'landlord':
        return "Your rental property is now live and tenants can contact you via WhatsApp.";
      case 'fsbo':
        return "Your property listing is now active and buyers can contact you directly.";
      case 'owner':
        return "Your property has been submitted and will be reviewed by our team.";
      default:
        return "Your property has been successfully created and is now available.";
    }
  };

  const getNextSteps = () => {
    switch (userType) {
      case 'agent':
        return [
          "✅ Property submitted for admin review",
          "📧 You'll get email confirmation when approved",
          "📱 Buyers will contact you via WhatsApp",
          "📊 Track performance in your dashboard"
        ];
      case 'landlord':
        return [
          "✅ Property is now live on the platform",
          "📱 Tenants can contact you immediately",
          "💬 WhatsApp integration is active",
          "📊 Monitor inquiries in your dashboard"
        ];
      case 'fsbo':
        return [
          "✅ Property listing is now active",
          "📱 Direct buyer contact enabled",
          "🔍 Listed across all search results",
          "📊 Track views and inquiries"
        ];
      default:
        return [
          "✅ Property successfully created",
          "📧 Confirmation sent to your email",
          "📱 Contact information is active",
          "📊 Available in your dashboard"
        ];
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center">
        
        {/* Success Animation */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
            <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎉 Property Created!
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          {getUserTypeMessage()}
        </p>

        {/* Next Steps */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">What happens next:</h3>
          <div className="space-y-3 text-left">
            {getNextSteps().map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-emerald-500 font-semibold text-lg leading-none">{index + 1}.</span>
                <span className="text-gray-700">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Info Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">💬</span>
            <span className="font-semibold text-green-800">WhatsApp Integration Active</span>
          </div>
          <p className="text-sm text-green-700">
            Customers will contact you directly via WhatsApp when they're interested in your property.
          </p>
        </div>

        {/* Redirect Message with Timer */}
        <div className="flex items-center justify-center gap-3 text-gray-500 mb-4">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm">
            {countdown > 0 ? `Redirecting to your dashboard in ${countdown}s...` : 'Redirecting now...'}
          </span>
        </div>

        {/* Manual Navigation Button */}
        <button
          onClick={() => {
            console.log('🔄 Manual redirect button clicked, navigating to:', redirectPath);
            try {
              router.push(redirectPath);
            } catch (error) {
              console.error('❌ Manual redirect failed, using fallback:', error);
              window.location.href = redirectPath;
            }
          }}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          🏠 Go to Dashboard Now
        </button>

        {/* Support Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Need help?</p>
          <a 
            href="https://wa.me/5927629797?text=Hello!%20I%20just%20created%20a%20property%20and%20need%20help" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
          >
            <span>💬</span>
            WhatsApp Support: +592-762-9797
          </a>
        </div>
      </div>
    </div>
  );
}