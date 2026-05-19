import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

export default function NovelsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') === 'audio' ? 'audio' : 'all')
  const [novels, setNovels] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedStatus, setSelectedStatus] = useState('')

  // sync tab กับ URL เมื่อ URL เปลี่ยน
  useEffect(() => {
    setTab(searchParams.get('tab') === 'audio' ? 'audio' : 'all')
  }, [searchParams])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [n, c] = await Promise.all([
      supabase.from('novels')
        .select('*, has_audio, categories(name), writers(pen_name)')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ])
    console.log('novels data:', n.data)
    console.log('novels error:', n.error)
    setNovels(n.data || [])
    setCategories(c.data || [])
    setLoading(false)
  }

  const novelsWithAudio = novels.filter(novel => novel.has_audio || novel.audio_url)

  const filtered = (tab === 'audio' ? novelsWithAudio : novels).filter(novel => {
    const matchSearch = search === '' ||
      novel.title?.toLowerCase().includes(search.toLowerCase()) ||
      novel.writers?.pen_name?.toLowerCase().includes(search.toLowerCase())
    const matchCat = selectedCategory === '' || String(novel.category_id) === String(selectedCategory)
    const matchStatus = selectedStatus === '' || novel.status === selectedStatus
    return matchSearch && matchCat && matchStatus
  })

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '100px 1rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* ปุ่มย้อนกลับ */}
          <button onClick={() => navigate(-1)} style={{
            marginBottom: '1rem', background: 'none',
            border: '1px solid #333', color: '#aaa',
            padding: '6px 16px', borderRadius: '20px',
            cursor: 'pointer', fontSize: '13px'
          }}>
            ← ย้อนกลับ
          </button>

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              {tab === 'audio' ? '🎧 นิยายเสียง' : '📚 นิยายทั้งหมด'}
            </h1>
            <p style={{ color: '#64748b' }}>
              {tab === 'audio' ? 'ฟังนิยายได้เลย ไม่ต้องอ่าน' : 'ค้นพบนิยายที่คุณชื่นชอบ'}
              {' '}· {filtered.length} เรื่อง
            </p>
          </div>

          {/* Tab นิยาย / นิยายเสียง */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
            {[
              { key: 'all', label: '📚 นิยายทั้งหมด' },
              { key: 'audio', label: '🎧 นิยายเสียง' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '8px 20px', borderRadius: '20px', cursor: 'pointer',
                fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
                background: tab === t.key ? '#4fc3f7' : '#1a1a1a',
                color: tab === t.key ? '#000' : '#888',
                border: `1px solid ${tab === t.key ? '#4fc3f7' : '#333'}`,
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ช่องค้นหา + ตัวกรอง */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '12px',
            marginBottom: '2rem', background: '#111',
            padding: '1rem', borderRadius: '12px', border: '1px solid #222'
          }}>
            <input
              type="text"
              placeholder="🔍 ค้นหาชื่อนิยาย หรือนักเขียน..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: '1', minWidth: '200px',
                background: '#1a1a1a', border: '1px solid #333',
                color: '#fff', padding: '10px 14px',
                borderRadius: '8px', fontSize: '14px', outline: 'none'
              }}
            />
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
              style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <option value="">📂 หมวดหมู่ทั้งหมด</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
              style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <option value="">📌 สถานะทั้งหมด</option>
              <option value="ongoing">กำลังดำเนินเรื่อง</option>
              <option value="completed">จบแล้ว</option>
            </select>
          </div>

          {/* Grid นิยาย */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>⏳ กำลังโหลด...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>😔 ไม่พบนิยายที่ค้นหา</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.25rem' }}>
              {filtered.map(novel => (
                <Link key={novel.id} to={`/novel/${novel.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    background: '#111', border: '1px solid #222',
                    borderRadius: '12px', overflow: 'hidden',
                    transition: 'transform 0.2s, border-color 0.2s', cursor: 'pointer'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#4fc3f7' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#222' }}>
                    <div style={{ aspectRatio: '2/3', background: '#1a1a1a', position: 'relative' }}>
                      {novel.cover_url ? (
                        <img src={novel.cover_url} alt={novel.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>📚</div>
                      )}
                      <span style={{
                        position: 'absolute', top: '6px', right: '6px',
                        background: novel.status === 'completed' ? '#064e3b' : '#1e3a5f',
                        color: novel.status === 'completed' ? '#34d399' : '#60a5fa',
                        fontSize: '10px', padding: '2px 6px', borderRadius: '20px'
                      }}>
                        {novel.status === 'completed' ? 'จบ' : 'ดำเนิน'}
                      </span>
                      {novel.has_audio && (
                        <span style={{
                          position: 'absolute', top: '6px', left: '6px',
                          background: '#2d1b69', color: '#a78bfa',
                          fontSize: '10px', padding: '2px 6px', borderRadius: '20px'
                        }}>🎧</span>
                      )}
                    </div>
                    <div style={{ padding: '10px' }}>
                      <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {novel.title}
                      </p>
                      <p style={{ color: '#888', fontSize: '11px' }}>✍️ {novel.writers?.pen_name || 'ไม่ระบุ'}</p>
                      <p style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>👁 {(novel.views || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
