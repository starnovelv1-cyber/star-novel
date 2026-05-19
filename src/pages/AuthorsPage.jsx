import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthorsPage() {
  const navigate = useNavigate()
  const [writers, setWriters] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('writers').select('*, novels(count)').order('pen_name')
    setWriters(data || [])
    setLoading(false)
  }

  const filtered = writers.filter(w =>
    search === '' ||
    w.pen_name?.toLowerCase().includes(search.toLowerCase()) ||
    w.real_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        <button onClick={() => navigate(-1)} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '6px 14px', color: '#94a3b8', cursor: 'pointer',
          fontSize: '0.85rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6
        }}>← ย้อนกลับ</button>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f97316', marginBottom: '0.5rem' }}>✍️ นักเขียน</h1>
          <p style={{ color: '#888' }}>พบ {filtered.length} คน</p>
        </div>

        <input type="text" placeholder="🔍 ค้นหานักเขียน..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', marginBottom: '1.5rem', background: '#111', border: '1px solid #333', color: '#fff', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>⏳ กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✍️</div>
            <p>ไม่พบนักเขียนที่ค้นหา</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {filtered.map(writer => {
              const novelCount = writer.novels?.[0]?.count ?? 0
              return (
                <Link key={writer.id} to={`/novels?writer=${writer.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#111', border: '1px solid #222', borderRadius: '16px', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#f97316' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#222' }}>
                    <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: writer.avatar_url ? 'transparent' : '#1a1a1a', border: '2px solid #333', margin: '0 auto 12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                      {writer.avatar_url ? <img src={writer.avatar_url} alt={writer.pen_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                    </div>
                    <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{writer.pen_name}</h3>
                    {writer.real_name && <p style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>{writer.real_name}</p>}
                    <div style={{ display: 'inline-block', background: '#1a1a1a', border: '1px solid #333', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', color: '#f97316' }}>
                      📚 {novelCount} เรื่อง
                    </div>
                    {writer.bio && <p style={{ color: '#666', fontSize: '11px', marginTop: '10px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{writer.bio}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
