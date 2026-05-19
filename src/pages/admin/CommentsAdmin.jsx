import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function CommentsAdmin() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterNovel, setFilterNovel] = useState('')
  const [novels, setNovels] = useState([])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    // ✅ ดึง comments + profiles เท่านั้น (ไม่ join novels/chapters)
    const [c, n] = await Promise.all([
      supabase.from('comments')
        .select('id, user_id, novel_id, chapter_id, content, likes, created_at, profiles(email)')
        .order('created_at', { ascending: false }),
      supabase.from('novels').select('id, title').order('title')
    ])
    setComments(c.data || [])
    setNovels(n.data || [])
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('ลบความคิดเห็นนี้?')) return
    await supabase.from('comments').delete().eq('id', id)
    loadAll()
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  // หาชื่อนิยายจาก novel_id
  function getNovelTitle(novel_id) {
    return novels.find(n => n.id === novel_id)?.title || '-'
  }

  const filtered = comments.filter(c => {
    const matchSearch = !search || c.content?.includes(search) || c.profiles?.email?.includes(search)
    const matchNovel = !filterNovel || String(c.novel_id) === String(filterNovel)
    return matchSearch && matchNovel
  })

  const inputStyle = {
    background: '#111', border: '1px solid #333', color: '#fff',
    padding: '8px 12px', borderRadius: '8px'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#fff' }}>💬 จัดการความคิดเห็น</h1>
        <span style={{ color: '#888', fontSize: '14px' }}>ทั้งหมด {comments.length} ความคิดเห็น</span>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 ค้นหาความคิดเห็น..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: '250px' }}
        />
        <select value={filterNovel} onChange={e => setFilterNovel(e.target.value)}
          style={{ ...inputStyle, width: '200px' }}>
          <option value="">ทุกนิยาย</option>
          {novels.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
        </select>
      </div>

      {loading ? <p style={{ color: '#888' }}>กำลังโหลด...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 ? (
            <p style={{ color: '#555', textAlign: 'center', padding: '3rem' }}>ไม่พบความคิดเห็น</p>
          ) : filtered.map(comment => (
            <div key={comment.id} style={{
              background: '#1a1a1a', border: '1px solid #222',
              borderRadius: '12px', padding: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FFD700, #f59e0b)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 700, color: '#000', flexShrink: 0
                    }}>
                      {(comment.profiles?.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                        {comment.profiles?.email?.split('@')[0] || 'ผู้ใช้'}
                      </span>
                      <span style={{ color: '#555', fontSize: '12px', marginLeft: '8px' }}>
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: '#1e3a5f', color: '#60a5fa',
                      padding: '2px 8px', borderRadius: '20px', fontSize: '12px'
                    }}>
                      📚 {getNovelTitle(comment.novel_id)}
                    </span>
                    <span style={{
                      background: '#1a2e1a', color: '#34d399',
                      padding: '2px 8px', borderRadius: '20px', fontSize: '12px'
                    }}>
                      ตอนที่ {comment.chapter_id}
                    </span>
                    {comment.likes > 0 && (
                      <span style={{
                        background: 'rgba(255,215,0,0.1)', color: '#FFD700',
                        padding: '2px 8px', borderRadius: '20px', fontSize: '12px'
                      }}>
                        👍 {comment.likes}
                      </span>
                    )}
                  </div>

                  <p style={{ color: '#ccc', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                    {comment.content}
                  </p>
                </div>

                <button onClick={() => handleDelete(comment.id)}
                  style={{
                    background: '#7f1d1d', color: '#fca5a5',
                    border: 'none', padding: '4px 10px',
                    borderRadius: '6px', cursor: 'pointer',
                    fontSize: '12px', marginLeft: '12px', flexShrink: 0
                  }}>
                  🗑️ ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
