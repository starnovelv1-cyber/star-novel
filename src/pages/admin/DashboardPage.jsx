import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    novels: 0, users: 0, writers: 0, chapters: 0,
    totalCoinsSpent: 0, totalUnlocks: 0, totalComments: 0,
  })
  const [recentUnlocks, setRecentUnlocks] = useState([])
  const [recentComments, setRecentComments] = useState([])
  const [chapters, setChapters] = useState([])   // ✅ cache chapters สำหรับ lookup
  const [novels, setNovels] = useState([])       // ✅ cache novels สำหรับ lookup
  const [tab, setTab] = useState('unlocks')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    // ✅ แยก query unlocked_chapters ออก — ไม่ join chapters/novels เพราะ FK อาจไม่ตรง
    const results = await Promise.allSettled([
      supabase.from('novels').select('id, title', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('writers').select('id', { count: 'exact', head: true }),
      supabase.from('chapters').select('id, chapter_number, title, novel_id', { count: 'exact' }),
      supabase.from('unlocked_chapters')
        .select('id, coins_spent, created_at, chapter_id, novel_id, user_id')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('comments')
        .select('id, content, created_at, novel_id, profiles(email)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const [novelsRes, usersRes, writersRes, chaptersRes, unlocksRes, commentsRes] = results

    const novelsData   = novelsRes.status === 'fulfilled'   ? novelsRes.value   : { data: [], count: 0 }
    const usersData    = usersRes.status === 'fulfilled'    ? usersRes.value    : { count: 0 }
    const writersData  = writersRes.status === 'fulfilled'  ? writersRes.value  : { count: 0 }
    const chaptersData = chaptersRes.status === 'fulfilled' ? chaptersRes.value : { data: [], count: 0 }
    const unlocksData  = unlocksRes.status === 'fulfilled'  ? unlocksRes.value  : { data: [] }
    const commentsData = commentsRes.status === 'fulfilled' ? commentsRes.value : { data: [], count: 0 }

    const chaptersList = chaptersData.data || []
    const novelsList   = novelsData.data || []
    let   unlocksList  = unlocksData.data || []

    // ✅ ดึง email แยก เพราะ unlocked_chapters ไม่มี FK ไป profiles
    if (unlocksList.length > 0) {
      const userIds = [...new Set(unlocksList.map(u => u.user_id).filter(Boolean))]
      const { data: profilesData } = await supabase
        .from('profiles').select('id, email').in('id', userIds)
      const profileMap = Object.fromEntries((profilesData || []).map(p => [p.id, p.email]))
      unlocksList = unlocksList.map(u => ({ ...u, email: profileMap[u.user_id] || '-' }))
    }

    // เก็บ cache ไว้ lookup ใน table
    setChapters(chaptersList)
    setNovels(novelsList)

    const totalCoins = unlocksList.reduce((sum, u) => sum + (u.coins_spent || 0), 0)

    setStats({
      novels:         novelsData.count  || novelsList.length,
      users:          usersData.count   || 0,
      writers:        writersData.count || 0,
      chapters:       chaptersData.count || chaptersList.length,
      totalCoinsSpent: totalCoins,
      totalUnlocks:   unlocksList.length,
      totalComments:  commentsData.count || 0,
    })
    setRecentUnlocks(unlocksList)
    setRecentComments(commentsData.data || [])
  }

  // ✅ lookup chapter title/number จาก cache แทน join
  function getChapter(chapterId) {
    return chapters.find(c => String(c.id) === String(chapterId))
  }
  function getNovelTitle(novelId) {
    return novels.find(n => String(n.id) === String(novelId))?.title || '-'
  }

  const cards = [
    { label: 'นิยายทั้งหมด',   value: stats.novels,          icon: '📚', color: '#7C3AED' },
    { label: 'ผู้ใช้งาน',       value: stats.users,           icon: '👥', color: '#0891B2' },
    { label: 'นักเขียน',        value: stats.writers,         icon: '✍️', color: '#D97706' },
    { label: 'ตอนทั้งหมด',     value: stats.chapters,        icon: '🎙️', color: '#059669' },
    { label: 'เหรียญที่ใช้ไป', value: `🪙 ${stats.totalCoinsSpent.toLocaleString()}`, icon: '💰', color: '#FFD700' },
    { label: 'ปลดล็อคทั้งหมด', value: stats.totalUnlocks,    icon: '🔓', color: '#f472b6' },
    { label: 'ความคิดเห็น',    value: stats.totalComments,   icon: '💬', color: '#34d399' },
  ]

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  async function handleDeleteComment(id) {
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (!error) {
      setRecentComments(prev => prev.filter(c => c.id !== id))
      setStats(prev => ({ ...prev, totalComments: prev.totalComments - 1 }))
    }
    setDeleteTarget(null)
  }

  return (
    <div>
      {/* Custom Confirm Modal */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '24px 28px', maxWidth: '360px', width: '90%' }}>
            <p style={{ color: '#fff', fontWeight: 600, marginBottom: '8px' }}>ลบความคิดเห็นนี้?</p>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ background: '#333', color: '#ccc', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer' }}>ยกเลิก</button>
              <button onClick={() => handleDeleteComment(deleteTarget)} style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>🗑️ ลบ</button>
            </div>
          </div>
        </div>
      )}

      <h1 style={{ color: '#fff', marginBottom: '1.5rem' }}>📊 Dashboard</h1>

      {/* Stats Cards */}
      {/* ✅ scroll แนวนอนเมื่อหน้าจอแคบ ป้องกัน wrap */}
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))',
        gap: '16px',
        minWidth: '1000px',
      }}>
        {cards.map(card => (
          <div key={card.label} style={{
            background: '#1a1a1a',
            border: `1px solid ${card.color}44`,
            borderRadius: '12px',
            padding: '1.5rem',
            minHeight: '120px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{card.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{card.label}</div>
          </div>
        ))}
      </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        {[
          { key: 'unlocks',  label: '🔓 การปลดล็อคล่าสุด' },
          { key: 'comments', label: '💬 ความคิดเห็นล่าสุด' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 20px', borderRadius: '20px', cursor: 'pointer',
            background: tab === t.key ? 'rgba(255,215,0,0.15)' : '#1a1a1a',
            color:      tab === t.key ? '#FFD700' : '#888',
            fontWeight: tab === t.key ? 700 : 400,
            border: `1px solid ${tab === t.key ? '#FFD700' : '#333'}`,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '1.5rem' }}>

        {/* Unlocks Tab */}
        {tab === 'unlocks' && (
          recentUnlocks.length === 0 ? (
            <p style={{ color: '#888' }}>ยังไม่มีการปลดล็อค</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  {['ผู้ใช้', 'นิยาย', 'ตอน', 'เหรียญ', 'วันที่'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#888', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUnlocks.map((u, i) => {
                  const ch = getChapter(u.chapter_id)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #1e1e1e' }}>
                      <td style={{ padding: '10px', color: '#aaa' }}>{u.email || '-'}</td>
                      <td style={{ padding: '10px', color: '#aaa' }}>{getNovelTitle(u.novel_id)}</td>
                      <td style={{ padding: '10px' }}>
                        {ch ? `ตอน ${ch.chapter_number} — ${ch.title}` : `ตอน #${u.chapter_id}`}
                      </td>
                      <td style={{ padding: '10px', color: '#FFD700', fontWeight: 700 }}>🪙 {u.coins_spent}</td>
                      <td style={{ padding: '10px', color: '#888' }}>{formatDate(u.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        )}

        {/* Comments Tab */}
        {tab === 'comments' && (
          recentComments.length === 0 ? (
            <p style={{ color: '#888' }}>ยังไม่มีความคิดเห็น</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  {['ผู้ใช้', 'เนื้อหา', 'วันที่', 'จัดการ'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#888', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentComments.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #1e1e1e' }}>
                    <td style={{ padding: '10px', color: '#aaa' }}>{c.profiles?.email?.split('@')[0] || '-'}</td>
                    <td style={{ padding: '10px', color: '#ccc', maxWidth: '400px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content}</div>
                    </td>
                    <td style={{ padding: '10px', color: '#888', whiteSpace: 'nowrap' }}>{formatDate(c.created_at)}</td>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => setDeleteTarget(c.id)} style={{
                        padding: '4px 12px', borderRadius: '20px', border: 'none',
                        background: 'rgba(239,68,68,0.1)', color: '#f87171',
                        cursor: 'pointer', fontSize: '12px',
                      }}>🗑️ ลบ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  )
}
