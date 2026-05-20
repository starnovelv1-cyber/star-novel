import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AnnouncementsAdmin() {
  const [list, setList] = useState([])
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setList(data || [])
  }

  async function add() {
    if (!message.trim()) return
    setLoading(true)
    await supabase.from('announcements').insert({ message, type })
    setMessage('')
    await load()
    setLoading(false)
  }

  async function toggle(id, is_active) {
    await supabase.from('announcements').update({ is_active: !is_active }).eq('id', id)
    await load()
  }

  async function remove(id) {
    await supabase.from('announcements').delete().eq('id', id)
    await load()
  }

  const typeColors = { info: '#60a5fa', warning: '#fcd34d', error: '#fca5a5' }

  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>📢 จัดการประกาศ</h1>

      {/* เพิ่มประกาศ */}
      <div style={{ background: '#111', padding: '1.5rem', borderRadius: '12px', border: '1px solid #222', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#aaa' }}>เพิ่มประกาศใหม่</h2>
        <textarea
          value={message} onChange={e => setMessage(e.target.value)}
          placeholder="พิมพ์ข้อความประกาศ..."
          rows={3}
          style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '14px', resize: 'vertical', marginBottom: '1rem' }}
        />
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select value={type} onChange={e => setType(e.target.value)}
            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}>
            <option value="info">ℹ️ ข้อมูล</option>
            <option value="warning">⚠️ แจ้งเตือน</option>
            <option value="error">🚨 ด่วน/สำคัญ</option>
          </select>
          <button onClick={add} disabled={loading} style={{
            background: '#4fc3f7', color: '#000', border: 'none',
            padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
          }}>
            {loading ? 'กำลังบันทึก...' : '+ เพิ่มประกาศ'}
          </button>
        </div>
      </div>

      {/* รายการประกาศ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {list.map(a => (
          <div key={a.id} style={{
            background: '#111', border: '1px solid #222',
            borderRadius: '12px', padding: '1rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            opacity: a.is_active ? 1 : 0.5
          }}>
            <div>
              <span style={{ color: typeColors[a.type], fontSize: '12px', marginRight: '8px' }}>
                [{a.type.toUpperCase()}]
              </span>
              <span style={{ fontSize: '14px' }}>{a.message}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => toggle(a.id, a.is_active)} style={{
                background: a.is_active ? '#064e3b' : '#1a1a1a',
                color: a.is_active ? '#34d399' : '#888',
                border: '1px solid #333', padding: '4px 12px',
                borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
              }}>
                {a.is_active ? '✅ เปิด' : '⏸ ปิด'}
              </button>
              <button onClick={() => remove(a.id)} style={{
                background: '#7f1d1d', color: '#fca5a5',
                border: 'none', padding: '4px 12px',
                borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
              }}>
                🗑 ลบ
              </button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p style={{ color: '#555' }}>ยังไม่มีประกาศ</p>}
      </div>
    </div>
  )
}
