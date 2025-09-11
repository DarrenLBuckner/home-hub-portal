import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../../../../../lib/auth";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    const propertyId = params.id;
    const body = await req.json();
    
    // Validate required fields
    const required = [
      "title", "description", "price", "property_type", 
      "bedrooms", "bathrooms", "house_size_value", 
      "region", "city", "owner_email", "owner_whatsapp"
    ];
    
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData = {
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
    };

    // Update property in properties table
    const { data: propertyResult, error: dbError } = await supabase
      .from("properties")
      .update(updateData)
      .eq('id', propertyId)
      .eq('user_id', userId) // Ensure user owns this property
      .select('id')
      .single();
      
    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: dbError.message || "Database error" }, { status: 500 });
    }

    if (!propertyResult) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      propertyId: propertyResult.id,
      message: 'Property updated successfully'
    });
    
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}