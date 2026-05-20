import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/novels', label: 'จัดการนิยาย', icon: '📚' },
  { path: '/admin/chapters', label: 'จัดการตอน/เสียง', icon: '🎙️' },
  { path: '/admin/writers', label: 'นักเขียน', icon: '✍️' },
  { path: '/admin/users', label: 'ผู้ใช้งาน', icon: '👥' },
  { path: '/admin/categories', label: 'หมวดหมู่', icon: '🏷️' },
  { path: '/admin/comments', label: 'ความคิดเห็น', icon: '💬' },
  { path: '/admin/duplicate-check', label: 'ตรวจงานซ้ำ', icon: '🛡️' },
  { path: '/admin/announcements', label: 'ประกาศ', icon: '📢' },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f' }}>

      {/* Top Navigation Bar */}
      <header style={{
        background: '#141414',
        borderBottom: '1px solid #222',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        height: '52px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* โลโก้ */}
        <span style={{ color: '#4fc3f7', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#4fc3f7">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
          STAR ADMIN
        </span>

        {/* เมนู */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, overflowX: 'auto' }}>
          {menuItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px',
                color: isActive ? '#4fc3f7' : '#aaa',
                background: isActive ? '#1a2a3a' : 'transparent',
                textDecoration: 'none', fontSize: '13px',
                borderRadius: '6px',
                borderBottom: isActive ? '2px solid #4fc3f7' : '2px solid transparent',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* ปุ่มกลับหน้าหลัก */}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#1a2a3a',
            border: '1px solid #4fc3f7',
            color: '#4fc3f7',
            padding: '6px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            flexShrink: 0,
          }}>
          🏠 กลับหน้าหลัก
        </button>
      </header>

      {/* เนื้อหา */}
      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
