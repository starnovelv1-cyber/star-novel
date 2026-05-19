import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  // ✅ แสดงปุ่มกลับเมื่อไม่ได้อยู่หน้าแรก
  const canGoBack = location.pathname !== '/'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchRole(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchRole(session.user.id)
      else setRole(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchRole(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    setRole(data?.role ?? null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  function handleSearch(e) {
    e.preventDefault()
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`)
  }

  const isAdmin = role === 'admin' || role === 'owner'

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* ✅ ปุ่มกลับหน้าเก่า — แสดงเมื่อไม่อยู่หน้าแรก */}
        {canGoBack && (
          <button
            onClick={() => navigate(-1)}
            title="กลับหน้าที่แล้ว"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#aac8e0',
              borderRadius: '8px',
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              lineHeight: 1,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,195,247,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            ←
          </button>
        )}

        <div
          className="logo"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4fc3f7"/>
                <stop offset="100%" stopColor="#1565c0"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="1.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill="url(#starGrad)"
              filter="url(#glow)"
              stroke="#4fc3f7"
              strokeWidth="0.5"
            />
          </svg>
          <span style={{ color: '#4fc3f7', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '1px' }}>
            STAR NOVEL
          </span>
        </div>
      </div>

      <ul className="nav-links">
        <li><span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>หน้าแรก</span></li>
        <li><span onClick={() => navigate('/novels')} style={{ cursor: 'pointer' }}>นิยาย</span></li>
        <li><span onClick={() => navigate('/novels?tab=audio')} style={{ cursor: 'pointer' }}>นิยายเสียง</span></li>
        <li><span onClick={() => navigate('/categories')} style={{ cursor: 'pointer' }}>หมวดหมู่</span></li>
        <li><span onClick={() => navigate('/ranking')} style={{ cursor: 'pointer' }}>Ranking</span></li>
        <li><span onClick={() => navigate('/authors')} style={{ cursor: 'pointer' }}>นักเขียน</span></li>
        {isAdmin && (
          <li>
            <span onClick={() => navigate('/admin')} style={{ cursor: 'pointer', color: '#ffd700', fontWeight: 600 }}>
              🛡️ Admin
            </span>
          </li>
        )}
      </ul>

      <div className="nav-right">
        <form onSubmit={handleSearch} style={{ display: 'contents' }}>
          <input
            className="search-box"
            type="text"
            placeholder="ค้นหานิยาย…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>

        <div className="btn-coin" onClick={() => navigate('/coins')} style={{ cursor: 'pointer' }}>
          💰 เติม Coin
        </div>

        {user ? (
          <>
            <button onClick={() => navigate('/profile')} style={{
              padding: "0.4rem 1rem", borderRadius: "8px",
              border: "1px solid rgba(79,195,247,0.4)",
              background: "transparent", color: "#4fc3f7",
              cursor: "pointer", fontSize: "0.9rem",
            }}>
              👤 โปรไฟล์
            </button>
            <button onClick={handleLogout} style={{
              padding: "0.4rem 1rem", borderRadius: "8px",
              border: "1px solid rgba(255,100,100,0.4)",
              background: "transparent", color: "#ff6464",
              cursor: "pointer", fontSize: "0.9rem",
            }}>
              ออกจากระบบ
            </button>
          </>
        ) : (
          <button onClick={() => navigate('/login')} style={{
            padding: "0.4rem 1rem", borderRadius: "8px",
            border: "1px solid rgba(79,195,247,0.4)",
            background: "transparent", color: "#4fc3f7",
            cursor: "pointer", fontSize: "0.9rem",
          }}>
            เข้าสู่ระบบ
          </button>
        )}
      </div>
    </nav>
  )
}
