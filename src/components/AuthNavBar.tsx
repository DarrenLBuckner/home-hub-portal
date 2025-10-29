"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/supabase";
import PortalMarketingNav from "./PortalMarketingNav";
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      console.log('🔄 Auth state change:', event, !!session?.user);
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        console.log('👋 User signed out, clearing state');
        setUser(null);
        setUserType(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('👤 User signed in:', session.user.email);
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
    return <PortalMarketingNav />;
  }

  // Show backend navbar for authenticated users, marketing navbar for logged-out users
  if (user && userType) {
    return <BackendNavBar userType={userType} />;
  } else {
    return <PortalMarketingNav />;
  }
}