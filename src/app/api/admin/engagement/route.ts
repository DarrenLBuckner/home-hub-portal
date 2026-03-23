import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!from || !to) {
      return NextResponse.json({ error: 'Missing from/to params' }, { status: 400 })
    }

    const fromTs = `${from}T00:00:00.000Z`
    const toTs = `${to}T23:59:59.999Z`

    // ── Section A: Contact Activity Summary ──────────────────
    const { data: contactEvents } = await supabase
      .from('property_contact_events')
      .select('id, property_id, action_type, created_at')
      .gte('created_at', fromTs)
      .lte('created_at', toTs)

    const contacts = contactEvents || []
    const contactSummary = {
      whatsapp: contacts.filter(e => e.action_type === 'whatsapp').length,
      phone: contacts.filter(e => e.action_type === 'phone').length,
      email: contacts.filter(e => e.action_type === 'email').length,
      request_viewing: contacts.filter(e => e.action_type === 'request_viewing').length,
    }

    // ── Section B: Top 10 Most Contacted Properties ──────────
    // Count contacts per property
    const contactsByProperty: Record<string, { whatsapp: number; phone: number; email: number; request_viewing: number; total: number }> = {}
    contacts.forEach(e => {
      if (!contactsByProperty[e.property_id]) {
        contactsByProperty[e.property_id] = { whatsapp: 0, phone: 0, email: 0, request_viewing: 0, total: 0 }
      }
      const entry = contactsByProperty[e.property_id]
      if (e.action_type === 'whatsapp') entry.whatsapp++
      else if (e.action_type === 'phone') entry.phone++
      else if (e.action_type === 'email') entry.email++
      else if (e.action_type === 'request_viewing') entry.request_viewing++
      entry.total++
    })

    // Get top 10 property IDs by total contacts
    const topContactedIds = Object.entries(contactsByProperty)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([id]) => id)

    let topContacted: {
      property_id: string
      title: string
      city: string
      listing_type: string
      agent_name: string
      whatsapp: number
      phone: number
      email: number
      request_viewing: number
      total: number
    }[] = []

    if (topContactedIds.length > 0) {
      const { data: props } = await supabase
        .from('properties')
        .select('id, title, location, listing_type, user_id, profiles!properties_user_id_fkey(first_name, last_name)')
        .in('id', topContactedIds)

      topContacted = (props || []).map(p => {
        const counts = contactsByProperty[p.id] || { whatsapp: 0, phone: 0, email: 0, request_viewing: 0, total: 0 }
        const profile = p.profiles as { first_name: string | null; last_name: string | null } | null
        return {
          property_id: p.id,
          title: p.title || 'Untitled',
          city: p.location || '—',
          listing_type: p.listing_type || '—',
          agent_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
          whatsapp: counts.whatsapp,
          phone: counts.phone,
          email: counts.email,
          request_viewing: counts.request_viewing,
          total: counts.total,
        }
      }).sort((a, b) => b.total - a.total)
    }

    // ── Section C: Top 10 Most Viewed Properties ─────────────
    const { data: viewEvents } = await supabase
      .from('property_view_events')
      .select('id, property_id, viewed_at')
      .gte('viewed_at', fromTs)
      .lte('viewed_at', toTs)

    const views = viewEvents || []

    // Count views per property
    const viewsByProperty: Record<string, { count: number; lastViewed: string }> = {}
    views.forEach(v => {
      if (!viewsByProperty[v.property_id]) {
        viewsByProperty[v.property_id] = { count: 0, lastViewed: v.viewed_at }
      }
      viewsByProperty[v.property_id].count++
      if (v.viewed_at > viewsByProperty[v.property_id].lastViewed) {
        viewsByProperty[v.property_id].lastViewed = v.viewed_at
      }
    })

    const topViewedIds = Object.entries(viewsByProperty)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id]) => id)

    let topViewed: {
      property_id: string
      title: string
      city: string
      listing_type: string
      agent_name: string
      total_views: number
      last_viewed: string
    }[] = []

    if (topViewedIds.length > 0) {
      const { data: props } = await supabase
        .from('properties')
        .select('id, title, location, listing_type, user_id, profiles!properties_user_id_fkey(first_name, last_name)')
        .in('id', topViewedIds)

      topViewed = (props || []).map(p => {
        const v = viewsByProperty[p.id] || { count: 0, lastViewed: '' }
        const profile = p.profiles as { first_name: string | null; last_name: string | null } | null
        return {
          property_id: p.id,
          title: p.title || 'Untitled',
          city: p.location || '—',
          listing_type: p.listing_type || '—',
          agent_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
          total_views: v.count,
          last_viewed: v.lastViewed,
        }
      }).sort((a, b) => b.total_views - a.total_views)
    }

    // ── Section D: Views Over Time ───────────────────────────
    const viewsByDate: Record<string, number> = {}
    views.forEach(v => {
      const date = v.viewed_at.slice(0, 10) // YYYY-MM-DD
      viewsByDate[date] = (viewsByDate[date] || 0) + 1
    })

    const viewsOverTime = Object.entries(viewsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      contactSummary,
      topContacted,
      topViewed,
      viewsOverTime,
    })
  } catch (error) {
    console.error('Error in engagement report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
