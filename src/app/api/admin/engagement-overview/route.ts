import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    
    // Simple approach: Just check if user exists (use your existing admin auth)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const countryFilter = searchParams.get('country') // For country filtering
    
    console.log(`🔍 Admin engagement request - Country filter: ${countryFilter}`)

    // Build query for properties - keep it simple
    let propertiesQuery = supabase
      .from('properties')
      .select(`
        id,
        title,
        price,
        location,
        site_id,
        user_id,
        created_at,
        images,
        profiles!properties_user_id_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .eq('status', 'active')

    // Apply country filter if specified
    if (countryFilter && countryFilter !== 'all') {
      propertiesQuery = propertiesQuery.eq('site_id', countryFilter)
    }

    const { data: properties, error: propertiesError } = await propertiesQuery

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
    }

    if (!properties || properties.length === 0) {
      return NextResponse.json({
        summary: {
          total_properties: 0,
          total_likes: 0,
          total_favorites: 0,
          total_agents: 0,
          countries: []
        },
        agents: [],
        top_properties: [],
        country_breakdown: []
      })
    }

    // Get likes data for all properties
    const propertyIds = properties.map(p => p.id)
    const { data: likesData, error: likesError } = await supabase
      .from('property_likes')
      .select('property_id, created_at')
      .in('property_id', propertyIds)

    if (likesError) {
      console.error('Error fetching likes:', likesError)
    }

    // Count likes per property
    const likesCount: Record<string, number> = {}
    likesData?.forEach(like => {
      likesCount[like.property_id] = (likesCount[like.property_id] || 0) + 1
    })

    // Group properties by agent
    const agentMetrics: Record<string, {
      agent_id: string
      agent_name: string
      agent_email: string
      properties_count: number
      total_likes: number
      total_favorites: number
      total_engagement: number
      countries: string[]
    }> = {}

    // Group properties by country
    const countryMetrics: Record<string, {
      country: string
      properties_count: number
      total_likes: number
      agents_count: number
    }> = {}

    properties.forEach(property => {
      const agentId = property.user_id
      const agentName = property.profiles ? `${property.profiles.first_name || ''} ${property.profiles.last_name || ''}`.trim() : 'Unknown'
      const agentEmail = property.profiles?.email || 'Unknown'
      const likes = likesCount[property.id] || 0
      const favorites = Math.floor(likes * 0.3) // Estimate for now
      const country = property.site_id || 'unknown'

      // Agent metrics
      if (!agentMetrics[agentId]) {
        agentMetrics[agentId] = {
          agent_id: agentId,
          agent_name: agentName,
          agent_email: agentEmail,
          properties_count: 0,
          total_likes: 0,
          total_favorites: 0,
          total_engagement: 0,
          countries: []
        }
      }

      agentMetrics[agentId].properties_count++
      agentMetrics[agentId].total_likes += likes
      agentMetrics[agentId].total_favorites += favorites
      agentMetrics[agentId].total_engagement += likes + favorites
      
      if (!agentMetrics[agentId].countries.includes(country)) {
        agentMetrics[agentId].countries.push(country)
      }

      // Country metrics
      if (!countryMetrics[country]) {
        countryMetrics[country] = {
          country,
          properties_count: 0,
          total_likes: 0,
          agents_count: 0
        }
      }

      countryMetrics[country].properties_count++
      countryMetrics[country].total_likes += likes
    })

    // Count unique agents per country
    Object.values(countryMetrics).forEach(country => {
      const agentsInCountry = new Set()
      properties.forEach(property => {
        if (property.site_id === country.country) {
          agentsInCountry.add(property.user_id)
        }
      })
      country.agents_count = agentsInCountry.size
    })

    // Create top properties list
    const topProperties = properties
      .map(property => ({
        property_id: property.id,
        title: property.title,
        price: property.price,
        location: property.location,
        country: property.site_id,
        agent_name: property.profiles ? `${property.profiles.first_name || ''} ${property.profiles.last_name || ''}`.trim() : 'Unknown',
        likes_count: likesCount[property.id] || 0,
        favorites_count: Math.floor((likesCount[property.id] || 0) * 0.3),
        total_engagement: (likesCount[property.id] || 0) + Math.floor((likesCount[property.id] || 0) * 0.3),
        image_url: property.images?.[0] || null
      }))
      .sort((a, b) => b.total_engagement - a.total_engagement)
      .slice(0, 10)

    // Calculate summary
    const totalLikes = Object.values(likesCount).reduce((sum, count) => sum + count, 0)
    const totalFavorites = Math.floor(totalLikes * 0.3)
    const uniqueCountries = Array.from(new Set(properties.map(p => p.site_id).filter(Boolean)))

    const summary = {
      total_properties: properties.length,
      total_likes: totalLikes,
      total_favorites: totalFavorites,
      total_agents: Object.keys(agentMetrics).length,
      countries: uniqueCountries
    }

    // Convert to arrays and sort
    const agents = Object.values(agentMetrics)
      .sort((a, b) => b.total_engagement - a.total_engagement)

    const country_breakdown = Object.values(countryMetrics)
      .sort((a, b) => b.total_likes - a.total_likes)

    return NextResponse.json({
      total_properties: properties.length,
      total_likes: totalLikes,
      total_agents: Object.keys(agentMetrics).length,
      top_properties: topProperties,
      country_breakdown
    })

  } catch (error) {
    console.error('Error in engagement overview:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}