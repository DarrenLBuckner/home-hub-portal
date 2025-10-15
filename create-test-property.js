const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createTestSaleProperty() {
  try {
    console.log('🚀 Creating test sale property and agent account');
    
    // Create admin Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('✅ Supabase admin client created successfully');
    
    // First, check if test agent already exists (try multiple methods)
    const testAgentEmail = 'test-agent@guyanahomehub.com';
    let testAgentId;
    
    // Method 1: Check profiles table
    const { data: existingAgent, error: agentCheckError } = await supabase
      .from('profiles')
      .select('id, email, user_type')
      .eq('email', testAgentEmail)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors on no match
    
    if (agentCheckError) {
      console.error('Error checking for existing agent:', agentCheckError);
      throw new Error(`Agent check error: ${agentCheckError.message}`);
    }
    
    // Method 2: If not in profiles, check auth users
    if (!existingAgent) {
      console.log('🔍 No profile found, checking auth users...');
      try {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const existingAuthUser = authUsers.users.find(u => u.email === testAgentEmail);
        if (existingAuthUser) {
          console.log('📧 Found existing auth user without profile, will use this ID:', existingAuthUser.id);
          testAgentId = existingAuthUser.id;
        }
      } catch (authListError) {
        console.warn('Could not list auth users:', authListError.message);
      }
    }
    
    if (existingAgent) {
      console.log('✅ Found existing test agent:', existingAgent.email);
      testAgentId = existingAgent.id;
    } else if (testAgentId) {
      console.log('🔧 Found auth user without profile, will create profile');
      // Create profile for existing auth user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: testAgentId,
          email: testAgentEmail,
          first_name: 'Test',
          last_name: 'Agent',
          user_type: 'agent',
          country_id: 'GY',
          property_limit: 20 // Give test agent good limits
        });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`Profile error: ${profileError.message}`);
      }
      
      console.log('✅ Test agent profile created for existing auth user');
    } else {
      console.log('📝 Creating new test agent account');
      
      // Try to create test agent user in auth
      let authUser;
      try {
        const authResult = await supabase.auth.admin.createUser({
          email: testAgentEmail,
          password: 'TestAgent123!',
          email_confirm: true,
          user_metadata: {
            first_name: 'Test',
            last_name: 'Agent',
            user_type: 'agent'
          }
        });
        
        if (authResult.error) {
          // Check if user already exists in auth
          if (authResult.error.message.includes('already registered')) {
            console.log('📧 Test agent auth user already exists, getting existing user');
            // Try to get existing user by email
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existingUser = existingUsers.users.find(u => u.email === testAgentEmail);
            if (existingUser) {
              authUser = { user: existingUser };
              console.log('✅ Found existing auth user:', existingUser.id);
            } else {
              throw new Error(`Auth error: ${authResult.error.message}`);
            }
          } else {
            throw new Error(`Auth error: ${authResult.error.message}`);
          }
        } else {
          authUser = authResult;
          console.log('✅ Test agent auth user created:', authUser.user.id);
        }
      } catch (authError) {
        console.error('Auth user creation error:', authError);
        throw new Error(`Auth error: ${authError.message}`);
      }
      
      testAgentId = authUser.user.id;
      
      // Try to create test agent profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: testAgentId,
          email: testAgentEmail,
          first_name: 'Test',
          last_name: 'Agent',
          user_type: 'agent',
          country_id: 'GY',
          property_limit: 20 // Give test agent good limits
        });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`Profile error: ${profileError.message}`);
      }
      
      console.log('✅ Test agent profile created/updated successfully');
    }
    
    // Create the test sale property with exact specifications
    const testPropertyData = {
      // Basic Info
      title: "TEST SALE - 3BR Georgetown House",
      description: "Beautiful 3-bedroom house for sale in Georgetown",
      price: 45000000,
      property_type: "house",
      listing_type: "sale",
      
      // Property Details
      bedrooms: 3,
      bathrooms: 2,
      house_size_value: 2000,
      house_size_unit: "sq ft",
      land_size_value: 5000,
      land_size_unit: "sq ft",
      year_built: 2020,
      amenities: ["parking", "garden", "security", "modern_kitchen"],
      
      // Location
      location: "Georgetown",
      country: "GY",
      region: "Georgetown",
      city: "Georgetown",
      neighborhood: "Kitty",
      
      // Agent-specific fields
      currency: "GYD",
      listed_by_type: "agent",
      
      // System fields
      user_id: testAgentId,
      status: "pending", // Start as pending, will approve later
      site_id: "guyana",
      country_id: "GY"
    };
    
    console.log('🔧 Inserting test property data:', {
      title: testPropertyData.title,
      listing_type: testPropertyData.listing_type,
      listed_by_type: testPropertyData.listed_by_type,
      status: testPropertyData.status,
      user_id: testPropertyData.user_id
    });
    
    // Insert the test property
    const { data: propertyResult, error: propertyError } = await supabase
      .from("properties")
      .insert(testPropertyData)
      .select('id, title, listing_type, listed_by_type, status, site_id')
      .single();
    
    if (propertyError) {
      console.error('Property creation error:', propertyError);
      throw new Error(`Property creation error: ${propertyError.message}`);
    }
    
    console.log('✅ Test property created successfully:', propertyResult);
    
    // Create a test image entry (using placeholder image)
    const { error: mediaError } = await supabase
      .from("property_media")
      .insert({
        property_id: propertyResult.id,
        media_url: "https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=Test+House",
        media_type: "image",
        is_primary: true,
        display_order: 0,
      });
    
    if (mediaError) {
      console.warn('Media insert error (non-critical):', mediaError);
    } else {
      console.log('✅ Test property media created successfully');
    }
    
    // Now approve the property (set status to active)
    const { data: approvedProperty, error: approvalError } = await supabase
      .from("properties")
      .update({ 
        status: "active"
      })
      .eq('id', propertyResult.id)
      .select('id, title, listing_type, listed_by_type, status, site_id')
      .single();
    
    if (approvalError) {
      console.error('Property approval error:', approvalError);
      throw new Error(`Property approval error: ${approvalError.message}`);
    }
    
    console.log('✅ Test property approved and set to active status');
    
    // Final verification - check all mapping fields
    console.log('\n🎯 FINAL PROPERTY VERIFICATION:');
    console.log('=================================');
    console.log('Property ID:', approvedProperty.id);
    console.log('Title:', approvedProperty.title);
    console.log('Listing Type:', approvedProperty.listing_type);
    console.log('Listed By Type:', approvedProperty.listed_by_type);
    console.log('Status:', approvedProperty.status);
    console.log('Site ID:', approvedProperty.site_id);
    
    // Verify all required mapping fields are correct
    const mappingFieldsCorrect = 
      approvedProperty.listing_type === 'sale' &&
      approvedProperty.listed_by_type === 'agent' &&
      approvedProperty.status === 'active' &&
      approvedProperty.site_id === 'guyana';
    
    console.log('\n✅ MAPPING FIELDS VERIFICATION:');
    console.log('listing_type = \'sale\':', approvedProperty.listing_type === 'sale' ? '✓' : '✗');
    console.log('listed_by_type = \'agent\':', approvedProperty.listed_by_type === 'agent' ? '✓' : '✗');
    console.log('status = \'active\':', approvedProperty.status === 'active' ? '✓' : '✗');
    console.log('site_id = \'guyana\':', approvedProperty.site_id === 'guyana' ? '✓' : '✗');
    
    if (mappingFieldsCorrect) {
      console.log('\n🎉 SUCCESS! Test sale property created with all correct mapping fields.');
      console.log('This property can now be used to test agent sale property mapping flow.');
    } else {
      console.log('\n⚠️  WARNING: Some mapping fields may not be correct. Please verify manually.');
    }
    
    return {
      success: true,
      property: approvedProperty,
      agent: {
        id: testAgentId,
        email: testAgentEmail,
        created: !existingAgent
      }
    };
    
  } catch (error) {
    console.error('💥💥💥 CRITICAL ERROR 💥💥💥');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

// Run the script
createTestSaleProperty()
  .then(result => {
    console.log('\n🚀 Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  });