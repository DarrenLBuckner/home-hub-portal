import React from 'react'
import { createAdminClient } from '@/supabase-admin'

export default async function UploadMonitoringPage() {
  const supabase = createAdminClient()

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Recent uploads (last 24h)
  const { data: recentMedia, error: mediaError } = await supabase
    .from('property_media')
    .select('id, property_id, url, mime_type, file_size, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200)

  // Storage root listing (top-level folders/files)
  const { data: storageRoots, error: storageError } = await supabase.storage
    .from('property-images')
    .list('', { limit: 1000 })

  const uploadsCount = Array.isArray(recentMedia) ? recentMedia.length : 0

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Upload Monitoring (24h)</h1>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm uppercase text-gray-500">Uploads (24h)</p>
          <p className="text-3xl font-bold">{uploadsCount}</p>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm uppercase text-gray-500">Storage Root Items</p>
          <p className="text-3xl font-bold">{Array.isArray(storageRoots) ? storageRoots.length : '—'}</p>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm uppercase text-gray-500">Recent Errors</p>
          <p className="text-3xl font-bold">—</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Recent Uploads</h2>
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-xs text-gray-600">Time</th>
                <th className="p-3 text-xs text-gray-600">Property ID</th>
                <th className="p-3 text-xs text-gray-600">Path / URL</th>
                <th className="p-3 text-xs text-gray-600">Size</th>
                <th className="p-3 text-xs text-gray-600">MIME</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(recentMedia) && recentMedia.length > 0 ? (
                recentMedia.map((m: any) => (
                  <tr key={m.id} className="border-t">
                    <td className="p-3 text-sm text-gray-700">{new Date(m.created_at).toLocaleString()}</td>
                    <td className="p-3 text-sm text-gray-700">{m.property_id || '—'}</td>
                    <td className="p-3 text-sm text-gray-700 truncate max-w-[420px]">{m.url}</td>
                    <td className="p-3 text-sm text-gray-700">{m.file_size ? `${Math.round(m.file_size/1024)} KB` : '—'}</td>
                    <td className="p-3 text-sm text-gray-700">{m.mime_type || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-sm text-gray-500">No uploads in the last 24 hours.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Storage (Root)</h2>
        <div className="bg-white rounded shadow p-4">
          <ul className="list-disc pl-5 text-sm text-gray-700 max-h-64 overflow-auto">
            {Array.isArray(storageRoots) && storageRoots.length > 0 ? (
              storageRoots.map((s: any) => (
                <li key={s.name} className="mb-1">{s.name} <span className="text-xs text-gray-400">({s.type})</span></li>
              ))
            ) : (
              <li className="text-gray-500">No storage items found or access restricted.</li>
            )}
          </ul>
        </div>
      </section>

      <p className="mt-6 text-sm text-gray-500">Note: For a deeper orphaned-files scan, run a recursive listing of all buckets and compare to `property_media.url` entries. Use the admin API if required.</p>
    </div>
  )
}
