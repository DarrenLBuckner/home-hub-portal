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
        };
      };
    };
    Views: {};
    Functions: {};
  };
}

// Export type for importing elsewhere
export type { Database as default };