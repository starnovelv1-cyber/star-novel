import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function NovelGrid() {
  const navigate = useNavigate()
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNovels() {
      const { data, error } = await supabase
        .from('novels')
        .select('*, writers!writer_id(pen_name), categories!category_id(name, color, icon)')
        .order('created_at', { ascending: false })
        .limit(12)

      if (error) {
        console.error('NovelGrid fetch error:', error)
        setLoading(false)
        return
      }

      setNovels(data || [])
      setLoading(false)
    }
    fetchNovels()
  }, [])

  if (loading) return (
    <section className="section">
      <p style={{ color: '#888', textAlign: 'center' }}>กำลังโหลด...</p>
    </section>
  )

  if (novels.length === 0) return (
    <section className="section">
      <div className="section-header">
        <h2>นิยายแนะนำ</h2>
        <p className="section-sub">ยังไม่มีนิยาย — เพิ่มได้ที่ Admin Studio</p>
      </div>
    </section>
  )

  return (
    <section className="section">
      <div className="section-header">
        <h2>นิยายแนะนำ</h2>
        <p className="section-sub">เลือกเรื่องที่คุณชอบ</p>
      </div>
      <div className="novel-grid">
        {novels.map((novel) => (
          <div
            key={novel.id}
            className="novel-card"
            onClick={() => navigate(`/novel/${novel.id}`)}
          >
            <div className="novel-cover">
              {novel.cover_url
                ? <img src={novel.cover_url} alt={novel.title} />
                : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: `linear-gradient(135deg, ${novel.categories?.color || '#333'}44, #0d0d2b)`,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '48px'
                  }}>
                    {novel.categories?.icon || '📚'}
                  </div>
                )
              }
              {/* Badge จำนวนตอน */}
              <div style={{
                position: 'absolute', top: '8px', right: '8px',
                background: 'rgba(0,0,0,0.75)', color: '#fff',
                fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                backdropFilter: 'blur(4px)'
              }}>
                📖 {novel.total_chapters || 0} ตอน
              </div>
            </div>

            <div className="novel-info">
              <h3>{novel.title}</h3>
              <p style={{ color: '#888', fontSize: '12px', margin: '2px 0' }}>
                {novel.writers?.pen_name || 'ไม่ระบุนักเขียน'}
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '12px', color: '#aaa' }}>
                <span>👁 {(novel.views || 0).toLocaleString()}</span>
                <span>⭐ {novel.rating || '-'}</span>
                <span style={{
                  background: novel.status === 'completed' ? '#064e3b' : '#1e3a5f',
                  color: novel.status === 'completed' ? '#34d399' : '#60a5fa',
                  padding: '1px 6px', borderRadius: '10px', fontSize: '10px'
                }}>
                  {novel.status === 'completed' ? 'จบแล้ว' : 'กำลังดำเนิน'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
