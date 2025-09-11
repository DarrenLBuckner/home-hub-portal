"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/supabase";
import PublicNavBar from "./PublicNavBar";
import BackendNavBar from "./BackendNavBar";

type UserType = "agent" | "landlord" | "fsbo" | "admin" | "super_admin";

export default function AuthNavBar() {
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Get user profile to determine type
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserType(profile.user_type as UserType);
        }
      }
      
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, !!session?.user);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserType(null);
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        // Small delay to ensure session is fully established
        setTimeout(() => {
          getUser();
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    // Simple loading navbar
    return (
      <nav className="bg-blue-900 text-white px-4 py-3 flex justify-between items-center shadow-md w-full">
        <div className="font-bold text-lg">Portal Home Hub</div>
        <div>Loading...</div>
      </nav>
    );
  }

  // Show backend navbar for authenticated users, public navbar for everyone else
  if (user && userType) {
    return <BackendNavBar userType={userType} />;
  } else {
    return <PublicNavBar />;
  }
}