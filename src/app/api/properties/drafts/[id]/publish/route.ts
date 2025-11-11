// API endpoint for converting drafts to published properties
// POST /api/properties/drafts/[id]/publish - Convert draft to published property
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const draftId = params.id;
    console.log('🚀 Publishing draft:', draftId);
    
    // Create supabase server client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Authenticate the user
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for permissions and country_id
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, country_id')
      .eq('id', user.id)
      .single();
      
    if (profileError || !userProfile) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: "User profile not found" }, { status: 401 });
    }

    // Validate that user has permission to publish properties
    const allowedUserTypes = ['admin', 'landlord', 'agent', 'fsbo'];
    if (!allowedUserTypes.includes(userProfile.user_type)) {
      return NextResponse.json({ 
        error: "Insufficient privileges", 
        message: "Only admin, landlord, agent, or FSBO users can publish properties"
      }, { status: 403 });
    }

    // Load the draft
    const { data: draft, error: draftError } = await supabase
      .from('property_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('user_id', user.id)
      .single();

    if (draftError) {
      console.error('❌ Draft not found:', draftError);
      return NextResponse.json({ 
        error: 'Draft not found' 
      }, { status: 404 });
    }

    // Check if draft has expired
    if (new Date(draft.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'Draft has expired and cannot be published' 
      }, { status: 410 });
    }

    // Auto-approval for admins and owner admins  
    const shouldAutoApprove = (userType: string): boolean => {
      const adminTypes = ['admin', 'superadmin', 'owner'];
      return adminTypes.includes(userType?.toLowerCase() || '');
    };

    const autoApprove = shouldAutoApprove(userProfile.user_type);
    const propertyStatus = autoApprove ? 'approved' : 'pending';

    // Prepare property data from draft
    const draftData = draft.draft_data;
    const propertyData = {
      user_id: user.id,
      country_id: userProfile.country_id,
      title: draftData.title || draft.title,
      description: draftData.description,
      property_type: draftData.property_type,
      listing_type: draftData.listing_type || draft.draft_type,
      price: draftData.price,
      currency: draftData.currency || 'USD',
      
      // Location data
      location: draftData.location,
      address: draftData.address,
      city: draftData.city,
      region: draftData.region,
      postal_code: draftData.postal_code,
      latitude: draftData.latitude,
      longitude: draftData.longitude,
      
      // Property details
      bedrooms: draftData.bedrooms,
      bathrooms: draftData.bathrooms,
      house_size_value: draftData.house_size_value || 0,
      house_size_unit: draftData.house_size_unit,
      lot_size_value: draftData.lot_size_value,
      lot_size_unit: draftData.lot_size_unit,
      year_built: draftData.year_built,
      
      // Features and amenities
      amenities: draftData.amenities,
      features: draftData.features,
      property_condition: draftData.property_condition,
      
      // Listing details
      listed_by_type: draftData.listed_by_type,
      contact_name: draftData.contact_name,
      contact_phone: draftData.contact_phone,
      contact_email: draftData.contact_email,
      
      // Status
      status: propertyStatus,
      is_featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert into properties table
    const { data: newProperty, error: propertyError } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();

    if (propertyError) {
      console.error('❌ Error creating property:', propertyError);
      return NextResponse.json({ 
        error: 'Failed to publish property' 
      }, { status: 500 });
    }

    // Handle media if present in draft
    if (draftData.images && Array.isArray(draftData.images) && draftData.images.length > 0) {
      const mediaData = draftData.images.map((image: any, index: number) => ({
        property_id: newProperty.id,
        url: image.url || image.src,
        alt_text: image.alt || image.altText || `Property image ${index + 1}`,
        is_primary: image.isPrimary || index === 0
      }));

      const { error: mediaError } = await supabase
        .from('property_media')
        .insert(mediaData);

      if (mediaError) {
        console.warn('⚠️ Error inserting media:', mediaError);
        // Don't fail the whole operation for media errors
      }
    }

    // Delete the draft after successful publishing
    const { error: deleteError } = await supabase
      .from('property_drafts')
      .delete()
      .eq('id', draftId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.warn('⚠️ Error deleting draft after publish:', deleteError);
      // Don't fail - property was created successfully
    }

    console.log('✅ Draft published successfully');

    return NextResponse.json({ 
      success: true, 
      property_id: newProperty.id,
      status: propertyStatus,
      message: autoApprove 
        ? 'Property published and approved successfully' 
        : 'Property published and is pending approval'
    });
    
  } catch (err: any) {
    console.error('💥 Draft publish error:', err);
    return NextResponse.json({ 
      error: `Failed to publish draft: ${err?.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}