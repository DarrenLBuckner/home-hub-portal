import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role for inserts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Category labels for user-friendly messages
const CATEGORY_LABELS: Record<string, string> = {
  'general-contractors': 'General Contractors',
  'legal-financial': 'Legal & Financial',
  'interior-design': 'Interior Design',
  'landscaping': 'Landscaping',
  'security': 'Security Services',
  'cleaning': 'Cleaning Services',
  'moving': 'Moving Services',
  'pest-control': 'Pest Control',
  'hvac': 'HVAC Services',
  'plumbing': 'Plumbing',
  'electrical': 'Electrical',
  'roofing': 'Roofing',
};

interface BusinessRequestData {
  site_id: string;
  email: string;
  category: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: BusinessRequestData = await request.json();

    // Validate required fields
    const requiredFields = ['site_id', 'email', 'category'];
    const missingFields = requiredFields.filter(field => !data[field as keyof BusinessRequestData]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate site_id
    const siteId = data.site_id.toUpperCase();
    if (!['GY', 'JM'].includes(siteId)) {
      return NextResponse.json(
        { error: 'Invalid site_id. Must be GY or JM.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Prepare data for database insertion
    const requestData = {
      site_id: siteId,
      email: data.email.toLowerCase(),
      category: data.category,
    };

    // Insert into database
    const { error } = await supabase
      .from('business_requests')
      .insert([requestData]);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save request. Please try again.' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Get category label for message
    const categoryLabel = CATEGORY_LABELS[data.category] || data.category;

    console.log(`Business request saved: ${data.email} wants ${data.category} in ${siteId}`);

    return NextResponse.json(
      {
        success: true,
        message: `We'll notify you when ${categoryLabel} businesses join our directory.`,
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Business request API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
