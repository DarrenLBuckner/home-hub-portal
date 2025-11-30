import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key')

// POST /api/email-signup - Public endpoint for marketing email collection
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const body = await request.json()
    const { email, source = 'unknown', site = 'guyana' } = body
    
    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    // Get request metadata
    const userAgent = request.headers.get('user-agent') || ''
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || null
    const referrer = request.headers.get('referer') || ''
    const pageUrl = body.pageUrl || referrer
    
    // Extract UTM parameters from referrer or body
    const utmSource = body.utmSource || null
    const utmMedium = body.utmMedium || null  
    const utmCampaign = body.utmCampaign || null
    
    // Detect country (basic implementation - can be enhanced)
    let country = 'UNKNOWN'
    if (referrer.includes('guyana') || site === 'guyana') country = 'GY'
    if (referrer.includes('jamaica') || site === 'jamaica') country = 'JM'
    
    // Save to database - just insert, don't worry about duplicates
    const { data, error } = await supabase
      .from('email_signups')
      .insert({
        email,
        source,
        site,
        page_url: pageUrl,
        user_agent: userAgent,
        ip_address: ipAddress,
        country,
        referrer,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving email signup:', error)
      return NextResponse.json({ error: 'Failed to save signup' }, { status: 500 })
    }

    // Send emails in parallel
    const emailPromises = []

    // 1. Welcome email to user
    const siteName = site === 'jamaica' ? 'Jamaica Home Hub' : 'Guyana Home Hub'
    const siteColor = site === 'jamaica' ? '#059669' : '#059669' // Can customize per site
    const countryName = site === 'jamaica' ? 'Jamaica' : 'Guyana'
    
    emailPromises.push(
      resend.emails.send({
        from: `${siteName} <hello@${site}homehub.com>`,
        to: email,
        subject: `Your ${countryName} Property Buying Guide is here!`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
            <div style="background: linear-gradient(135deg, ${siteColor} 0%, #0369a1 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">${siteName}</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Your Property Buying Guide</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 18px; color: #374151; margin-top: 0;">Welcome to ${siteName}!</p>
              
              <p style="color: #6b7280;">Thank you for your interest in ${countryName} real estate. You've taken the first step toward making an informed property investment.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: ${siteColor}; margin-top: 0;">📚 What's Next?</h3>
                <ul style="color: #374151; margin: 0; padding-left: 20px;">
                  <li>Browse our comprehensive <a href="https://${site}homehub.com/guides" style="color: ${siteColor};">Property Buying Guides</a></li>
                  <li>Explore verified <a href="https://${site}homehub.com/properties/buy" style="color: ${siteColor};">Properties for Sale</a></li>
                  <li>Connect with <a href="https://${site}homehub.com/agents" style="color: ${siteColor};">Licensed Agents</a></li>
                  <li>Get personalized assistance via <a href="https://wa.me/5927629797?text=Hi%20${siteName.replace(' ', '%20')}!%20I%20signed%20up%20for%20your%20guides%20and%20need%20help%20finding%20property." style="color: ${siteColor};">WhatsApp</a></li>
                </ul>
              </div>
              
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;"><strong>💡 Pro Tip:</strong> Start with our <a href="https://${site}homehub.com/guides/buying-from-abroad" style="color: #92400e;">Complete Guide to Buying Property from Abroad</a> if you're part of the diaspora.</p>
              </div>
              
              <p style="color: #6b7280;">We're here to help you navigate the ${countryName} real estate market safely and successfully.</p>
              
              <p style="color: #374151;">
                Best regards,<br>
                <strong>The ${siteName} Team</strong>
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">
                You're receiving this email because you signed up for property guides on ${siteName}.<br>
                <a href="https://${site}homehub.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #6b7280;">Unsubscribe</a> • 
                <a href="https://${site}homehub.com/privacy" style="color: #6b7280;">Privacy Policy</a>
              </p>
            </div>
          </div>
        `
      })
    )

    // 2. Notification email to you
    emailPromises.push(
      resend.emails.send({
        from: 'Portal Home Hub <system@portalhomehub.com>',
        to: 'darren@portalhomehub.com',
        subject: `New ${siteName} signup from ${country}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">New Email Signup - ${siteName}</h2>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">📧 Contact Details</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Country:</strong> ${country}</p>
              <p><strong>Site:</strong> ${siteName}</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">📊 Signup Details</h3>
              <p><strong>Source:</strong> ${source}</p>
              <p><strong>Page:</strong> ${pageUrl}</p>
              <p><strong>Referrer:</strong> ${referrer || 'Direct'}</p>
              <p><strong>IP:</strong> ${ipAddress || 'Unknown'}</p>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            </div>
            
            ${utmSource || utmMedium || utmCampaign ? `
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">🎯 Marketing Attribution</h3>
              ${utmSource ? `<p><strong>UTM Source:</strong> ${utmSource}</p>` : ''}
              ${utmMedium ? `<p><strong>UTM Medium:</strong> ${utmMedium}</p>` : ''}
              ${utmCampaign ? `<p><strong>UTM Campaign:</strong> ${utmCampaign}</p>` : ''}
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://portalhomehub.com/admin/leads" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View All Leads →</a>
            </div>
          </div>
        `
      })
    )

    // Send both emails (don't wait for them to complete)
    Promise.all(emailPromises).catch(error => {
      console.error('Error sending emails:', error)
      // Don't fail the request if emails fail
    })

    return NextResponse.json({ 
      success: true,
      message: 'Successfully signed up for property guides'
    })

  } catch (error) {
    console.error('Email signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/email-signup - Get signup stats (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Basic auth check - enhance this as needed
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.includes('Bearer')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get recent signups
    const { data, error } = await supabase
      .from('email_signups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching signups:', error)
      return NextResponse.json({ error: 'Failed to fetch signups' }, { status: 500 })
    }

    // Get counts by site and source
    const { data: stats, error: statsError } = await supabase
      .from('email_signups')
      .select('site, source, country, count(*)')
      .group('site, source, country')

    return NextResponse.json({ 
      signups: data,
      stats: stats || []
    })

  } catch (error) {
    console.error('Get signups error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}