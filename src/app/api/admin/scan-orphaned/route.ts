import { NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase-admin'

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient()
    const bucket = 'property-images'

    // List storage files (paged)
    const allFiles: string[] = []
    let offset = 0
    const PAGE = 1000
    while (true) {
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: PAGE, offset })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!data || data.length === 0) break
      // Each item has .name which may include folders (userId/filename)
      data.forEach((d: any) => {
        if (d.name) allFiles.push(d.name)
      })
      if (data.length < PAGE) break
      offset += PAGE
    }

    // Gather referenced paths from property_media
    const { data: referenced, error: refErr } = await supabase
      .from('property_media')
      .select('media_url')
      .limit(50000)

    if (refErr) return NextResponse.json({ error: refErr.message }, { status: 500 })

    const referencedUrls = new Set<string>()
    ;(referenced || []).forEach((r: any) => {
      if (!r || !r.media_url) return
      const url: string = r.media_url
      // If URL contains bucket path, extract after bucket
      const idx = url.indexOf('/property-images/')
      if (idx !== -1) {
        referencedUrls.add(url.slice(idx + 1)) // remove leading slash
      }
      // Add raw url too
      referencedUrls.add(url)
    })

    // Determine orphaned files: present in storage but not referenced
    const orphaned = allFiles.filter(f => {
      // direct match
      if (referencedUrls.has(f)) return false
      // check if any referenced URL ends with the file path
      for (const ref of referencedUrls) {
        if (ref.endsWith(f)) return false
      }
      return true
    })

    return NextResponse.json({ totalFiles: allFiles.length, referenced: referencedUrls.size, orphaned })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
