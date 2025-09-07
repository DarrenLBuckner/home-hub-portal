'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugSupabase() {
  useEffect(() => {
    const testConnection = async () => {
      const supabase = createClient();
      
      console.log('=== SUPABASE DEBUG ===');
      
      // Test 1: Environment variables
      console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
      console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
      
      // Test 2: Authentication
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('Auth status:', user ? 'LOGGED IN' : 'NOT LOGGED IN');
        console.log('User ID:', user?.id);
        console.log('Auth error:', authError);
      } catch (err) {
        console.error('Auth test failed:', err);
      }
      
      // Test 3: Database connection
      try {
        const { data, error } = await supabase.from('properties').select('count').limit(1);
        console.log('Database connection:', error ? 'FAILED' : 'SUCCESS');
        console.log('Database error:', error);
      } catch (err) {
        console.error('Database test failed:', err);
      }
      
      // Test 4: RLS policies
      try {
        const { data, error } = await supabase
          .from('properties')
          .insert({
            title: 'TEST PROPERTY - DELETE ME',
            description: 'Test',
            price: 1,
            property_type: 'House',
            bedrooms: 1,
            bathrooms: 1,
            house_size_value: 1000,
            region: 'Test',
            city: 'Test',
            owner_email: 'test@test.com',
            listing_type: 'sale',
            listed_by_type: 'owner',
            status: 'draft'
          });
        
        console.log('Insert test:', error ? 'FAILED' : 'SUCCESS');
        console.log('Insert error:', error);
        
        if (data) {
          // Clean up test record
          await supabase.from('properties').delete().eq('id', data.id);
        }
      } catch (err) {
        console.error('Insert test failed:', err);
      }
      
      console.log('=== DEBUG COMPLETE ===');
    };
    
    testConnection();
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold mb-2">Debug Mode Active</h3>
      <p>Check browser console for detailed Supabase connection tests.</p>
    </div>
  );
}