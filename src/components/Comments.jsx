import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Comments({ novelId, chapterId, user }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [likedIds, setLikedIds] = useState(new Set())
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    if (chapterId) fetchComments()
  }, [chapterId, sortBy])

  useEffect(() => {
    if (user?.id) fetchLiked()
  }, [user, chapterId])

  async function fetchComments() {
    setLoading(true)
    const { data, error } = await supabase
      .from('comments')
      .select('id, user_id, novel_id, chapter_id, content, likes, created_at, updated_at, profiles(email)')
      .eq('novel_id', novelId)
      .eq('chapter_id', Number(chapterId))
      .order(sortBy === 'top' ? 'likes' : 'created_at', { ascending: false })

    if (error) console.error('fetchComments error:', error)
    setComments(data || [])
    setLoading(false)
  }

  async function fetchLiked() {
    const { data } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', user.id)
    if (data) setLikedIds(new Set(data.map(d => d.comment_id)))
  }

  async function handleSubmit() {
    if (!newComment.trim()) return
    if (!user) return alert('กรุณาเข้าสู่ระบบก่อน')
    setSubmitting(true)
    const { error } = await supabase.from('comments').insert({
      user_id: user.id,
      novel_id: novelId,
      chapter_id: Number(chapterId),
      content: newComment.trim(),
      likes: 0,
    })
    if (error) console.error('insert comment error:', error)
    else { setNewComment(''); fetchComments() }
    setSubmitting(false)
  }

  async function handleDelete(id) {
    if (!confirm('ลบความคิดเห็นนี้?')) return
    await supabase.from('comments').delete().eq('id', id)
    fetchComments()
  }

  async function handleEdit(id) {
    if (!editContent.trim()) return
    await supabase.from('comments').update({ content: editContent, updated_at: new Date().toISOString() }).eq('id', id)
    setEditId(null)
    fetchComments()
  }

  async function handleLike(comment) {
    if (!user) return alert('กรุณาเข้าสู่ระบบก่อน')
    const liked = likedIds.has(comment.id)
    if (liked) {
      await supabase.from('comment_likes').delete().eq('user_id', user.id).eq('comment_id', comment.id)
      await supabase.from('comments').update({ likes: Math.max(0, (comment.likes || 0) - 1) }).eq('id', comment.id)
      setLikedIds(prev => { const s = new Set(prev); s.delete(comment.id); return s })
    } else {
      await supabase.from('comment_likes').insert({ user_id: user.id, comment_id: comment.id })
      await supabase.from('comments').update({ likes: (comment.likes || 0) + 1 }).eq('id', comment.id)
      setLikedIds(prev => new Set([...prev, comment.id]))
    }
    fetchComments()
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'เมื่อกี้'
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`
    if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`
    if (diff < 2592000) return `${Math.floor(diff / 86400)} วันที่แล้ว`
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function getDisplayName(comment) {
    const email = comment.profiles?.email || ''
    return email.split('@')[0] || 'ผู้ใช้'
  }

  function getAvatarColor(name) {
    const colors = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899']
    return colors[name.charCodeAt(0) % colors.length]
  }

  return (
    <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #1e1e3e' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0 }}>
          💬 {comments.length} ความคิดเห็น
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['newest', 'top'].map(s => (
            <button key={s} onClick={() => setSortBy(s)} style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '13px',
              border: `1px solid ${sortBy === s ? '#FFD700' : '#333'}`,
              background: sortBy === s ? 'rgba(255,215,0,0.1)' : 'transparent',
              color: sortBy === s ? '#FFD700' : '#888', cursor: 'pointer'
            }}>
              {s === 'newest' ? '🕐 ล่าสุด' : '🔥 ยอดนิยม'}
            </button>
          ))}
        </div>
      </div>

      {user ? (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '2rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${getAvatarColor(user.email || 'A')}, #1a1a3e)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 700, color: '#fff'
          }}>
            {(user.email || 'A')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="เพิ่มความคิดเห็น..."
              rows={1}
              onFocus={e => e.target.rows = 3}
              onBlur={e => { if (!newComment) e.target.rows = 1 }}
              style={{
                width: '100%', background: 'transparent',
                border: 'none', borderBottom: '1px solid #333',
                color: '#fff', padding: '8px 0', fontSize: '14px',
                fontFamily: 'inherit', resize: 'none', outline: 'none',
              }}
            />
            {newComment && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => setNewComment('')} style={{
                  padding: '8px 16px', borderRadius: '20px', border: 'none',
                  background: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: '14px'
                }}>ยกเลิก</button>
                <button onClick={handleSubmit} disabled={submitting} style={{
                  padding: '8px 20px', borderRadius: '20px', border: 'none',
                  background: submitting ? '#333' : '#FFD700',
                  color: submitting ? '#666' : '#000',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: '14px'
                }}>
                  {submitting ? '⏳' : '📨 ส่ง'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '12px 16px', background: '#1a1a2e',
          borderRadius: '10px', marginBottom: '1.5rem'
        }}>
          <span style={{ color: '#888', fontSize: '14px' }}>
            🔒 <a href="/login" style={{ color: '#4fc3f7', textDecoration: 'none' }}>เข้าสู่ระบบ</a> เพื่อแสดงความคิดเห็น
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#555' }}>กำลังโหลด...</div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#555' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>💬</div>
          <p>ยังไม่มีความคิดเห็น เป็นคนแรกได้เลย!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {comments.map(comment => {
            const name = getDisplayName(comment)
            const isOwner = user?.id === comment.user_id
            const isLiked = likedIds.has(comment.id)
            const isEditing = editId === comment.id

            return (
              <div key={comment.id} style={{
                display: 'flex', gap: '12px', padding: '16px 0',
                borderBottom: '1px solid #0d0d1e'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${getAvatarColor(name)}, #1a1a3e)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', fontWeight: 700, color: '#fff'
                }}>
                  {name[0].toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{name}</span>
                    <span style={{ color: '#555', fontSize: '12px' }}>{formatDate(comment.created_at)}</span>
                    {comment.updated_at && comment.updated_at !== comment.created_at && (
                      <span style={{ color: '#444', fontSize: '11px' }}>(แก้ไขแล้ว)</span>
                    )}
                  </div>

                  {isEditing ? (
                    <div>
                      <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3}
                        style={{
                          width: '100%', background: '#111', border: '1px solid #333',
                          color: '#fff', padding: '8px', borderRadius: '8px',
                          fontFamily: 'inherit', fontSize: '14px', resize: 'vertical'
                        }} />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button onClick={() => handleEdit(comment.id)} style={{
                          padding: '6px 16px', borderRadius: '20px', border: 'none',
                          background: '#FFD700', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '13px'
                        }}>บันทึก</button>
                        <button onClick={() => setEditId(null)} style={{
                          padding: '6px 16px', borderRadius: '20px', border: 'none',
                          background: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: '13px'
                        }}>ยกเลิก</button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#ccc', fontSize: '14px', margin: '0 0 8px 0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {comment.content}
                    </p>
                  )}

                  {!isEditing && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button onClick={() => handleLike(comment)} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '20px', border: 'none',
                        background: isLiked ? 'rgba(255,215,0,0.1)' : 'transparent',
                        color: isLiked ? '#FFD700' : '#888',
                        cursor: 'pointer', fontSize: '13px'
                      }}>
                        👍 {comment.likes > 0 ? comment.likes : ''}
                      </button>
                      <button style={{
                        padding: '4px 10px', borderRadius: '20px', border: 'none',
                        background: 'transparent', color: '#888', cursor: 'pointer', fontSize: '13px'
                      }}>👎</button>
                      {isOwner && (
                        <>
                          <button onClick={() => { setEditId(comment.id); setEditContent(comment.content) }} style={{
                            padding: '4px 10px', borderRadius: '20px', border: 'none',
                            background: 'transparent', color: '#888', cursor: 'pointer', fontSize: '13px'
                          }}>✏️ แก้ไข</button>
                          <button onClick={() => handleDelete(comment.id)} style={{
                            padding: '4px 10px', borderRadius: '20px', border: 'none',
                            background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: '13px'
                          }}>🗑️ ลบ</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
