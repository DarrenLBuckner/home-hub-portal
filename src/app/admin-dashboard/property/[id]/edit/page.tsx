"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/supabase";
import { useAdminData } from "@/hooks/useAdminData";

export default function AdminPropertyEditPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { adminData, permissions, isAdmin, isLoading: adminLoading } = useAdminData();

  useEffect(() => {
    async function redirectToCorrectEditPage() {
      if (adminLoading) return;
      
      if (!isAdmin) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      try {
        const supabase = createClient();
        
        // Get property details to determine the user type
        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .select(`
            *,
            profiles!properties_user_id_fkey (
              user_type,
              email
            )
          `)
          .eq('id', propertyId)
          .single();

        if (propertyError || !property) {
          setError('Property not found or access denied.');
          return;
        }

        // Redirect to the appropriate edit page based on user type
        const userType = property.profiles?.user_type;
        
        let editUrl: string;
        
        switch (userType) {
          case 'agent':
            editUrl = `/dashboard/agent/edit-property/${propertyId}`;
            break;
          case 'landlord':
            editUrl = `/dashboard/landlord/edit-property/${propertyId}`;
            break;
          case 'owner':
            editUrl = `/dashboard/owner/edit-property/${propertyId}`;
            break;
          case 'fsbo':
            editUrl = `/dashboard/fsbo/edit-property/${propertyId}`;
            break;
          default:
            // Default to owner edit if user type is unclear
            editUrl = `/dashboard/owner/edit-property/${propertyId}`;
        }

        console.log(`Admin editing property: ${propertyId}, User type: ${userType}, Redirecting to: ${editUrl}`);
        
        // Add admin context parameter so the edit page knows it's being accessed by admin
        const urlWithAdminContext = `${editUrl}?admin_edit=true&return_to=/admin-dashboard/mobile`;
        
        router.push(urlWithAdminContext);
        
      } catch (error) {
        console.error('Error fetching property for admin edit:', error);
        setError('Error loading property. Please try again.');
      }
    }

    if (propertyId) {
      redirectToCorrectEditPage();
    }
  }, [propertyId, adminLoading, isAdmin, router]);

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property for editing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin-dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Back to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to property edit form...</p>
      </div>
    </div>
  );
}