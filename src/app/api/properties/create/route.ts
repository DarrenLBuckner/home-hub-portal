import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs'; // avoid Edge runtime issues

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Properties Create API - Starting request processing');
    console.log('🔍 Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
    
    // Create supabase server client
    const cookieStore = await cookies();
    console.log('✅ Cookies retrieved successfully');
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
    console.log('✅ Supabase client created successfully');
    
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
    
    console.log('Authenticated as:', user.email);
    
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
    
    // Auto-approval for admins and owner admins  
    const shouldAutoApprove = (userType: string): boolean => {
      const adminTypes = ['admin', 'superadmin', 'owner'];
      return adminTypes.includes(userType?.toLowerCase() || '');
    };
    
    // Read the request body once
    const body = await req.json();
    
    // Check if this is a draft save operation
    const isDraftSave = body._isDraftSave === true || body.status === 'draft';
    const isPublishDraft = body._isPublishDraft === true;
    
    console.log('📋 Request type:', { isDraftSave, isPublishDraft, status: body.status });
    
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
      status: isDraftSave ? 'draft' : (shouldAutoApprove(userType) ? 'approved' : 'pending')
    };
    
    const userId = user.id;
    
    // Validate that user has permission to create properties
    const allowedUserTypes = ['admin', 'landlord', 'agent', 'fsbo'];
    if (!allowedUserTypes.includes(userType)) {
      return NextResponse.json({ 
        error: "Insufficient privileges", 
        message: "Only admin, landlord, agent, or FSBO users can create properties"
      }, { status: 403 });
    }
    
    // Determine property type based on propertyCategory and userType
    const isRental = body.propertyCategory === "rental";
    const isSale = body.propertyCategory === "sale";
    const isAgent = userType === "agent";
    
    // Skip validation for drafts
    if (!isDraftSave && !isRental && !isSale) {
      return NextResponse.json({ error: "Invalid propertyCategory. Must be 'rental' or 'sale'" }, { status: 400 });
    }
    
    // Validate required fields - more lenient for drafts
    if (!isDraftSave) {
      let requiredFields = [
        "title", "description", "price", "property_type",
        "listing_type", "bedrooms", "bathrooms", "region", "city"
      ];
      
      // Add user-type specific required fields
      if (userType === 'fsbo') {
        requiredFields = [
          ...requiredFields,
          "owner_email", "owner_whatsapp"
        ];
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
        console.log('⚠️ Draft save with minimal validation - missing:', missingMinimalFields);
        // Don't fail, just ensure we have some basic structure
        normalizedPayload.property_type = normalizedPayload.property_type || 'house';
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
    const isEligibleAdmin = adminLevel === 'super' || adminLevel === 'owner';

    console.log('🔍 BULLETPROOF Admin Detection:', {
      email: userProfile.email,
      emailNormalized: userProfile.email?.toLowerCase().trim(),
      adminLevel,
      isEligibleAdmin,
      registryCheck: {
        super: ADMIN_REGISTRY.super.includes(userProfile.email?.toLowerCase().trim() || ''),
        owner: ADMIN_REGISTRY.owner.includes(userProfile.email?.toLowerCase().trim() || '')
      }
    });

    console.log('🔍 Final Admin Status:', {
      isEligibleAdmin,
      email: userProfile.email,
      emailNormalized: userProfile.email?.toLowerCase().trim(),
      adminLevel: adminLevel,
      userType: userProfile.user_type
    });

    // CRITICAL DEBUG - Add a clear marker for admin path
    if (isEligibleAdmin) {
      console.log('🚨🚨🚨 ADMIN PATH CONFIRMED - BYPASSING REGULAR LIMITS 🚨🚨🚨');
      console.log('Admin details:', {
        email: userProfile.email,
        adminLevel: adminLevel,
        shouldBypassLimits: true
      });
    } else {
      console.log('❌❌❌ NOT ADMIN - WILL USE REGULAR LIMITS ❌❌❌');
      console.log('Non-admin details:', {
        email: userProfile.email,
        userType: userProfile.user_type,
        adminLevel: null
      });
    }

    // Remove old conflicting admin detection code

    if (isEligibleAdmin) {
      console.log('🎯 ADMIN PATH TAKEN - Using database property limits for:', {
        email: userProfile.email,
        adminLevel: adminLevel,
        userType: userProfile.user_type
      });
      
      // For admin users, check if there's a specific property limit
      // Default to unlimited for admin users (can be overridden by additional admin settings)
      let propertyLimit = null; // null = unlimited by default for admins
      
      // Only check limits if propertyLimit is not NULL (super admin has NULL = unlimited)
      if (propertyLimit !== null) {
        // Count only live/pending properties for owner admin with limits
        // Rejected properties don't count since they're not actual listings on the site
        const { count: totalCount, error: totalCountError } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('status', ['active', 'pending', 'draft']);

        if (totalCountError) {
          console.error('Admin property count error:', totalCountError);
          return NextResponse.json({ 
            error: "Unable to verify admin property limits. Please contact support." 
          }, { status: 500 });
        }
        
        // Check against database property limit for owner admin
        if ((totalCount || 0) >= propertyLimit) {
          console.error('❌ Owner admin property limit exceeded');
          return NextResponse.json({ 
            error: `Property limit reached. Admin accounts allow ${propertyLimit} properties. You currently have ${totalCount || 0}.` 
          }, { status: 403 });
        }
        
        console.log('✅ Owner admin property limits check passed:', {
          email: userProfile.email,
          adminLevel: adminLevel,
          totalCount: totalCount || 0,
          propertyLimit: propertyLimit,
          listingType: normalizedPayload.listing_type
        });
      } else {
        console.log('✅ Super admin unlimited access - no property limit check:', {
          email: userProfile.email,
          adminLevel: adminLevel,
          propertyLimit: 'UNLIMITED'
        });
      }
      
    } else {
      // For all other users (agents, landlords, FSBO) - use enhanced property limits system
      console.log('🔍 Using enhanced property limits system for NON-ADMIN user:', {
        userType: userProfile.user_type,
        email: userProfile.email,
        isEligibleAdmin: false
      });
      
      // Use the new enhanced property limits check
      const { data: limitResult, error: limitCheckError } = await supabase
        .rpc('can_user_create_property_enhanced', { 
          user_uuid: userId,
          property_listing_type: normalizedPayload.listing_type,
          property_category: body.propertyCategory 
        });

      if (limitCheckError) {
        console.error('Enhanced property limit check error:', limitCheckError);
        return NextResponse.json({ 
          error: "Unable to verify property limits. Please contact support." 
        }, { status: 500 });
      }

      const result = limitResult?.[0];
      if (!result?.can_create) {
        console.error('❌ Enhanced property limit exceeded for non-admin user');
        
        // Provide specific error messages based on user type
        let errorMessage = result?.reason || 'Property limit exceeded';
        
        if (userProfile.user_type === 'landlord') {
          errorMessage = `Landlord limit reached: You can list only 1 property for free. You currently have ${result?.current_count || 0} properties. Please upgrade to list more.`;
        } else if (userProfile.user_type === 'fsbo') {
          errorMessage = `FSBO limit reached: You can list only 1 property for free. You currently have ${result?.current_count || 0} properties. Please upgrade to list more.`;
        } else if (result?.trial_active && result?.trial_expires) {
          const daysRemaining = Math.max(0, Math.ceil((new Date(result.trial_expires).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
          errorMessage = `Free trial limit reached: ${result?.current_count || 0}/${result?.max_allowed || 10} properties used. ${daysRemaining} days remaining in trial. Please upgrade to list more properties.`;
        }
        
        return NextResponse.json({ 
          error: errorMessage,
          details: {
            current_count: result?.current_count || 0,
            max_allowed: result?.max_allowed || 0,
            trial_active: result?.trial_active || false,
            trial_expires: result?.trial_expires || null
          }
        }, { status: 403 });
      }

      console.log('✅ Enhanced property limits check passed for non-admin:', {
        userType: userProfile.user_type,
        can_create: result?.can_create,
        current_count: result?.current_count,
        max_allowed: result?.max_allowed,
        trial_active: result?.trial_active
      });
    }

    // Enforce image limits (15 for rental, 20 for FSBO) - skip for drafts
    if (!isDraftSave && body.images && body.images.length > 0) {
      const maxImages = isRental ? 15 : 20;
      if (body.images.length > maxImages) {
        return NextResponse.json({ error: `Image limit exceeded (${maxImages} allowed)` }, { status: 400 });
      }
    }
    
    // Require at least one image for full submissions, optional for drafts
    if (!isDraftSave && (!body.images || body.images.length < 1)) {
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
    }
    
    // Ensure images array exists (empty for drafts without images)
    if (!body.images) {
      body.images = [];
    }

    // Upload images to Supabase Storage
    const imageUrls: string[] = [];
    for (let i = 0; i < body.images.length; i++) {
      const file = body.images[i];
      try {
        console.log(`📸 Processing image ${i + 1}:`, {
          name: file.name,
          type: file.type,
          hasData: !!file.data,
          dataType: typeof file.data,
          isFile: file.data instanceof File,
          constructor: file.data?.constructor?.name
        });

        // Convert file data - handle different formats including File objects
        let fileBuffer: Buffer;
        if (file.data instanceof File) {
          // Handle File object - convert to ArrayBuffer first
          const arrayBuffer = await file.data.arrayBuffer();
          fileBuffer = Buffer.from(arrayBuffer);
        } else if (file.data instanceof ArrayBuffer) {
          fileBuffer = Buffer.from(file.data);
        } else if (typeof file.data === 'string') {
          // Handle base64 data URL (data:image/jpeg;base64,...)
          const base64Data = file.data.includes(',') ? file.data.split(',')[1] : file.data;
          
          // Validate base64 size (base64 is ~33% larger than original)
          const estimatedSize = (base64Data.length * 3) / 4;
          if (estimatedSize > 15 * 1024 * 1024) { // 15MB limit after base64 conversion
            throw new Error(`Image too large after conversion: ${Math.round(estimatedSize / 1024 / 1024)}MB (15MB max)`);
          }
          
          fileBuffer = Buffer.from(base64Data, 'base64');
        } else {
          throw new Error(`Unsupported file data format: ${typeof file.data} (constructor: ${file.data?.constructor?.name})`);
        }

        console.log(`📁 File buffer created:`, {
          size: fileBuffer.length,
          fileName: file.name
        });
        
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}-${file.name}`;
        const { data, error } = await supabase.storage
          .from("property-images")
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false,
          });

        if (error) {
          console.error(`🚨 Storage upload error for ${file.name}:`, error);
          throw error;
        }
          
        if (!data?.path) {
          throw new Error("No file path returned from storage");
        }

        console.log(`✅ File uploaded successfully:`, data.path);
        
        const { data: urlData } = supabase.storage
          .from("property-images")
          .getPublicUrl(data.path);
          
        if (!urlData?.publicUrl) {
          throw new Error("Failed to get public URL");
        }

        console.log(`🔗 Public URL generated:`, urlData.publicUrl);
        imageUrls.push(urlData.publicUrl);
      } catch (err) {
        console.error(`❌ Image upload error for file ${i + 1} (${file.name}):`, err);
        return NextResponse.json({ 
          error: `Image upload failed for file ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`,
          fileDetails: {
            name: file.name,
            type: file.type,
            size: file.data ? (typeof file.data === 'string' ? file.data.length : file.data.byteLength || 'unknown') : 'no data'
          }
        }, { status: 500 });
      }
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
        listing_type: body.listing_type, // 'sale' or 'rent'
        
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
        listed_by_type: 'agent',
        
        // Video URL (for Pro/Elite tier agents)
        video_url: body.video_url || null,
        
        // System fields
        user_id: userId,
        status: body.status || (shouldAutoApprove(userType) ? 'active' : 'draft'),
        site_id: body.site_id || 'guyana',  // Multi-tenant support
        country_id: userProfile?.country_id || 'GY',  // ✅ Use 'GY' not 1
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
        user_id: userId,
        listing_type: 'rent',
        listed_by_type: 'landlord',
        status: body.status || (shouldAutoApprove(userType) ? 'active' : 'off_market'),
        site_id: body.site_id || 'guyana',  // Multi-tenant support
        country_id: userProfile?.country_id || 'GY',  // ✅ Use 'GY' not 1
        propertyCategory: 'rental',
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
        user_id: userId,
        listing_type: 'sale',
        listed_by_type: 'owner',
        status: body.status || (shouldAutoApprove(userType) ? 'active' : 'off_market'),
        site_id: body.site_id || 'guyana',  // Multi-tenant support
        country_id: userProfile?.country_id || 'GY',  // ✅ Use 'GY' not 1
        
        // Legacy/additional fields
        propertyCategory: 'sale',
        created_at: new Date().toISOString(),
      };
    }

    // Log the data being inserted for debugging
    console.log('🔧 Inserting property data:', {
      userType,
      isAgent,
      isRental,
      isSale,
      propertyData: {
        ...propertyData,
        // Don't log sensitive data, just structure
        title: propertyData.title,
        property_type: propertyData.property_type,
        listing_type: propertyData.listing_type,
        status: propertyData.status,
        user_id: propertyData.user_id
      }
    });

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

    console.log('📸 Inserting property media:', {
      propertyId: propertyResult.id,
      imageCount: imageUrls.length,
      mediaInserts: mediaInserts.length
    });

    const { error: mediaError } = await supabase
      .from("property_media")
      .insert(mediaInserts);
      
    if (mediaError) {
      console.error("💥 Media insert error:", mediaError);
      console.error("💥 Failed media inserts:", mediaInserts);
      // Don't fail the whole request, just log the error
    } else {
      console.log('✅ Property media inserted successfully');
    }

    // Determine success message based on operation type and user status
    let successMessage = 'Property submitted for review';
    
    if (isDraftSave) {
      successMessage = '💾 Draft saved successfully';
    } else if (isPublishDraft) {
      successMessage = shouldAutoApprove(userType) 
        ? '🚀 Draft published and automatically approved!' 
        : '🚀 Draft submitted for review';
    } else if (shouldAutoApprove(userType)) {
      successMessage = 'Property automatically approved and published! ✅';
    }

    return NextResponse.json({ 
      success: true, 
      propertyId: propertyResult.id,
      message: successMessage
    });
    
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
