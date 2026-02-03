import { NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase-admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const files: string[] = body.files || []
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const bucket = 'property-images'

    const { error } = await supabase.storage.from(bucket).remove(files)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, removed: files.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
