#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkQumarDetailed() {
  console.log('🔍 DETAILED CHECK: Why can\'t Qumar create more properties?\n');

  const qumarEmail = 'qumar@guyanahomehub.com';
  
  // Get Qumar's user ID
  const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('❌ Auth error:', authError);
    return;
  }

  const qumarAuthUser = authUser?.users?.find(u => u.email === qumarEmail);
  if (!qumarAuthUser) {
    console.error('❌ Qumar not found in auth users');
    return;
  }

  const userId = qumarAuthUser.id;
  console.log(`👤 Qumar's User ID: ${userId}\n`);

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', qumarEmail)
    .single();

  if (profileError) {
    console.error('❌ Profile error:', profileError);
    return;
  }

  console.log('👤 PROFILE DETAILS:', {
    id: profile.id,
    email: profile.email,
    user_type: profile.user_type,
    property_limit: profile.property_limit,
    country_id: profile.country_id,
    created_at: profile.created_at,
    first_name: profile.first_name,
    last_name: profile.last_name
  });

  // Count properties by status
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id, title, status, created_at, listing_type, propertyCategory')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (propertiesError) {
    console.error('❌ Properties error:', propertiesError);
    return;
  }

  console.log('\n📊 PROPERTY BREAKDOWN:');
  const statusCounts = {};
  properties.forEach(prop => {
    statusCounts[prop.status] = (statusCounts[prop.status] || 0) + 1;
  });

  console.log('  Status counts:', statusCounts);

  // Count only "countable" properties (what the API counts)
  const countableProperties = properties.filter(p => ['active', 'pending', 'draft'].includes(p.status));
  console.log(`\n  COUNTABLE properties (active/pending/draft): ${countableProperties.length}`);
  console.log(`  Property limit: ${profile.property_limit}`);
  console.log(`  Remaining capacity: ${profile.property_limit - countableProperties.length}`);

  // Show recent properties
  console.log('\n📝 RECENT PROPERTIES (last 5):');
  properties.slice(0, 5).forEach((prop, i) => {
    console.log(`  ${i + 1}. [${prop.status}] "${prop.title.substring(0, 50)}..." (${prop.listing_type}/${prop.propertyCategory}) - ${prop.created_at}`);
  });

  // Admin registry check
  const ADMIN_REGISTRY = {
    owner: ['qumar@guyanahomehub.com'],
    super: []
  };

  const normalizedEmail = qumarEmail.toLowerCase();
  let adminLevel = null;
  
  if (ADMIN_REGISTRY.owner.includes(normalizedEmail)) {
    adminLevel = 'owner';
  } else if (ADMIN_REGISTRY.super.includes(normalizedEmail)) {
    adminLevel = 'super';
  }

  console.log('\n🔍 ADMIN STATUS CHECK:');
  console.log(`  Email: ${qumarEmail}`);
  console.log(`  Normalized: ${normalizedEmail}`);
  console.log(`  Admin Level: ${adminLevel || 'Not admin'}`);
  console.log(`  Is Eligible Admin: ${adminLevel !== null}`);
  console.log(`  User Type in Profile: ${profile.user_type}`);

  // Simulate API logic
  console.log('\n🧪 SIMULATING API LOGIC:');
  
  // Check user type permission
  const allowedUserTypes = ['admin', 'landlord', 'agent', 'fsbo'];
  const hasPermission = allowedUserTypes.includes(profile.user_type);
  console.log(`  User type "${profile.user_type}" allowed: ${hasPermission}`);

  if (!hasPermission) {
    console.log('  ❌ BLOCKER: User type not allowed to create properties');
    return;
  }

  // Check admin path vs non-admin path
  const isEligibleAdmin = adminLevel !== null;
  console.log(`  Takes admin path: ${isEligibleAdmin}`);

  if (isEligibleAdmin) {
    console.log('  📍 ADMIN PATH:');
    const propertyLimit = profile.property_limit;
    console.log(`    Property limit: ${propertyLimit}`);
    
    if (propertyLimit !== null) {
      const currentCount = countableProperties.length;
      console.log(`    Current countable properties: ${currentCount}`);
      console.log(`    Limit check: ${currentCount} >= ${propertyLimit}? ${currentCount >= propertyLimit}`);
      
      if (currentCount >= propertyLimit) {
        console.log('    ❌ BLOCKER: Property limit exceeded in admin path');
        console.log(`    Error message: "Property limit reached. Admin accounts allow ${propertyLimit} properties. You currently have ${currentCount}."`);
      } else {
        console.log('    ✅ Admin path would allow creation');
      }
    } else {
      console.log('    ✅ Super admin - unlimited');
    }
  } else {
    console.log('  📍 NON-ADMIN PATH: Would use enhanced property limits system');
    console.log('    (This would call can_user_create_property_enhanced function)');
  }

  // Check for any obvious issues
  console.log('\n🚨 POTENTIAL ISSUES TO CHECK:');
  
  // Check if there are recent failed attempts
  const recentRejected = properties.filter(p => 
    p.status === 'rejected' && 
    new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  
  if (recentRejected.length > 0) {
    console.log(`  ⚠️  ${recentRejected.length} properties rejected in last 7 days - check rejection reasons`);
  }

  // Check for duplicate attempts
  const titles = properties.map(p => p.title.toLowerCase().trim());
  const duplicateTitles = titles.filter((title, index) => titles.indexOf(title) !== index);
  if (duplicateTitles.length > 0) {
    console.log(`  ⚠️  Found duplicate property titles - user might be retrying failed submissions`);
  }
}

checkQumarDetailed().catch(console.error);