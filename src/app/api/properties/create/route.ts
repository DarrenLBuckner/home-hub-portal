import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../../../../lib/auth";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  try {
    // Read the request body once
    const body = await req.json();
    
    let userId: string;
    let userType: string;
    try {
      const auth = await requireAuth(req, body);
      userId = auth.userId;
      userType = auth.userType;
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      // Validate that user has permission to create properties
      const allowedUserTypes = ['admin', 'landlord', 'agent', 'fsbo'];
      if (!allowedUserTypes.includes(userType)) {
        return NextResponse.json({ 
          error: "Insufficient privileges", 
          message: "Only admin, landlord, agent, or FSBO users can create properties"
        }, { status: 403 });
      }
    } catch (err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Determine property type based on propertyCategory
    const isRental = body.propertyCategory === "rental";
    const isSale = body.propertyCategory === "sale";
    
    if (!isRental && !isSale) {
      return NextResponse.json({ error: "Invalid propertyCategory. Must be 'rental' or 'sale'" }, { status: 400 });
    }
    
    // Validate required fields - different for rental vs sale
    let required: string[];
    if (isRental) {
      // Rental property validation - uses different field names
      required = [
        "title", "description", "price", "propertyType", 
        "bedrooms", "bathrooms", "location",
        "images"
      ];
    } else {
      // FSBO sale property validation  
      required = [
        "title", "description", "price", "property_type", 
        "bedrooms", "bathrooms", "region", "city", "address",
        "owner_email", "owner_whatsapp",
        "images"
      ];
    }
    
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
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
          dataType: typeof file.data
        });

        // Convert file data - handle different formats
        let fileBuffer: Buffer;
        if (file.data instanceof ArrayBuffer) {
          fileBuffer = Buffer.from(file.data);
        } else if (typeof file.data === 'string') {
          // Handle base64 data URL (data:image/jpeg;base64,...)
          const base64Data = file.data.includes(',') ? file.data.split(',')[1] : file.data;
          fileBuffer = Buffer.from(base64Data, 'base64');
        } else {
          throw new Error(`Unsupported file data format: ${typeof file.data}`);
        }

        console.log(`📁 File buffer created:`, {
          size: fileBuffer.length,
          fileName: file.name
        });
        
        const fileName = `${userId}/${Date.now()}-${i}-${file.name}`;
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

    // Prepare property data for database - different structure for rental vs sale
    let propertyData: any;
    
    if (isRental) {
      // Rental property data structure
      propertyData = {
        // Basic Info
        title: body.title,
        description: body.description,
        price: parseInt(body.price),
        property_type: body.propertyType, // Note: different field name
        
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
        amenities: body.amenities || [],
        
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

    // Insert property into properties table
    const { data: propertyResult, error: dbError } = await supabase
      .from("properties")
      .insert(propertyData)
      .select('id')
      .single();
      
    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: dbError.message || "Database error" }, { status: 500 });
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
      console.error("Media insert error:", mediaError);
      // Don't fail the whole request, just log the error
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
