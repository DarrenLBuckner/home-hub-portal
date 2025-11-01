"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function redirectToCorrectDashboard() {
      const supabase = createClient();
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Get user profile to determine correct dashboard
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (profile && profile.user_type) {
          // Redirect to appropriate dashboard based on user type
          const dashboardRoutes = {
            admin: '/admin-dashboard',
            super: '/admin-dashboard', // Super admin uses admin dashboard
            agent: '/dashboard/agent',
            owner: '/dashboard/owner',  // Points to renamed directory
            landlord: '/dashboard/landlord',  // DEBUG: landlord should go here
            fsbo: '/dashboard/fsbo'  // FSBO users go to FSBO dashboard
          };
          
          const redirectUrl = dashboardRoutes[profile.user_type as keyof typeof dashboardRoutes];
          
          if (!redirectUrl) {
            console.error('Unknown user type:', profile.user_type);
            router.push('/login');
            return;
          }
          router.push(redirectUrl);
        } else {
          // No profile found - redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Dashboard redirect error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    redirectToCorrectDashboard();
  }, [router]);

  return (
    <main className="max-w-2xl mx-auto py-12 px-4 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
    </main>
  );
}