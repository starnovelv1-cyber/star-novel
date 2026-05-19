import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AudioNovelsPage() {
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [playingId, setPlayingId] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    // ดึงเฉพาะนิยายที่มี audio_url (ปรับ field ตาม schema จริงของคุณ)
    const { data } = await supabase
      .from('novels')
      .select('*, categories(name), writers(pen_name)')
      .not('audio_url', 'is', null)  // กรองเฉพาะที่มีเสียง
      .order('created_at', { ascending: false })
    setNovels(data || [])
    setLoading(false)
  }

  const filtered = novels.filter(novel =>
    search === '' ||
    novel.title?.toLowerCase().includes(search.toLowerCase()) ||
    novel.writers?.pen_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#a78bfa', marginBottom: '0.5rem' }}>
            🎧 นิยายเสียง
          </h1>
          <p style={{ color: '#888' }}>ฟังนิยายได้เลย ไม่ต้องอ่าน • {filtered.length} เรื่อง</p>
        </div>

        {/* ค้นหา */}
        <input
          type="text"
          placeholder="🔍 ค้นหานิยายเสียง..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', marginBottom: '1.5rem',
            background: '#111', border: '1px solid #333',
            color: '#fff', padding: '12px 16px',
            borderRadius: '10px', fontSize: '14px',
            outline: 'none', boxSizing: 'border-box'
          }}
        />

        {/* List นิยายเสียง */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>⏳ กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎙️</div>
            <p style={{ color: '#888' }}>ยังไม่มีนิยายเสียง</p>
            <p style={{ color: '#555', fontSize: '13px', marginTop: '8px' }}>
              (ถ้า schema ใช้ชื่อ field อื่น แก้ใน <code>audio_url</code> ใน loadData())
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map(novel => (
              <div
                key={novel.id}
                style={{
                  background: '#111', border: '1px solid #222',
                  borderRadius: '14px', padding: '1rem',
                  display: 'flex', gap: '1rem', alignItems: 'center',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#a78bfa'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
              >
                {/* รูปปก */}
                <Link to={`/novel/${novel.id}`} style={{ flexShrink: 0 }}>
                  <div style={{ width: '70px', height: '105px', borderRadius: '8px', overflow: 'hidden', background: '#1a1a1a' }}>
                    {novel.cover_url ? (
                      <img src={novel.cover_url} alt={novel.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📚</div>
                    )}
                  </div>
                </Link>

                {/* ข้อมูล */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/novel/${novel.id}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
                      {novel.title}
                    </h3>
                  </Link>
                  <p style={{ color: '#888', fontSize: '13px', marginBottom: '4px' }}>
                    ✍️ {novel.writers?.pen_name || 'ไม่ระบุ'} &nbsp;·&nbsp;
                    📂 {novel.categories?.name || 'ไม่ระบุ'}
                  </p>
                  <p style={{ color: '#666', fontSize: '12px', overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {novel.description || 'ไม่มีคำอธิบาย'}
                  </p>

                  {/* Player เสียง */}
                  {novel.audio_url && (
                    <audio
                      controls
                      src={novel.audio_url}
                      style={{ width: '100%', marginTop: '8px', height: '32px' }}
                    />
                  )}
                </div>

                {/* Views */}
                <div style={{ textAlign: 'right', flexShrink: 0, color: '#666', fontSize: '12px' }}>
                  <div>👁 {(novel.views || 0).toLocaleString()}</div>
                  <span style={{
                    display: 'inline-block', marginTop: '6px',
                    background: '#2d1b69', color: '#a78bfa',
                    fontSize: '10px', padding: '2px 8px', borderRadius: '20px'
                  }}>🎧 มีเสียง</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
