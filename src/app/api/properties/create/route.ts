import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs'; // avoid Edge runtime issues

export async function POST(req: NextRequest) {
  try {
    // Create supabase server client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    
    console.log('Authenticated as:', user.email);
    
    // Get user profile for permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, email')
      .eq('id', user.id)
      .single();
      
    if (profileError || !userProfile) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: "User profile not found" }, { status: 401 });
    }
    
    const userType = userProfile.user_type;
    
    // Read the request body once
    const body = await req.json();
    
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
      // Set default status
      status: 'pending'
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
    
    if (!isRental && !isSale) {
      return NextResponse.json({ error: "Invalid propertyCategory. Must be 'rental' or 'sale'" }, { status: 400 });
    }
    
    // Validate required fields for all property types
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
    
    // Always require images
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

    // Special admin privileges ONLY for super admins and owner admins
    const adminConfig: { [email: string]: { level: string } } = {
      'mrdarrenbuckner@gmail.com': { level: 'super' },
      'qumar@guyanahomehub.com': { level: 'owner' },
      'Qumar@guyanahomehub.com': { level: 'owner' } // Handle both cases
    };

    // Check if user is a super admin or owner admin
    console.log('🔍 Admin Check Debug:', {
      userEmail: userProfile.email,
      userType: userProfile.user_type,
      emailInConfig: !!adminConfig[userProfile.email],
      configLevel: adminConfig[userProfile.email]?.level,
      adminConfigEmails: Object.keys(adminConfig)
    });

    // More lenient admin check - check email first, then user_type as fallback
    const isEligibleAdmin = userProfile && 
                           adminConfig[userProfile.email] && 
                           ['super', 'owner'].includes(adminConfig[userProfile.email].level);

    console.log('🔍 Final Admin Status:', {
      isEligibleAdmin,
      email: userProfile.email,
      userType: userProfile.user_type
    });

    if (isEligibleAdmin) {
      // Special limits ONLY for super admins and owner admins  
      const saleLimit = 20;
      const rentalLimit = 5;
      
      // Count their existing properties
      const { count: saleCount, error: saleCountError } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('listing_type', 'sale')
        .in('status', ['active', 'pending', 'draft']);
        
      const { count: rentalCount, error: rentalCountError } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('listing_type', 'rent')
        .in('status', ['active', 'pending', 'draft']);

      if (saleCountError || rentalCountError) {
        console.error('Admin property count error:', { saleCountError, rentalCountError });
        return NextResponse.json({ 
          error: "Unable to verify admin property limits. Please contact support." 
        }, { status: 500 });
      }
      
      // Check against special admin limits
      if (normalizedPayload.listing_type === 'sale' && (saleCount || 0) >= saleLimit) {
        console.error('❌ Admin sale property limit exceeded');
        return NextResponse.json({ 
          error: `Sale property limit reached. Admin accounts allow ${saleLimit} sale properties. You currently have ${saleCount || 0}.` 
        }, { status: 403 });
      }
      
      if (normalizedPayload.listing_type === 'rent' && (rentalCount || 0) >= rentalLimit) {
        console.error('❌ Admin rental property limit exceeded');
        return NextResponse.json({ 
          error: `Rental property limit reached. Admin accounts allow ${rentalLimit} rental properties. You currently have ${rentalCount || 0}.` 
        }, { status: 403 });
      }

      console.log('✅ Admin property limits check passed:', {
        email: userProfile.email,
        adminLevel: adminConfig[userProfile.email].level,
        saleCount: saleCount || 0,
        rentalCount: rentalCount || 0,
        saleLimit,
        rentalLimit
      });
      
    } else {
      // For all other users (agents, landlords, FSBO) - use existing subscription-based system
      console.log('🔍 Using subscription-based limits for user:', {
        userType: userProfile.user_type,
        email: userProfile.email
      });
      
      // Use the existing subscription-based check
      const { data: canCreate, error: limitCheckError } = await supabase
        .rpc('can_user_create_property', { user_uuid: userId });

      if (limitCheckError) {
        console.error('Property limit check error:', limitCheckError);
        return NextResponse.json({ 
          error: "Unable to verify property limits. Please contact support." 
        }, { status: 500 });
      }

      if (!canCreate) {
        // Get current property count for better error message
        const { data: propertyCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('status', ['active', 'pending', 'draft']);

        const count = propertyCount || 0;
        
        console.error('❌ Subscription property limit exceeded');
        return NextResponse.json({ 
          error: `Property limit exceeded. You have ${count} properties and your current plan limits have been reached. Please upgrade your subscription or purchase additional properties.` 
        }, { status: 403 });
      }

      console.log('✅ Subscription-based property limits check passed');
    }

    // Enforce image limits (15 for rental, 20 for FSBO)
    const maxImages = isRental ? 15 : 20;
    if (body.images.length > maxImages) {
      return NextResponse.json({ error: `Image limit exceeded (${maxImages} allowed)` }, { status: 400 });
    }
    
    if (body.images.length < 1) {
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
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
        
        // System fields
        user_id: userId,
        status: body.status || 'draft',
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
        amenities: body.features || [], // Map features to amenities
        
        // Location - rental uses different structure
        location: body.location, // Specific address field
        country: body.country,
        region: body.region,
        city: body.region, // Use region as city for rentals
        
        // Rental-specific fields
        rental_type: body.rentalType || 'monthly',
        currency: body.currency || 'GYD',
        
        // System fields
        user_id: userId,
        listing_type: 'rent',
        listed_by_type: 'landlord',
        status: body.status || 'off_market',
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
        amenities: normalizedPayload.amenities || [],
        
        // Step 3 - Location
        region: body.region,
        city: body.city,
        neighborhood: body.neighborhood || null,
        
        // Step 5 - Contact
        owner_email: body.owner_email,
        owner_whatsapp: body.owner_whatsapp,
        
        // System fields (auto-populated)
        user_id: userId,
        listing_type: 'sale',
        listed_by_type: 'owner',
        status: body.status || 'off_market',
        
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

    return NextResponse.json({ 
      success: true, 
      propertyId: propertyResult.id,
      message: body.status === 'draft' ? 'Property saved as draft' : 'Property submitted for review'
    });
    
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
