import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getTierBenefits } from '@/lib/subscription-utils';

// Map country codes to site IDs for multi-tenant support
// site_id is the lowercase country name used in domain (e.g., 'guyana' for guyanahomehub.com)
// country_id is the ISO code (e.g., 'GY')
const COUNTRY_TO_SITE: Record<string, string> = {
  'GY': 'guyana',
  'JM': 'jamaica',
  'TT': 'trinidad',
  'BB': 'barbados',
  'BS': 'bahamas',
  'KE': 'kenya',
  'NG': 'nigeria',
  'GH': 'ghana',
  'ZA': 'southafrica',
};

function getSiteIdFromCountry(countryCode: string | undefined): string {
  if (!countryCode) return 'guyana';
  return COUNTRY_TO_SITE[countryCode.toUpperCase()] || countryCode.toLowerCase();
}

export const runtime = 'nodejs'; // avoid Edge runtime issues
export const maxDuration = 60; // Allow up to 60 seconds for image processing
// Note: Vercel free tier has 4.5MB body limit, Pro has 4.5MB, Enterprise can go higher
// We handle this by compressing images on client side before upload

export async function POST(req: NextRequest) {
  try {
    
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

    if (userErr) {
      console.error('Auth error:', userErr.message);
      return NextResponse.json({ error: userErr.message }, { status: 401 });
    }
    
    if (!user) {
      console.error('No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    
    // Get user profile for permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, email, country_id')
      .eq('id', user.id)
      .single();
      
    if (profileError || !userProfile) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: "User profile not found" }, { status: 401 });
    }
    
    const userType = userProfile.user_type;
    
    // DISABLED AUTO-APPROVAL: All properties should go through review process
    // This ensures admin dashboard approval workflow works properly
    const shouldAutoApprove = (userType: string): boolean => {
      // return false; // Disable auto-approval for all users including admins
      
      // Alternative: Only auto-approve for super admins in production
      return userType?.toLowerCase() === 'superadmin' && process.env.NODE_ENV === 'production';
    };
    
    // Read the request body once
    const body = await req.json();

    // Parse optional target_user_id for admin-on-behalf-of creation
    // This allows admins to create properties that are assigned to another user's account
    const targetUserId: string | undefined = body.target_user_id;

    // Check if this is a draft save operation
    const isDraftSave = body._isDraftSave === true || body.status === 'draft';
    const isPublishDraft = body._isPublishDraft === true;
    
    
    // REDIRECT DRAFT SAVES TO NEW DRAFT SYSTEM
    if (isDraftSave && !isPublishDraft) {
      
      // Forward to draft API
      const draftUrl = new URL('/api/properties/drafts', req.url);
      const draftRequest = new NextRequest(draftUrl, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify({
          draft_id: body.draft_id,
          title: body.title,
          draft_type: body.listing_type || 'sale',
          ...body
        })
      });
      
      // Import and call the draft POST handler
      const { POST: draftPost } = await import('../drafts/route');
      return await draftPost(draftRequest);
    }
    
    // Add this where the request payload is processed
    const propertyType = body.property_type || body.propertyType;
    
    // Add field normalizations for all required fields
    const normalizedPayload = {
      ...body,
      // Normalize property_type/propertyType
      property_type: body.property_type || body.propertyType || null,
      // Normalize listing_type/listingType
      listing_type: body.listing_type || body.listingType || null,
      // Normalize house_size_value with default
      house_size_value: body.house_size_value || body.houseSizeValue || 0, // Default if missing
      // Normalize region/location
      region: body.region || (body.location ? body.location.region : null),
      city: body.city || (body.location ? body.location.city : null),
      // Handle amenities array/string conversion
      amenities: Array.isArray(body.amenities) ? body.amenities : 
                (typeof body.amenities === 'string' ? body.amenities.split(',').map((a: string) => a.trim()) : []),
      // Ensure user_id is set correctly
      user_id: user.id,
      // Set status based on operation type
      status: isDraftSave ? 'draft' : (shouldAutoApprove(userType) ? 'active' : 'pending')
    };
    
    const userId = user.id;
    
    // Validate that user has permission to create properties
    const allowedUserTypes = ['admin', 'landlord', 'agent', 'fsbo', 'owner'];
    if (!allowedUserTypes.includes(userType)) {
      return NextResponse.json({ 
        error: "Insufficient privileges", 
        message: "Only admin, landlord, agent, FSBO, or owner users can create properties"
      }, { status: 403 });
    }
    
    // Determine listing type from the form
    const listingType = body.listing_type || 'sale';
    const isRental = listingType === 'rent';
    const isSale = listingType === 'sale';
    const isLease = listingType === 'lease';
    const isAgent = userType === 'agent';

    // Property category (residential vs commercial)
    const propertyCategory = body.property_category || 'residential';

    // Map user_type to listed_by_type
    const getListedByType = (userType: string, listingType?: string): string => {
      if (userType === 'agent') return 'agent';
      if (userType === 'owner') return 'owner';
      if (userType === 'fsbo') return 'owner';
      if (userType === 'landlord') return 'landlord';
      return listingType === 'rent' ? 'landlord' : 'owner';
    };
    const listedByType = getListedByType(userType, listingType);

    // Validate listing_type (skip for drafts)
    if (!isDraftSave && !['sale', 'rent', 'lease', 'short_term_rent'].includes(listingType)) {
      return NextResponse.json({ error: "Invalid listing_type. Must be 'sale', 'rent', 'lease', or 'short_term_rent'" }, { status: 400 });
    }

    // Validate property_category
    if (!['residential', 'commercial'].includes(propertyCategory)) {
      return NextResponse.json({ error: "Invalid property_category. Must be 'residential' or 'commercial'" }, { status: 400 });
    }
    
    // Validate required fields - more lenient for drafts
    if (!isDraftSave) {
      // Base required fields for full submission
      let requiredFields = [
        "title", "description", "price", "property_type",
        "listing_type", "region", "city"
      ];
      
      // Bedrooms/bathrooms only required for residential non-land properties
      const isLand = body.property_type === 'Land' || body.property_type === 'Commercial Land';
      const isResidential = body.property_category === 'residential';
      
      if (isResidential && !isLand) {
        requiredFields.push("bedrooms", "bathrooms");
      }
      
      // Add user-type specific required fields
      if (userType === 'fsbo') {
        requiredFields = [
          ...requiredFields,
          "owner_email", "owner_whatsapp"
        ];
      }
      
      // Add commercial property required fields
      if (body.property_category === 'commercial') {
        requiredFields.push("commercial_type");
      }
      
      // Always require images for full submissions
      requiredFields.push("images");
      
      // Check required fields using normalized payload
      const missingFields = requiredFields.filter(field => {
        return !normalizedPayload[field] && normalizedPayload[field] !== 0;
      });
      
      if (missingFields.length > 0) {
        return NextResponse.json({
          error: `Missing required fields: ${missingFields.join(', ')}`,
        }, { status: 400 });
      }
    } else {
      // For drafts, only require minimal fields to prevent completely empty saves
      const minimalFields = ['property_type', 'listing_type'];
      const missingMinimalFields = minimalFields.filter(field => {
        return !normalizedPayload[field] && normalizedPayload[field] !== '';
      });
      
      if (missingMinimalFields.length > 0) {
        // Don't fail, just ensure we have some basic structure
        normalizedPayload.property_type = normalizedPayload.property_type || 'House';
        normalizedPayload.listing_type = normalizedPayload.listing_type || 'sale';
      }
    }

    // BULLETPROOF ADMIN DETECTION - Based on working emergency bypass
    const ADMIN_REGISTRY = {
      super: ['mrdarrenbuckner@gmail.com'] as string[],
      owner: ['qumar@guyanahomehub.com'] as string[],
      basic: [] as string[] // For future country-specific admins
    };

    function getAdminLevel(email: string | undefined): 'super' | 'owner' | 'basic' | null {
      if (!email) return null;
      
      const normalizedEmail = email.toLowerCase().trim();
      
      if (ADMIN_REGISTRY.super.includes(normalizedEmail)) return 'super';
      if (ADMIN_REGISTRY.owner.includes(normalizedEmail)) return 'owner';
      if (ADMIN_REGISTRY.basic.includes(normalizedEmail)) return 'basic';
      
      return null;
    }

    // Apply bulletproof admin detection
    const adminLevel = getAdminLevel(userProfile.email);
    // All admin levels (super, owner, basic) can create properties for users
    // Territory restrictions are enforced separately below
    const isEligibleAdmin = adminLevel !== null;

    // ============================================================
    // ADMIN-ON-BEHALF-OF CREATION LOGIC
    // When admin provides target_user_id, property is assigned to that user
    // ============================================================
    let effectiveUserId = userId;      // Default: property goes to logged-in user
    let createdByUserId = userId;      // Default: created by logged-in user
    let isAdminCreatingForUser = false;
    let targetUserProfile: any = null;

    if (targetUserId && isEligibleAdmin) {
      try {
        console.log('🔄 Admin creating property for user:', { adminId: userId, targetUserId, adminLevel });

        // Validate target user exists and get their profile
        const { data: targetUser, error: targetError } = await supabase
          .from('profiles')
          .select('id, site_id, country_id, user_type, subscription_tier, email, first_name, last_name')
          .eq('id', targetUserId)
          .single();

        if (targetError || !targetUser) {
          console.error('❌ Target user not found:', targetError);
          return NextResponse.json({
            error: 'Target user not found',
            details: 'The specified user does not exist in the system'
          }, { status: 404 });
        }

        // Territory check: Owner/Basic admins can only create for users in their territory
        if (adminLevel !== 'super') {
          // Get admin's site_id for comparison
          const { data: adminProfile } = await supabase
            .from('profiles')
            .select('site_id, country_id')
            .eq('id', userId)
            .single();

          const adminSiteId = adminProfile?.site_id || getSiteIdFromCountry(adminProfile?.country_id);
          const targetSiteId = targetUser.site_id || getSiteIdFromCountry(targetUser.country_id);

          if (adminSiteId !== targetSiteId) {
            console.error('❌ Territory violation:', { adminSiteId, targetSiteId, adminLevel });
            return NextResponse.json({
              error: 'Cannot create property for user outside your territory',
              details: `You can only create properties for users in your assigned territory (${adminSiteId})`
            }, { status: 403 });
          }
        }

        // All checks passed - set up for admin-on-behalf-of creation
        effectiveUserId = targetUserId;           // Property assigned to target user
        createdByUserId = userId;                 // Audit: admin who created it
        isAdminCreatingForUser = true;
        targetUserProfile = targetUser;

        console.log('✅ Admin-for-user validation passed:', {
          effectiveUserId,
          createdByUserId,
          targetUserName: `${targetUser.first_name} ${targetUser.last_name}`,
          targetUserType: targetUser.user_type
        });

      } catch (error) {
        // If any error in target user validation, log and fall back to existing behavior
        console.error('⚠️ Error in admin-for-user validation, falling back to standard creation:', error);
        effectiveUserId = userId;
        createdByUserId = userId;
        isAdminCreatingForUser = false;
      }
    }

    // CRITICAL DEBUG - Add a clear marker for admin path
    if (isEligibleAdmin) {
    } else {
    }

    // Remove old conflicting admin detection code

    if (isEligibleAdmin && !isAdminCreatingForUser) {
      // CASE 1: Admin creating property for THEMSELVES
      // Default to unlimited for admin users
      console.log('✅ Admin creating for self - no property limits applied');

    } else if (isEligibleAdmin && isAdminCreatingForUser && targetUserProfile) {
      // CASE 2: Admin creating property FOR ANOTHER USER
      // Check limits against the TARGET USER's account, not the admin's
      console.log('🔍 Admin creating for user - checking target user limits:', {
        targetUserId: effectiveUserId,
        targetUserType: targetUserProfile.user_type,
        targetTier: targetUserProfile.subscription_tier
      });

      // Get tier benefits for target user
      const targetTierBenefits = getTierBenefits(
        targetUserProfile.user_type,
        targetUserProfile.subscription_tier || 'basic'
      );
      const targetMaxAllowed = targetTierBenefits.maxListings;

      // Count target user's current properties
      const { count: targetCurrentCount, error: targetCountError } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', effectiveUserId)
        .in('status', ['active', 'pending', 'draft']);

      if (targetCountError) {
        console.error('Target user property count error:', targetCountError);
        return NextResponse.json({
          error: "Unable to verify target user's property limits. Please contact support."
        }, { status: 500 });
      }

      // Check if target user's limit would be exceeded (999 = unlimited)
      if (targetMaxAllowed !== 999 && (targetCurrentCount || 0) >= targetMaxAllowed) {
        console.error('❌ Target user property limit exceeded:', {
          targetUserId: effectiveUserId,
          currentCount: targetCurrentCount,
          maxAllowed: targetMaxAllowed
        });

        const targetUserName = `${targetUserProfile.first_name || ''} ${targetUserProfile.last_name || ''}`.trim() || 'User';

        return NextResponse.json({
          error: `Cannot create property: ${targetUserName}'s account has reached its limit`,
          details: {
            target_user_id: effectiveUserId,
            target_user_name: targetUserName,
            current_count: targetCurrentCount || 0,
            max_allowed: targetMaxAllowed,
            subscription_tier: targetUserProfile.subscription_tier || 'basic',
            user_type: targetUserProfile.user_type
          }
        }, { status: 403 });
      }

      console.log('✅ Target user property limit check passed:', {
        targetUserId: effectiveUserId,
        currentCount: targetCurrentCount || 0,
        maxAllowed: targetMaxAllowed
      });

    } else {
      // For all other users (agents, landlords, FSBO) - use local property limits system
      
      // Get user's subscription tier from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Profile fetch error for limits check:', profileError);
        return NextResponse.json({ 
          error: "Unable to verify property limits. Please contact support." 
        }, { status: 500 });
      }

      // Get tier benefits using the updated subscription utils
      const tierBenefits = getTierBenefits(userProfile.user_type, profile?.subscription_tier || 'basic');
      const maxAllowed = tierBenefits.maxListings;

      console.log('🔍 Property limits check:', {
        userType: userProfile.user_type,
        subscriptionTier: profile?.subscription_tier || 'basic',
        maxAllowed,
        isUnlimited: maxAllowed === 999
      });

      // Count current properties (exclude rejected ones)
      const { count: currentCount, error: countError } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['active', 'pending', 'draft']);

      if (countError) {
        console.error('Property count error:', countError);
        return NextResponse.json({ 
          error: "Unable to verify property limits. Please contact support." 
        }, { status: 500 });
      }

      // Check if limit exceeded (999 means unlimited)
      if (maxAllowed !== 999 && (currentCount || 0) >= maxAllowed) {
        console.error('❌ Property limit exceeded for non-admin user');
        
        // Provide specific error messages based on user type
        let errorMessage = 'Property limit exceeded';
        
        if (userProfile.user_type === 'landlord') {
          errorMessage = `Landlord limit reached: You can list ${maxAllowed} ${maxAllowed === 1 ? 'property' : 'properties'}. You currently have ${currentCount || 0} properties. Please upgrade to list more.`;
        } else if (userProfile.user_type === 'fsbo') {
          errorMessage = `FSBO limit reached: You can list ${maxAllowed} ${maxAllowed === 1 ? 'property' : 'properties'}. You currently have ${currentCount || 0} properties. Please upgrade to list more.`;
        } else if (userProfile.user_type === 'agent') {
          errorMessage = `Agent limit reached: Your ${profile?.subscription_tier || 'basic'} plan allows ${maxAllowed} ${maxAllowed === 1 ? 'property' : 'properties'}. You currently have ${currentCount || 0} properties. Please upgrade to list more.`;
        }
        
        return NextResponse.json({ 
          error: errorMessage,
          details: {
            current_count: currentCount || 0,
            max_allowed: maxAllowed,
            subscription_tier: profile?.subscription_tier || 'basic',
            user_type: userProfile.user_type
          }
        }, { status: 403 });
      }

      console.log('✅ Property limit check passed:', {
        currentCount: currentCount || 0,
        maxAllowed,
        subscriptionTier: profile?.subscription_tier || 'basic'
      });

    }

    // Handle image URLs (new direct upload method) or base64 images (legacy)
    let imageUrls: string[] = [];
    
    if (body.imageUrls && Array.isArray(body.imageUrls)) {
      // New method: Images already uploaded to Supabase Storage
      console.log(`✅ Using pre-uploaded images: ${body.imageUrls.length} URLs`);
      imageUrls = body.imageUrls;
      
      // Enforce image limits
      if (!isDraftSave) {
        const maxImages = isRental ? 15 : 20;
        if (imageUrls.length > maxImages) {
          return NextResponse.json({ error: `Image limit exceeded (${maxImages} allowed)` }, { status: 400 });
        }
        if (imageUrls.length < 1) {
          return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
        }
      }
    } else if (body.images && Array.isArray(body.images)) {
      // Legacy method: Base64 images that need to be uploaded
      console.log(`📤 Uploading ${body.images.length} base64 images...`);
      
      // Enforce image limits
      if (!isDraftSave) {
        const maxImages = isRental ? 15 : 20;
        if (body.images.length > maxImages) {
          return NextResponse.json({ error: `Image limit exceeded (${maxImages} allowed)` }, { status: 400 });
        }
        if (body.images.length < 1) {
          return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
        }
      }

      // Upload images to Supabase Storage
      for (let i = 0; i < body.images.length; i++) {
        const file = body.images[i];
        try {
          // Convert file data - handle different formats
          let fileBuffer: Buffer;
          if (typeof file.data === 'string') {
            // Handle base64 data URL (data:image/jpeg;base64,...)
            const base64Data = file.data.includes(',') ? file.data.split(',')[1] : file.data;
            
            // Validate base64 size
            const estimatedSize = (base64Data.length * 3) / 4;
            if (estimatedSize > 15 * 1024 * 1024) {
              throw new Error(`Image too large: ${Math.round(estimatedSize / 1024 / 1024)}MB (15MB max)`);
            }
            
            fileBuffer = Buffer.from(base64Data, 'base64');
          } else {
            throw new Error(`Unsupported file data format`);
          }

          const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}-${file.name}`;
          const { data, error } = await supabase.storage
            .from("property-images")
            .upload(fileName, fileBuffer, {
              contentType: file.type,
              upsert: false,
            });

          if (error) throw error;
          if (!data?.path) throw new Error("No file path returned from storage");

          const { data: urlData } = supabase.storage
            .from("property-images")
            .getPublicUrl(data.path);
            
          if (!urlData?.publicUrl) throw new Error("Failed to get public URL");

          imageUrls.push(urlData.publicUrl);
        } catch (err) {
          console.error(`❌ Image upload error for file ${i + 1}:`, err);
          return NextResponse.json({ 
            error: `Image upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`
          }, { status: 500 });
        }
      }
    } else if (!isDraftSave) {
      // No images provided for full submission
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
    }

    // For drafts without images, use empty array
    if (imageUrls.length === 0 && isDraftSave) {
      imageUrls = [];
    }

    // Prepare property data for database - different structure for rental vs sale vs agent
    let propertyData: any;
    
    if (isAgent) {
      // Agent property data structure - handles both sale and rental
      propertyData = {
        // Basic Info
        title: body.title,
        description: body.description,
        price: parseInt(body.price),
        property_type: body.property_type,
        listing_type: listingType, // 'sale', 'rent', 'lease', or 'short_term_rent'
        
        // Property Details
        bedrooms: parseInt(body.bedrooms) || null,
        bathrooms: parseInt(body.bathrooms) || null,
        house_size_value: body.house_size_value ? parseInt(body.house_size_value) : null,
        house_size_unit: body.house_size_unit || 'sq ft',
        land_size_value: body.land_size_value ? parseInt(body.land_size_value) : null,
        land_size_unit: body.land_size_unit || 'sq ft',
        year_built: body.year_built ? parseInt(body.year_built) : null,
        lot_length: body.lot_length ? parseFloat(body.lot_length) : null,
        lot_width: body.lot_width ? parseFloat(body.lot_width) : null,
        lot_dimension_unit: body.lot_dimension_unit || 'ft',
        amenities: normalizedPayload.amenities || null,
        features: body.features || null,
        
        // Location
        location: body.location || body.region,
        country: body.country || 'GY',
        region: body.region,
        city: body.city,
        neighborhood: body.neighborhood,
        
        // Agent-specific fields
        currency: body.currency || 'GYD',
        listed_by_type: listedByType,
        
        // Video URL (for Pro/Elite tier agents)
        video_url: body.video_url || null,
        
        // Commercial Property Fields
        property_category: propertyCategory,
        commercial_type: body.commercial_type || null,
        floor_size_sqft: body.floor_size_sqft ? parseInt(body.floor_size_sqft) : null,
        building_floor: body.building_floor || null,
        number_of_floors: body.number_of_floors ? parseInt(body.number_of_floors) : null,
        parking_spaces: body.parking_spaces ? parseInt(body.parking_spaces) : null,
        loading_dock: body.loading_dock || false,
        elevator_access: body.elevator_access || false,
        commercial_garage_entrance: body.commercial_garage_entrance || false,
        
        // System fields
        user_id: effectiveUserId,                    // Property owner (target user if admin-created)
        created_by: createdByUserId,                 // Audit: who actually created this property
        status: body.status || (shouldAutoApprove(userType) ? 'active' : 'pending'),
        site_id: body.site_id || getSiteIdFromCountry(body.country),  // Multi-tenant: maps country code to site name
        country_id: body.country || 'GY',  // Use country code from form data
        created_at: new Date().toISOString(),
      };
    } else if (isRental) {
      // Rental property data structure - handle both agent and landlord forms
      propertyData = {
        // Basic Info
        title: body.title,
        description: body.description,
        price: parseInt(body.price),
        property_type: body.property_type || body.propertyType, // Handle both field name formats
        
        // Property Details
        bedrooms: parseInt(body.bedrooms),
        bathrooms: parseInt(body.bathrooms),
        house_size_value: parseInt(body.squareFootage), // Map squareFootage to house_size_value
        house_size_unit: 'sqft',
        lot_length: body.lot_length ? parseFloat(body.lot_length) : null,
        lot_width: body.lot_width ? parseFloat(body.lot_width) : null,
        lot_dimension_unit: body.lot_dimension_unit || 'ft',
        amenities: body.features || [], // Map features to amenities
        
        // Location - rental uses different structure
        location: body.location, // Specific address field
        country: body.country,
        region: body.region,
        city: body.region, // Use region as city for rentals
        
        // Rental-specific fields
        rental_type: body.rentalType || 'monthly',
        currency: body.currency || 'GYD',
        
        // Video URL (for Pro/Elite tier landlords)
        video_url: body.video_url || null,
        
        // System fields
        user_id: effectiveUserId,                    // Property owner (target user if admin-created)
        created_by: createdByUserId,                 // Audit: who actually created this property
        listing_type: listingType,
        listed_by_type: listedByType,
        property_category: propertyCategory,
        status: body.status || (shouldAutoApprove(userType) ? 'active' : 'pending'),
        site_id: body.site_id || getSiteIdFromCountry(body.country),  // Multi-tenant: maps country code to site name
        country_id: body.country || 'GY',  // Use country code from form data
        created_at: new Date().toISOString(),
      };
    } else {
      // FSBO sale property data structure (existing)
      propertyData = {
        // Step 1 - Basic Info
        title: body.title,
        description: body.description,
        price: parseInt(body.price),
        property_type: body.property_type,
        
        // Step 2 - Property Details
        bedrooms: parseInt(body.bedrooms),
        bathrooms: parseInt(body.bathrooms),
        house_size_value: parseInt(body.house_size_value),
        house_size_unit: body.house_size_unit,
        land_size_value: body.land_size_value ? parseInt(body.land_size_value) : null,
        land_size_unit: body.land_size_unit,
        year_built: body.year_built ? parseInt(body.year_built) : null,
        lot_length: body.lot_length ? parseFloat(body.lot_length) : null,
        lot_width: body.lot_width ? parseFloat(body.lot_width) : null,
        lot_dimension_unit: body.lot_dimension_unit || 'ft',
        amenities: normalizedPayload.amenities || [],
        
        // Step 3 - Location
        region: body.region,
        city: body.city,
        neighborhood: body.neighborhood || null,
        
        // Step 5 - Contact
        owner_email: body.owner_email,
        owner_whatsapp: body.owner_whatsapp,
        
        // Video URL (for Pro/Elite tier FSBO)
        video_url: body.video_url || null,
        
        // System fields (auto-populated)
        user_id: effectiveUserId,                    // Property owner (target user if admin-created)
        created_by: createdByUserId,                 // Audit: who actually created this property
        listing_type: listingType,
        listed_by_type: listedByType,
        property_category: propertyCategory,
        status: body.status || (shouldAutoApprove(userType) ? 'active' : 'pending'),
        site_id: body.site_id || getSiteIdFromCountry(body.country),  // Multi-tenant: maps country code to site name
        country_id: body.country || 'GY',  // Use country code from form data
        created_at: new Date().toISOString(),
      };
    }

    // Log the data being inserted for debugging

    // Insert property into properties table
    const { data: propertyResult, error: dbError } = await supabase
      .from("properties")
      .insert(propertyData)
      .select('id')
      .single();
      
    if (dbError) {
      console.error('Property creation error details:', dbError);
      console.error('Error message:', dbError.message);
      console.error('Payload:', normalizedPayload);
      console.error("💥 Database error:", dbError);
      console.error("💥 Failed property data:", propertyData);
      return NextResponse.json({ 
        error: `Database error: ${dbError.message}`,
        details: dbError.details || 'No additional details',
        code: dbError.code || 'Unknown error code'
      }, { status: 500 });
    }

    // Insert images into property_media table
    const mediaInserts = imageUrls.map((url, index) => ({
      property_id: propertyResult.id,
      media_url: url,
      media_type: 'image',
      is_primary: index === (body.primaryImageIndex || 0),
      display_order: index,
    }));


    const { error: mediaError } = await supabase
      .from("property_media")
      .insert(mediaInserts);
      
    if (mediaError) {
      console.error("💥 Media insert error:", mediaError);
      console.error("💥 Failed media inserts:", mediaInserts);
      // Don't fail the whole request, just log the error
    } else {
    }

    // Determine success message based on operation type and user status
    let successMessage = 'Property submitted for review';

    if (isDraftSave) {
      successMessage = '💾 Draft saved successfully';
    } else if (isPublishDraft) {
      successMessage = shouldAutoApprove(userType)
        ? '🚀 Draft published and automatically approved!'
        : '🚀 Draft submitted for review';
    } else if (isAdminCreatingForUser && targetUserProfile) {
      // Admin created property on behalf of user
      const targetUserName = `${targetUserProfile.first_name || ''} ${targetUserProfile.last_name || ''}`.trim() || 'user';
      successMessage = `✅ Property created for ${targetUserName} and submitted for review`;
      console.log('📝 AUDIT: Admin-created property for user', {
        propertyId: propertyResult.id,
        adminId: createdByUserId,
        targetUserId: effectiveUserId,
        targetUserName,
        timestamp: new Date().toISOString()
      });
    } else if (shouldAutoApprove(userType)) {
      successMessage = 'Property automatically approved and published! ✅';
    }

    // Build response with additional metadata for admin-created properties
    const response: any = {
      success: true,
      propertyId: propertyResult.id,
      message: successMessage
    };

    // Include admin-for-user metadata in response
    if (isAdminCreatingForUser && targetUserProfile) {
      response.createdForUser = {
        userId: effectiveUserId,
        userName: `${targetUserProfile.first_name || ''} ${targetUserProfile.last_name || ''}`.trim(),
        userEmail: targetUserProfile.email,
        userType: targetUserProfile.user_type
      };
      response.createdByAdmin = createdByUserId;
    }

    return NextResponse.json(response);
    
  } catch (err: any) {
    console.error("💥💥💥 CRITICAL API ERROR 💥💥💥");
    console.error("Error message:", err?.message);
    console.error("Error stack:", err?.stack);
    console.error("Error name:", err?.name);
    console.error("Full error object:", err);
    
    return NextResponse.json({ 
      error: `API Error: ${err?.message || "Unknown error"}`,
      type: err?.name || "UnknownError",
      details: err?.stack || "No stack trace available"
    }, { status: 500 });
  }
}
