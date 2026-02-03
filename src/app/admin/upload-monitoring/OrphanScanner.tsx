"use client"

import React, { useState } from 'react'

export default function OrphanScanner() {
  const [scanning, setScanning] = useState(false)
  const [orphaned, setOrphaned] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const scan = async () => {
    setScanning(true)
    setError(null)
    setOrphaned(null)
    try {
      const res = await fetch('/api/admin/scan-orphaned', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Scan failed')
      setOrphaned(data.orphaned || [])
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setScanning(false)
    }
  }

  const deleteOrphaned = async () => {
    if (!orphaned || orphaned.length === 0) return
    if (!confirm(`Delete ${orphaned.length} orphaned files? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/delete-orphaned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: orphaned })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Delete failed')
      alert(`Removed ${data.removed} files`)
      setOrphaned([])
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mt-6 bg-white rounded shadow p-4">
      <h3 className="font-semibold mb-2">Orphaned File Scanner</h3>
      <div className="flex gap-2">
        <button onClick={scan} className="px-3 py-2 bg-blue-600 text-white rounded" disabled={scanning || deleting}>
          {scanning ? 'Scanning…' : 'Scan for Orphaned Files'}
        </button>
        <button onClick={deleteOrphaned} className="px-3 py-2 bg-red-600 text-white rounded" disabled={deleting || !orphaned || orphaned.length===0}>
          {deleting ? 'Deleting…' : 'Delete Orphaned Files'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {orphaned && (
        <div className="mt-3">
          <p className="text-sm text-gray-700">Found {orphaned.length} orphaned files:</p>
          <ul className="mt-2 max-h-48 overflow-auto text-xs text-gray-600 list-disc pl-5">
            {orphaned.map((f,i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
