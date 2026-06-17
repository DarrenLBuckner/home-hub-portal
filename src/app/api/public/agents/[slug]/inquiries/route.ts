import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Public seller/referral lead capture for the Premier Agent Sites Platform.
// Called server-to-server from [firstname]list.com/list (with the www host).
// Service-role INSERT — RLS is ON and blocks anon writes. No CORS for v1.
// Non-POST methods auto-return 405 (no handler exported).

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
    }

    // Honeypot: real users never fill company_website. Silent spam drop —
    // return success but do NOT insert.
    if (typeof body?.company_website === 'string' && body.company_website.trim() !== '') {
      return NextResponse.json({ ok: true })
    }

    // Validate
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const rawType = body?.type
    const type = rawType === undefined || rawType === null || rawType === '' ? 'seller' : rawType

    if (!name) {
      return NextResponse.json({ ok: false, error: 'name_required' }, { status: 400 })
    }
    if (type !== 'seller' && type !== 'referral') {
      return NextResponse.json({ ok: false, error: 'invalid_type' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Resolve agent by slug
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, full_name, phone, user_type')
      .eq('slug', slug)
      .eq('user_type', 'agent')
      .limit(1)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: 'agent_not_found' }, { status: 404 })
    }

    // Empty strings -> null for optional lead fields
    const str = (v: any) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)

    const phone = str(body?.phone)
    const whatsapp = str(body?.whatsapp) ?? phone
    const listingIntent = str(body?.listing_intent) ?? 'sale'
    const httpReferrer = request.headers.get('referer')

    const { error: insertError } = await supabase
      .from('listing_inquiries')
      .insert({
        agent_id: profile.id,
        agent_slug: slug,
        type,
        name,
        phone,
        whatsapp,
        email: str(body?.email),
        listing_intent: listingIntent,
        property_type: str(body?.property_type),
        region: str(body?.region),
        location: str(body?.location),
        asking_price: str(body?.asking_price),
        timeline: str(body?.timeline),
        message: str(body?.message),
        referred_name: str(body?.referred_name),
        referred_contact: str(body?.referred_contact),
        territory: 'GY',
        source: 'agent_site_list_page',
        page_url: str(body?.page_url),
        http_referrer: httpReferrer,
        session_id: str(body?.session_id),
        device: str(body?.device),
        utm_source: str(body?.utm_source),
        utm_medium: str(body?.utm_medium),
        utm_campaign: str(body?.utm_campaign),
        // status / created_at / updated_at use DB defaults
      })

    if (insertError) {
      console.error('listing_inquiries insert error:', insertError)
      return NextResponse.json({ ok: false, error: 'insert_failed' }, { status: 500 })
    }

    // Normalize the AGENT's WhatsApp number to digits for the click-to-chat link
    const waDigits = (profile.phone || '').replace(/\D/g, '')

    return NextResponse.json({
      ok: true,
      whatsapp: waDigits || null,
      agent_first_name:
        profile.first_name || profile.full_name?.split(' ')[0] || 'the agent',
    })
  } catch (error) {
    console.error('Error in listing inquiries API:', error)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
