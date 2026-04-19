import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceRoleClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const ALLOWED_CATEGORIES = new Set([
  'real-estate-agents',
  'renovations',
  'electrical',
  'interior',
  'landscaping',
  'building-materials',
  'moving-storage',
  'cleaning',
  'security',
  'legal-financial',
  'insurance',
  'inspection',
  'photography-media',
  'general-contractors',
])

// Display names kept for email readability only — never stored.
const CATEGORY_LABELS: Record<string, string> = {
  'real-estate-agents': 'Real Estate Agents',
  'renovations': 'Renovations & Repairs',
  'electrical': 'Electrical & Plumbing',
  'interior': 'Interior & Furniture',
  'landscaping': 'Landscaping & Garden',
  'building-materials': 'Building Materials & Hardware',
  'moving-storage': 'Moving & Storage',
  'cleaning': 'Cleaning Services',
  'security': 'Security & Safety',
  'legal-financial': 'Legal & Financial',
  'insurance': 'Insurance & Banking',
  'inspection': 'Inspection Services',
  'photography-media': 'Photography & Media',
  'general-contractors': 'General Contractors',
}

// In-memory rate limiter: 3 submissions / hour / IP.
// Single-instance only — basic spam protection per brief.
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const rateBucket = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  const entry = rateBucket.get(ip)
  if (!entry || now >= entry.resetAt) {
    rateBucket.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { ok: true }
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) }
  }
  entry.count += 1
  return { ok: true }
}

function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  const real = request.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rate = checkRateLimit(ip)
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        {
          status: 429,
          headers: { ...corsHeaders, 'Retry-After': String(rate.retryAfterSec) },
        }
      )
    }

    const body = await request.json()
    const { name, email, category, description, phone, website, address } = body

    if (!name || !email || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!ALLOWED_CATEGORIES.has(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createServiceRoleClient()

    const { data: inserted, error } = await supabase
      .from('service_providers')
      .insert({
        name,
        email,
        category,
        description: description || null,
        phone: phone || null,
        website: website || null,
        address: address || null,
        // TODO: Replace hardcoded 'GY' with territory detection from middleware header 'x-country-code' before Territory Launch System Phase 1 ships.
        site_id: 'GY',
        status: 'pending',
        verified: false,
        featured: false,
        source: 'self-submitted',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Business submission insert error:', error)
      return NextResponse.json(
        { error: 'Submission failed. Please try again.' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Fire-and-log email notification to basic_admins for the territory.
    // Failure does not fail the submission.
    notifyBasicAdmins({
      submissionId: inserted?.id,
      name,
      email,
      category,
      description,
      phone,
      countryCode: 'GY',
    }).catch((err) => {
      console.error('Basic admin notification failed (non-fatal):', err)
    })

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    console.error('Business submission error:', error)
    return NextResponse.json(
      { error: 'Submission failed. Please try again.' },
      { status: 500, headers: corsHeaders }
    )
  }
}

async function notifyBasicAdmins(args: {
  submissionId?: string
  name: string
  email: string
  category: string
  description?: string
  phone?: string
  countryCode: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping basic_admin notification')
    return
  }

  const supabase = createServiceRoleClient()
  const { data: admins } = await supabase
    .from('profiles')
    .select('email')
    .eq('user_type', 'admin')
    .eq('admin_level', 'basic')
    .eq('country_id', args.countryCode)

  const recipients = (admins || [])
    .map((a: { email: string | null }) => a.email)
    .filter((e): e is string => !!e)

  if (recipients.length === 0) {
    console.warn(`No basic_admin recipients found for ${args.countryCode}`)
    return
  }

  const categoryLabel = CATEGORY_LABELS[args.category] || args.category
  const queueUrl = 'https://portalhomehub.com/admin-dashboard/service-providers'

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #333; background: #f5f5f5; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 22px;">New business directory submission</h1>
    </div>
    <div style="background: #fff; padding: 24px; border-radius: 0 0 8px 8px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; font-weight: bold; width: 110px;">Business:</td><td style="padding: 6px 0;">${escapeHtml(args.name)}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Category:</td><td style="padding: 6px 0;">${escapeHtml(categoryLabel)}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: bold;">Email:</td><td style="padding: 6px 0;"><a href="mailto:${escapeHtml(args.email)}" style="color: #2563eb;">${escapeHtml(args.email)}</a></td></tr>
        ${args.phone ? `<tr><td style="padding: 6px 0; font-weight: bold;">Phone:</td><td style="padding: 6px 0;">${escapeHtml(args.phone)}</td></tr>` : ''}
        ${args.description ? `<tr><td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Description:</td><td style="padding: 6px 0;">${escapeHtml(args.description)}</td></tr>` : ''}
      </table>
      <div style="text-align: center; margin-top: 28px;">
        <a href="${queueUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review in queue</a>
      </div>
      <p style="margin-top: 24px; font-size: 12px; color: #666;">Submission is held at <code>status=pending</code> until approved.</p>
    </div>
  </div>
</body>
</html>
`.trim()

  await resend.emails.send({
    from: 'Portal HomeHub <notifications@portalhomehub.com>',
    to: recipients,
    subject: `New business directory submission — ${args.name}`,
    html,
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
