import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from '@/supabase-admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    
    const supabase = createAdminClient();
    
    // First, check if test agent already exists
    const testAgentEmail = 'test-agent@guyanahomehub.com';
    let testAgentId: string;
    
    const { data: existingAgent, error: agentCheckError } = await supabase
      .from('profiles')
      .select('id, email, user_type')
      .eq('email', testAgentEmail)
      .single();
    
    if (agentCheckError && agentCheckError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking for existing agent:', agentCheckError);
      return NextResponse.json({ error: `Agent check error: ${agentCheckError.message}` }, { status: 500 });
    }
    
    if (existingAgent) {
      testAgentId = existingAgent.id;
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
          if (authResult.error.message.includes('already been registered')) {
            console.log('📧 Test agent auth user already exists, getting existing user');
            // Try to get existing user by email
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existingUser = existingUsers.users.find(u => u.email === testAgentEmail);
            if (existingUser) {
              authUser = { user: existingUser };
            } else {
              throw new Error(`Auth error: ${authResult.error.message}`);
            }
          } else {
            throw new Error(`Auth error: ${authResult.error.message}`);
          }
        } else {
          authUser = authResult;
        }
      } catch (authError: any) {
        console.error('Auth user creation error:', authError);
        return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 500 });
      }
      
      testAgentId = authUser.user.id;
      
      // Create test agent profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: testAgentId,
          email: testAgentEmail,
          first_name: 'Test',
          last_name: 'Agent',
          user_type: 'agent',
          country_id: 'GY',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          property_limit: 20 // Give test agent good limits
        });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        return NextResponse.json({ error: `Profile error: ${profileError.message}` }, { status: 500 });
      }
      
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
      country_id: "GY",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
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
      return NextResponse.json({ 
        error: `Property creation error: ${propertyError.message}`,
        details: propertyError.details || 'No additional details',
        code: propertyError.code || 'Unknown error code'
      }, { status: 500 });
    }
    
    
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
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Test sale property created successfully",
      property: {
        id: propertyResult.id,
        title: propertyResult.title,
        listing_type: propertyResult.listing_type,
        listed_by_type: propertyResult.listed_by_type,
        status: propertyResult.status,
        site_id: propertyResult.site_id
      },
      agent: {
        id: testAgentId,
        email: testAgentEmail,
        created: !existingAgent
      }
    });
    
  } catch (err: any) {
    console.error("💥💥💥 CRITICAL TEST API ERROR 💥💥💥");
    console.error("Error message:", err?.message);
    console.error("Error stack:", err?.stack);
    
    return NextResponse.json({ 
      error: `Test API Error: ${err?.message || "Unknown error"}`,
      type: err?.name || "UnknownError",
      details: err?.stack || "No stack trace available"
    }, { status: 500 });
  }
}