import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ReportButton() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('bug')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!message.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('reports').insert({
      type, message,
      page_url: window.location.href,
      user_id: user?.id || null
    })
    setLoading(false)
    setDone(true)
    setMessage('')
    setTimeout(() => { setDone(false); setOpen(false) }, 2000)
  }

  return (
    <>
      {/* ปุ่มลอย */}
      <button onClick={() => setOpen(true)} style={{
        position: 'fixed', bottom: '24px', left: '24px', zIndex: 8888,
        background: '#1a1a2e', border: '1px solid #333',
        color: '#aaa', padding: '10px 16px', borderRadius: '20px',
        cursor: 'pointer', fontSize: '13px', display: 'flex',
        alignItems: 'center', gap: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        transition: 'all 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#4fc3f7'; e.currentTarget.style.color = '#4fc3f7' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#aaa' }}
      >
        🐛 แจ้งปัญหา
      </button>

      {/* Modal */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }} onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div style={{
            background: '#111', border: '1px solid #333',
            borderRadius: '16px', padding: '1.5rem',
            width: '100%', maxWidth: '480px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.1rem' }}>🐛 แจ้งปัญหา</h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {done ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#34d399', fontSize: '1.1rem' }}>
                ✅ ส่งเรียบร้อยแล้ว ขอบคุณครับ!
              </div>
            ) : (
              <>
                <select value={type} onChange={e => setType(e.target.value)} style={{
                  width: '100%', background: '#1a1a1a', border: '1px solid #333',
                  color: '#fff', padding: '10px', borderRadius: '8px',
                  fontSize: '14px', marginBottom: '1rem'
                }}>
                  <option value="bug">🐛 บัก / ข้อผิดพลาด</option>
                  <option value="content">📝 เนื้อหาไม่เหมาะสม</option>
                  <option value="suggestion">💡 ติชม / เสนอแนะ</option>
                  <option value="other">❓ อื่นๆ</option>
                </select>

                <textarea
                  value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="อธิบายปัญหาที่พบ..."
                  rows={4}
                  style={{
                    width: '100%', background: '#1a1a1a', border: '1px solid #333',
                    color: '#fff', padding: '10px', borderRadius: '8px',
                    fontSize: '14px', resize: 'vertical', marginBottom: '1rem',
                    fontFamily: 'Kanit, sans-serif'
                  }}
                />

                <p style={{ color: '#555', fontSize: '12px', marginBottom: '1rem' }}>
                  📍 หน้า: {window.location.pathname}
                </p>

                <button onClick={submit} disabled={loading || !message.trim()} style={{
                  width: '100%', background: '#4fc3f7', color: '#000',
                  border: 'none', padding: '10px', borderRadius: '8px',
                  fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                  opacity: loading || !message.trim() ? 0.5 : 1
                }}>
                  {loading ? 'กำลังส่ง...' : 'ส่งรายงาน'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
