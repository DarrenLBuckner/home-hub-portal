// src/types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name?: string | null;
          user_type: 'agent' | 'buyer' | 'seller' | 'admin';
          phone_number?: string | null;
          profile_image_url?: string | null;
          is_verified: boolean;
          agent_tier?: 'basic' | 'pro' | 'elite' | null;
          created_at: string;
          last_login?: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          user_type: 'agent' | 'buyer' | 'seller' | 'admin';
          phone_number?: string | null;
          profile_image_url?: string | null;
          is_verified?: boolean;
          agent_tier?: 'basic' | 'pro' | 'elite' | null;
          created_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          user_type?: 'agent' | 'buyer' | 'seller' | 'admin';
          phone_number?: string | null;
          profile_image_url?: string | null;
          is_verified?: boolean;
          agent_tier?: 'basic' | 'pro' | 'elite' | null;
          created_at?: string;
          last_login?: string | null;
        };
      };
      properties: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description?: string | null;
          price: number;
          property_type: 'residential' | 'commercial' | 'land';
          listing_type: 'sale' | 'rent';
          status: 'draft' | 'active' | 'pending' | 'sold' | 'rented';
          bedrooms?: number | null;
          bathrooms?: number | null;
          square_meters?: number | null;
          address?: string | null;
          city?: string | null;
          region?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          price: number;
          property_type: 'residential' | 'commercial' | 'land';
          listing_type: 'sale' | 'rent';
          status?: 'draft' | 'active' | 'pending' | 'sold' | 'rented';
          bedrooms?: number | null;
          bathrooms?: number | null;
          square_meters?: number | null;
          address?: string | null;
          city?: string | null;
          region?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          price?: number;
          property_type?: 'residential' | 'commercial' | 'land';
          listing_type?: 'sale' | 'rent';
          status?: 'draft' | 'active' | 'pending' | 'sold' | 'rented';
          bedrooms?: number | null;
          bathrooms?: number | null;
          square_meters?: number | null;
          address?: string | null;
          city?: string | null;
          region?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add other tables here
    };
    Views: {};
    Functions: {};
  };
}

// Export type for importing elsewhere
export type { Database as default };