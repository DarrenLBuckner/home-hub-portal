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
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
        };
      };
      properties: {
        Row: {
            id: string;
            title: string;
            description: string;
            price: number;
            property_type: string;
            status: string;
            location: string;
            bedrooms: number;
            bathrooms: number;
            square_footage: number;
            features: string[];
            images: string[];
            listing_type: string;
            created_at: string;
            updated_at: string;
            property_category: 'residential' | 'commercial';
            commercial_type: string | null;
            floor_size_sqft: number | null;
            building_floor: string | null;
            number_of_floors: number | null;
            parking_spaces: number | null;
            loading_dock: boolean;
            elevator_access: boolean;
            commercial_garage_entrance: boolean;
            climate_controlled: boolean;
            lease_term_years: number | null;
            lease_type: string | null;
            financing_available: boolean;
            financing_details: string | null;
        };
        Insert: {
            id?: string;
            title: string;
            description?: string;
            price: number;
            property_type?: string;
            status?: string;
            location?: string;
            bedrooms?: number;
            bathrooms?: number;
            square_footage?: number;
            features?: string[];
            images?: string[];
            listing_type?: string;
            created_at?: string;
            updated_at?: string;
            property_category?: 'residential' | 'commercial';
            commercial_type?: string | null;
            floor_size_sqft?: number | null;
            building_floor?: string | null;
            number_of_floors?: number | null;
            parking_spaces?: number | null;
            loading_dock?: boolean;
            elevator_access?: boolean;
            commercial_garage_entrance?: boolean;
            climate_controlled?: boolean;
            lease_term_years?: number | null;
            lease_type?: string | null;
            financing_available?: boolean;
            financing_details?: string | null;
        };
        Update: {
            id?: string;
            title?: string;
            description?: string;
            price?: number;
            property_type?: string;
            status?: string;
            location?: string;
            bedrooms?: number;
            bathrooms?: number;
            square_footage?: number;
            features?: string[];
            images?: string[];
            listing_type?: string;
            created_at?: string;
            updated_at?: string;
            property_category?: 'residential' | 'commercial';
            commercial_type?: string | null;
            floor_size_sqft?: number | null;
            building_floor?: string | null;
            number_of_floors?: number | null;
            parking_spaces?: number | null;
            loading_dock?: boolean;
            elevator_access?: boolean;
            commercial_garage_entrance?: boolean;
            climate_controlled?: boolean;
            lease_term_years?: number | null;
            lease_type?: string | null;
            financing_available?: boolean;
            financing_details?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
  };
}

// Export type for importing elsewhere
export type { Database as default };