import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../../../../lib/auth";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Helper function to map country to site_id
function getSiteIdFromCountry(country: string): string {
  if (!country) return 'portal';
  
  const countryLower = country.toLowerCase();
  if (countryLower.includes('guyana')) return 'guyana';
  if (countryLower.includes('ghana')) return 'ghana';
  return 'portal';
}

export async function POST(req: NextRequest) {
  try {
    let userId: string;
    try {
      const auth = await requireAuth(req);
      userId = auth.userId;
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } catch (err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    
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
        "bedrooms", "bathrooms", "squareFootage", 
        "location", "images"
      ];
    } else {
      // FSBO sale property validation
      required = [
        "title", "description", "price", "property_type", 
        "bedrooms", "bathrooms", "house_size_value", 
        "region", "city", "owner_email", "owner_whatsapp",
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
        // Convert file data if it's base64
        const fileBuffer = file.data instanceof ArrayBuffer ? file.data : 
          Buffer.from(file.data.split(',')[1], 'base64');
        
        const fileName = `${userId}/${Date.now()}-${i}-${file.name}`;
        const { data, error } = await supabase.storage
          .from("property-images")
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false,
          });
          
        if (error || !data?.path) throw error;
        
        const { data: urlData } = supabase.storage
          .from("property-images")
          .getPublicUrl(data.path);
          
        if (!urlData?.publicUrl) throw new Error("Failed to get public URL");
        imageUrls.push(urlData.publicUrl);
      } catch (err) {
        console.error("Image upload error:", err);
        return NextResponse.json({ error: `Image upload failed for file ${i + 1}` }, { status: 500 });
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
        site_id: getSiteIdFromCountry(body.country),
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
        site_id: getSiteIdFromCountry(body.region), // Use region since FSBO doesn't have country field
        
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
