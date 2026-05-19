import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TABS = [
  { key: 'views', label: '👁 ยอดวิว' },
  { key: 'likes', label: '❤️ ยอดไลก์' },
]

const medalColor = { 0: '#FFD700', 1: '#C0C0C0', 2: '#CD7F32' }
const medalIcon  = { 0: '🥇', 1: '🥈', 2: '🥉' }

export default function RankingPage() {
  const navigate = useNavigate()
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('views')

  useEffect(() => { loadData() }, [activeTab])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('novels')
      .select('*, categories!novels_category_id_fkey(name), writers(pen_name)')
      .order(activeTab, { ascending: false })
      .limit(50)
    setNovels(data || [])
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        <button onClick={() => navigate(-1)} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '6px 14px', color: '#94a3b8', cursor: 'pointer',
          fontSize: '0.85rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6
        }}>← ย้อนกลับ</button>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#FFD700', marginBottom: '0.5rem' }}>🏆 อันดับนิยาย</h1>
          <p style={{ color: '#888' }}>นิยายที่ได้รับความนิยมสูงสุด</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              background: activeTab === tab.key ? '#FFD700' : '#1a1a1a',
              color: activeTab === tab.key ? '#000' : '#888',
              border: `1px solid ${activeTab === tab.key ? '#FFD700' : '#333'}`,
              padding: '8px 18px', borderRadius: '20px',
              cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s'
            }}>{tab.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>⏳ กำลังโหลด...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {novels.map((novel, index) => (
              <Link key={novel.id} to={`/novel/${novel.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: index < 3 ? `${medalColor[index]}11` : '#111',
                  border: `1px solid ${index < 3 ? `${medalColor[index]}44` : '#222'}`,
                  borderRadius: '12px', padding: '14px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  transition: 'transform 0.15s, border-color 0.15s', cursor: 'pointer'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; if (index >= 3) e.currentTarget.style.borderColor = '#FFD700' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; if (index >= 3) e.currentTarget.style.borderColor = '#222' }}>
                  <div style={{ width: '40px', textAlign: 'center', flexShrink: 0, fontSize: index < 3 ? '1.75rem' : '1rem', color: index < 3 ? medalColor[index] : '#555', fontWeight: 700 }}>
                    {index < 3 ? medalIcon[index] : `#${index + 1}`}
                  </div>
                  <div style={{ width: '50px', height: '70px', borderRadius: '8px', overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
                    {novel.cover_url
                      ? <img src={novel.cover_url} alt={novel.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📚</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{novel.title}</h3>
                    <p style={{ color: '#888', fontSize: '12px' }}>✍️ {novel.writers?.pen_name || 'ไม่ระบุ'} · 📂 {novel.categories?.name || 'ไม่ระบุ'}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: index < 3 ? medalColor[index] : '#FFD700', fontWeight: 700, fontSize: '15px' }}>
                      {(novel[activeTab] || 0).toLocaleString()}
                    </div>
                    <div style={{ color: '#666', fontSize: '11px' }}>{TABS.find(t => t.key === activeTab)?.label}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
