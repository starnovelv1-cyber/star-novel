import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    supabase.from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setAnnouncements(data || []))
  }, [])

  if (announcements.length === 0) return null

  const colors = {
    info:    { bg: '#1e3a5f', color: '#60a5fa', icon: 'ℹ️' },
    warning: { bg: '#78350f', color: '#fcd34d', icon: '⚠️' },
    error:   { bg: '#7f1d1d', color: '#fca5a5', icon: '🚨' },
  }

  return (
    <div style={{ position: 'relative', top: 0, left: 0, right: 0, zIndex: 9999 }}>
      {announcements.map(a => {
        const c = colors[a.type] || colors.info
        return (
          <div key={a.id} style={{
            background: c.bg, color: c.color,
            padding: '10px 20px', textAlign: 'center',
            fontSize: '14px', fontWeight: 500,
          }}>
            {c.icon} {a.message}
          </div>
        )
      })}
    </div>
  )
}

