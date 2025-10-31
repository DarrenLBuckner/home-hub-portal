const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkQumarProfile() {
  console.log('🔍 Checking Qumar\'s profile and property limits...');
  
  try {
    // Check Qumar's profile
    const { data: qumarProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'qumar@guyanahomehub.com')
      .single();
      
    if (profileError) {
      console.error('❌ Error finding Qumar profile:', profileError);
      return;
    }
    
    if (!qumarProfile) {
      console.log('⚠️ Qumar profile not found');
      return;
    }
    
    console.log('👤 Qumar Profile:', {
      id: qumarProfile.id,
      email: qumarProfile.email,
      user_type: qumarProfile.user_type,
      property_limit: qumarProfile.property_limit,
      country_id: qumarProfile.country_id,
      first_name: qumarProfile.first_name,
      last_name: qumarProfile.last_name
    });
    
    // Count Qumar's current properties
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('id, title, status, created_at')
      .eq('user_id', qumarProfile.id)
      .order('created_at', { ascending: false });
      
    if (propsError) {
      console.error('❌ Error fetching Qumar properties:', propsError);
      return;
    }
    
    console.log(`🏠 Qumar's Properties (${properties?.length || 0} total):`);
    
    if (properties && properties.length > 0) {
      const statusCounts = {};
      properties.forEach(prop => {
        statusCounts[prop.status] = (statusCounts[prop.status] || 0) + 1;
        console.log(`  ${prop.status}: "${prop.title}" (${prop.created_at})`);
      });
      
      console.log('📊 Properties by status:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
    } else {
      console.log('  No properties found');
    }
    
    // Check limits
    console.log('🎯 Property Limits Analysis:');
    console.log(`  Database property_limit: ${qumarProfile.property_limit}`);
    console.log(`  Current property count: ${properties?.length || 0}`);
    
    if (qumarProfile.property_limit === null) {
      console.log('  ✅ UNLIMITED - Super admin privileges');
    } else if (qumarProfile.property_limit > (properties?.length || 0)) {
      console.log(`  ✅ WITHIN LIMITS - Can create ${qumarProfile.property_limit - (properties?.length || 0)} more`);
    } else {
      console.log('  ❌ AT LIMIT - Cannot create more properties');
    }
    
    // Check admin registry detection
    const qumarEmail = 'qumar@guyanahomehub.com';
    const ADMIN_REGISTRY = {
      super: ['mrdarrenbuckner@gmail.com'],
      owner: ['qumar@guyanahomehub.com'],
      basic: []
    };
    
    const normalizedEmail = qumarEmail.toLowerCase().trim();
    let adminLevel = null;
    if (ADMIN_REGISTRY.super.includes(normalizedEmail)) adminLevel = 'super';
    else if (ADMIN_REGISTRY.owner.includes(normalizedEmail)) adminLevel = 'owner';
    else if (ADMIN_REGISTRY.basic.includes(normalizedEmail)) adminLevel = 'basic';
    
    console.log('🔍 Admin Registry Check:');
    console.log(`  Email: ${qumarEmail}`);
    console.log(`  Normalized: ${normalizedEmail}`);
    console.log(`  Admin Level: ${adminLevel || 'NOT ADMIN'}`);
    console.log(`  Is Eligible Admin: ${adminLevel === 'super' || adminLevel === 'owner'}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkQumarProfile();