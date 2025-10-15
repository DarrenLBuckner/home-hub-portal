import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from '@/supabase-admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Approving test property - Starting request processing');
    
    const body = await req.json();
    const { propertyId } = body;
    
    if (!propertyId) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
    }
    
    const supabase = createAdminClient();
    console.log('✅ Supabase admin client created successfully');
    
    // Update property status to active
    const { data: updatedProperty, error: updateError } = await supabase
      .from("properties")
      .update({ 
        status: "active",
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId)
      .select('id, title, listing_type, listed_by_type, status, site_id')
      .single();
    
    if (updateError) {
      console.error('Property approval error:', updateError);
      return NextResponse.json({ 
        error: `Property approval error: ${updateError.message}`,
        details: updateError.details || 'No additional details'
      }, { status: 500 });
    }
    
    console.log('✅ Test property approved successfully:', updatedProperty);
    
    return NextResponse.json({ 
      success: true,
      message: "Test property approved and set to active status",
      property: {
        id: updatedProperty.id,
        title: updatedProperty.title,
        listing_type: updatedProperty.listing_type,
        listed_by_type: updatedProperty.listed_by_type,
        status: updatedProperty.status,
        site_id: updatedProperty.site_id
      }
    });
    
  } catch (err: any) {
    console.error("💥💥💥 CRITICAL APPROVAL API ERROR 💥💥💥");
    console.error("Error message:", err?.message);
    console.error("Error stack:", err?.stack);
    
    return NextResponse.json({ 
      error: `Approval API Error: ${err?.message || "Unknown error"}`,
      type: err?.name || "UnknownError",
      details: err?.stack || "No stack trace available"
    }, { status: 500 });
  }
}