import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const typeLabel = {
  bug: '🐛 บัก/ข้อผิดพลาด',
  content: '📝 เนื้อหาไม่เหมาะสม',
  suggestion: '💡 ติชม/เสนอแนะ',
  other: '❓ อื่นๆ',
}

const statusColor = {
  pending: { bg: '#78350f', color: '#fcd34d', label: '⏳ รอดำเนินการ' },
  resolved: { bg: '#064e3b', color: '#34d399', label: '✅ แก้ไขแล้ว' },
}

export default function ReportsAdmin() {
  const [reports, setReports] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
    setReports(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('reports').update({ status }).eq('id', id)
    await load()
  }

  async function remove(id) {
    if (!confirm('ลบรายการนี้?')) return
    await supabase.from('reports').delete().eq('id', id)
    await load()
  }

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)
  const pending = reports.filter(r => r.status === 'pending').length

  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>🐛 รายงานปัญหา</h1>
        {pending > 0 && (
          <span style={{ background: '#7f1d1d', color: '#fca5a5', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' }}>
            {pending} รอดำเนินการ
          </span>
        )}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
        {[
          { key: 'all', label: 'ทั้งหมด' },
          { key: 'pending', label: '⏳ รอดำเนินการ' },
          { key: 'resolved', label: '✅ แก้ไขแล้ว' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '6px 16px', borderRadius: '20px', cursor: 'pointer',
            background: filter === f.key ? '#4fc3f7' : '#1a1a1a',
            color: filter === f.key ? '#000' : '#888',
            border: `1px solid ${filter === f.key ? '#4fc3f7' : '#333'}`,
            fontSize: '13px', fontWeight: 600,
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* รายการ */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#888', padding: '4rem' }}>⏳ กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#555', padding: '4rem' }}>ไม่มีรายการ</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(r => {
            const s = statusColor[r.status] || statusColor.pending
            return (
              <div key={r.id} style={{
                background: '#111', border: '1px solid #222',
                borderRadius: '12px', padding: '1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ background: '#1a1a1a', color: '#4fc3f7', fontSize: '12px', padding: '2px 8px', borderRadius: '6px', border: '1px solid #333' }}>
                        {typeLabel[r.type] || r.type}
                      </span>
                      <span style={{ background: s.bg, color: s.color, fontSize: '12px', padding: '2px 8px', borderRadius: '6px' }}>
                        {s.label}
                      </span>
                      <span style={{ color: '#555', fontSize: '11px' }}>
                        {new Date(r.created_at).toLocaleString('th-TH')}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: 1.6, marginBottom: '6px' }}>{r.message}</p>
                    {r.page_url && (
                      <p style={{ color: '#555', fontSize: '11px' }}>📍 {r.page_url}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {r.status === 'pending' ? (
                      <button onClick={() => updateStatus(r.id, 'resolved')} style={{
                        background: '#064e3b', color: '#34d399',
                        border: 'none', padding: '4px 12px',
                        borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
                      }}>
                        ✅ แก้ไขแล้ว
                      </button>
                    ) : (
                      <button onClick={() => updateStatus(r.id, 'pending')} style={{
                        background: '#78350f', color: '#fcd34d',
                        border: 'none', padding: '4px 12px',
                        borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
                      }}>
                        ↩ เปิดใหม่
                      </button>
                    )}
                    <button onClick={() => remove(r.id)} style={{
                      background: '#7f1d1d', color: '#fca5a5',
                      border: 'none', padding: '4px 12px',
                      borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
                    }}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
