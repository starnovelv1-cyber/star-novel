import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import useSEO from "../hooks/useSEO"

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [history, setHistory] = useState([])
  const [ratings, setRatings] = useState([])
  const [tab, setTab] = useState('bookmark')
  const navigate = useNavigate()
  useSEO({ title: 'โปรไฟล์ของฉัน' })

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return navigate('/login')
      setUser(user)
      const { data: bm } = await supabase.from('bookmarks').select('*, novels(id, title, cover_url, categories(name, icon, color))').eq('user_id', user.id).order('created_at', { ascending: false })
      setBookmarks(bm || [])
      const { data: hist } = await supabase.from('listen_history').select('*, chapters(id, title, chapter_number, audio_url), novels(id, title, cover_url)').eq('user_id', user.id).order('updated_at', { ascending: false })
      setHistory(hist || [])
      const { data: rat } = await supabase.from('ratings').select('*, novels(id, title, cover_url, categories(name, icon, color))').eq('user_id', user.id).order('created_at', { ascending: false })
      setRatings(rat || [])
    }
    loadProfile()
  }, [])

  const removeBookmark = async (novelId) => {
    await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('novel_id', novelId)
    setBookmarks(bookmarks.filter(b => b.novel_id !== novelId))
  }

  function handleContinue(novelId, chapterId) {
    if (chapterId) localStorage.setItem(`novel-current-chapter-${novelId}`, chapterId)
    navigate(`/novel/${novelId}`)
  }

  const formatTime = (secs) => {
    if (!secs) return '0:00'
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = Math.floor(secs % 60)
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const getInitials = (email) => email ? email.slice(0, 2).toUpperCase() : 'UN'

  const card = { background: 'rgba(13,13,43,0.8)', border: '1px solid rgba(79,195,247,0.12)', borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s' }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '100px 20px 120px' }}>

        {/* ปุ่มย้อนกลับ */}
        <button onClick={() => navigate(-1)} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '6px 14px', color: '#94a3b8', cursor: 'pointer',
          fontSize: '0.85rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6
        }}>← ย้อนกลับ</button>

        {/* Profile Header */}
        <div style={{ ...card, padding: '28px 32px', marginBottom: 28, background: 'linear-gradient(135deg, rgba(13,13,43,0.95) 0%, rgba(20,20,60,0.95) 100%)', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #4fc3f7, #7c4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 700, color: '#fff', boxShadow: '0 0 24px rgba(79,195,247,0.4)' }}>
            {getInitials(user?.email)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#e2e8f0' }}>โปรไฟล์ของฉัน</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
              {[{ val: bookmarks.length, label: 'ติดตาม', color: '#4fc3f7' }, { val: history.length, label: 'ประวัติฟัง', color: '#4fc3f7' }, { val: ratings.length, label: 'โหวตแล้ว', color: '#FFD700' }].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(13,13,43,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 6 }}>
          {[{ key: 'bookmark', label: '🔖 ติดตาม', count: bookmarks.length }, { key: 'history', label: '🎧 ประวัติฟัง', count: history.length }, { key: 'ratings', label: '⭐ โหวตดาว', count: ratings.length }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', background: tab === t.key ? 'rgba(79,195,247,0.15)' : 'transparent', color: tab === t.key ? '#4fc3f7' : '#64748b', boxShadow: tab === t.key ? 'inset 0 0 0 1px rgba(79,195,247,0.3)' : 'none' }}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Bookmark Tab */}
        {tab === 'bookmark' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bookmarks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔖</div>
                <p style={{ color: '#64748b', margin: 0 }}>ยังไม่มีนิยายที่ติดตาม</p>
                <button onClick={() => navigate('/')} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 20, background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.3)', color: '#4fc3f7', cursor: 'pointer', fontSize: '0.9rem' }}>ค้นหานิยาย</button>
              </div>
            ) : bookmarks.map(bm => (
              <div key={bm.id} style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(79,195,247,0.35)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(79,195,247,0.12)'}>
                <div style={{ flexShrink: 0, width: 52, height: 72, borderRadius: 8, overflow: 'hidden', background: `linear-gradient(135deg, ${bm.novels?.categories?.color || '#1a1a3e'}55, #0d0d2b)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  {bm.novels?.cover_url ? <img src={bm.novels.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : bm.novels?.categories?.icon || '📚'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#e2e8f0', fontWeight: 600, margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bm.novels?.title}</p>
                  <p style={{ color: '#4fc3f7', fontSize: '0.78rem', margin: '4px 0 0', opacity: 0.8 }}>{bm.novels?.categories?.name || 'ไม่ระบุหมวดหมู่'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => navigate(`/novel/${bm.novel_id}`)} style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid rgba(79,195,247,0.35)', background: 'rgba(79,195,247,0.1)', color: '#4fc3f7', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>ฟังต่อ</button>
                  <button onClick={() => removeBookmark(bm.novel_id)} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid rgba(248,113,113,0.25)', background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: '0.82rem' }}>ลบ</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎧</div>
                <p style={{ color: '#64748b', margin: 0 }}>ยังไม่มีประวัติการฟัง</p>
              </div>
            ) : history.map(h => (
              <div key={h.id} style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(79,195,247,0.35)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(79,195,247,0.12)'}>
                <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 8, overflow: 'hidden', background: 'rgba(79,195,247,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                  {h.novels?.cover_url ? <img src={h.novels.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎵'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#e2e8f0', fontWeight: 600, margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.novels?.title}</p>
                  <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '3px 0 0' }}>ตอนที่ {h.chapters?.chapter_number} — {h.chapters?.title}</p>
                  {h.progress_seconds > 0 && <p style={{ color: '#4fc3f7', fontSize: '0.75rem', margin: '3px 0 0' }}>⏱ ฟังถึง {formatTime(h.progress_seconds)}</p>}
                </div>
                <button onClick={() => handleContinue(h.novel_id, h.chapter_id)} style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid rgba(79,195,247,0.35)', background: 'rgba(79,195,247,0.1)', color: '#4fc3f7', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, flexShrink: 0 }}>ฟังต่อ</button>
              </div>
            ))}
          </div>
        )}

        {/* Ratings Tab */}
        {tab === 'ratings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ratings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>⭐</div>
                <p style={{ color: '#64748b', margin: 0 }}>ยังไม่มีการโหวตดาว</p>
                <button onClick={() => navigate('/')} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 20, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700', cursor: 'pointer', fontSize: '0.9rem' }}>ค้นหานิยาย</button>
              </div>
            ) : ratings.map(r => (
              <div key={r.id} style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,215,0,0.35)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(79,195,247,0.12)'}>
                <div style={{ flexShrink: 0, width: 52, height: 72, borderRadius: 8, overflow: 'hidden', background: `linear-gradient(135deg, ${r.novels?.categories?.color || '#1a1a3e'}55, #0d0d2b)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  {r.novels?.cover_url ? <img src={r.novels.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : r.novels?.categories?.icon || '📚'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#e2e8f0', fontWeight: 600, margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.novels?.title}</p>
                  <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
                    {[1,2,3,4,5].map(star => <span key={star} style={{ fontSize: '18px', color: star <= r.rating ? '#FFD700' : '#444' }}>★</span>)}
                    <span style={{ color: '#888', fontSize: '13px', marginLeft: 6 }}>({r.rating} ดาว)</span>
                  </div>
                </div>
                <button onClick={() => navigate(`/novel/${r.novel_id}`)} style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid rgba(255,215,0,0.35)', background: 'rgba(255,215,0,0.1)', color: '#FFD700', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, flexShrink: 0 }}>ดูนิยาย</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
