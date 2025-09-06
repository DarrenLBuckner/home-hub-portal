"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pendingProperties, setPendingProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAuthAndFetchData() {
      setLoading(true);
      const supabase = createClient();
      
      try {
        // Check authentication and user type
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/login');
          return;
        }

        // Check if user is admin using admin_users table
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        if (!adminUser) {
          // Check profiles table to redirect to correct dashboard
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', authUser.id)
            .single();
            
          const userDashboard = profile?.user_type === 'agent' ? '/dashboard/agent' :
                               profile?.user_type === 'fsbo' ? '/dashboard/fsbo' :
                               profile?.user_type === 'landlord' ? '/dashboard/landlord' :
                               '/login';
          router.push(userDashboard);
          return;
        }

      setUser(authUser);

      // Fetch pending properties
      const { data, error } = await supabase.from("properties").select("*, profiles(email)").eq("status", "pending");
      if (error) setError(error.message);
      setPendingProperties(data || []);
      } catch (error) {
        console.error('Error in admin dashboard:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    
    checkAuthAndFetchData();
  }, [router]);

  async function handleAction(id: string, action: "approve" | "reject") {
    setLoading(true);
    const supabase = createClient();
    const status = action === "approve" ? "approved" : "rejected";
    const { error } = await supabase.from("properties").update({ status }).eq("id", id);
    if (error) setError(error.message);
    // Trigger notification to user via API route
    const property = pendingProperties.find(p => p.id === id);
    if (property && property.profiles?.email) {
      await fetch("/api/admin/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: property.profiles.email,
          propertyTitle: property.title,
          action,
        }),
      });
    }
    setPendingProperties(pendingProperties.filter(p => p.id !== id));
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Property Approvals</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <ul>
        {(pendingProperties || []).map(property => (
          <li key={property.id} className="border p-4 mb-4 rounded-lg">
            <h2 className="text-xl font-semibold">{property.title}</h2>
            <p>{property.description}</p>
            <p><strong>Owner:</strong> {property.profiles?.email}</p>
            <button className="bg-green-500 text-white px-4 py-2 rounded mr-2" onClick={() => handleAction(property.id, "approve")}>Approve</button>
            <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => handleAction(property.id, "reject")}>Reject</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
import ApplicationList from "./components/ApplicationList";

// Removed duplicate AdminDashboard function
