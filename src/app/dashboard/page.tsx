"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function redirectToCorrectDashboard() {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
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
          admin: '/dashboard/admin',
          super_admin: '/dashboard/admin', // Super admin uses admin dashboard for now
          agent: '/dashboard/agent',
          fsbo: '/dashboard/fsbo',
          landlord: '/dashboard/landlord'
        };
        
        const redirectUrl = dashboardRoutes[profile.user_type as keyof typeof dashboardRoutes] || '/dashboard/agent';
        window.location.href = redirectUrl;
      } else {
        // No profile found - redirect to login
        window.location.href = '/login';
      }
    }

    redirectToCorrectDashboard();
  }, []);

  return (
    <main className="max-w-2xl mx-auto py-12 px-4 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
    </main>
  );
}