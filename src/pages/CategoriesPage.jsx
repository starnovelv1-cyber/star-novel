import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const categoryEmoji = {
  'แฟนตาซี': '🧙', 'โรแมนติก': '💕', 'แอคชัน': '⚔️',
  'สยองขวัญ': '👻', 'นิยายวิทยาศาสตร์': '🚀', 'ชีวิตประจำวัน': '🌸',
  'ผจญภัย': '🗺️', 'ตลก': '😂', 'ดราม่า': '🎭',
}

const cardColors = [
  { bg: '#1a1a2e', border: '#3b82f6', accent: '#60a5fa' },
  { bg: '#1a0a2e', border: '#8b5cf6', accent: '#a78bfa' },
  { bg: '#1a2e1a', border: '#10b981', accent: '#34d399' },
  { bg: '#2e1a1a', border: '#ef4444', accent: '#fca5a5' },
  { bg: '#2e2a1a', border: '#f59e0b', accent: '#FFD700' },
  { bg: '#1a2e2e', border: '#06b6d4', accent: '#67e8f9' },
]

export default function CategoriesPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: cats } = await supabase.from('categories').select('*, novels(count)').order('name')
    setCategories(cats || [])
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        <button onClick={() => navigate(-1)} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '6px 14px', color: '#94a3b8', cursor: 'pointer',
          fontSize: '0.85rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6
        }}>← ย้อนกลับ</button>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#34d399', marginBottom: '0.5rem' }}>📂 หมวดหมู่</h1>
          <p style={{ color: '#888' }}>เลือกอ่านนิยายตามที่ชอบ</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>⏳ กำลังโหลด...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {categories.map((cat, i) => {
              const color = cardColors[i % cardColors.length]
              const emoji = categoryEmoji[cat.name] || cat.icon || '📖'
              const count = cat.novels?.[0]?.count ?? 0
              return (
                <Link key={cat.id} to={`/novels?category=${cat.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: color.bg, border: `1px solid ${color.border}22`, borderRadius: '16px', padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = color.border; e.currentTarget.style.boxShadow = `0 8px 24px ${color.border}33` }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = `${color.border}22`; e.currentTarget.style.boxShadow = 'none' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{emoji}</div>
                    <h3 style={{ color: color.accent, fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>{cat.name}</h3>
                    <p style={{ color: '#666', fontSize: '12px' }}>{count} เรื่อง</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
        {!loading && categories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
            <p>ยังไม่มีหมวดหมู่ กรุณาเพิ่มในหน้า Admin</p>
          </div>
        )}
      </div>
    </div>
  )
}
