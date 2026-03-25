import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, category, description, phone, website, address } = body

    if (!name || !email || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createServiceRoleClient()

    const { error } = await supabase.from('service_providers').insert({
      name,
      email,
      category,
      description: description || null,
      phone: phone || null,
      website: website || null,
      address: address || null,
      site_id: 'GY',
      status: 'pending',
      verified: false,
      featured: false,
      source: 'self-submitted',
    })

    if (error) {
      console.error('Business submission insert error:', error)
      return NextResponse.json(
        { error: 'Submission failed. Please try again.' },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    console.error('Business submission error:', error)
    return NextResponse.json(
      { error: 'Submission failed. Please try again.' },
      { status: 500, headers: corsHeaders }
    )
  }
}
