import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Hero() {
  const [stats, setStats] = useState({ novels: 0, audioNovels: 0, totalViews: 0, totalHours: 0 })
  const [email, setEmail] = useState('')
  const navigate = useNavigate()
  const loadingRef = useRef(false)

  useEffect(() => {
    drawStars()
    loadStats()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadStats()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  function drawStars() {
    const canvas = document.getElementById('starCanvas')
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      o: Math.random() * 0.7 + 0.3,
    }))
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    stars.forEach(s => {
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${s.o})`
      ctx.fill()
    })
  }

  async function loadStats() {
    if (loadingRef.current) return
    loadingRef.current = true

    try {
      const results = await Promise.allSettled([
        supabase.from('novels').select('*', { count: 'exact', head: true }),
        // ✅ ดึง count ตรงๆ ไม่ต้อง map novel_id
        supabase.from('chapters').select('*', { count: 'exact', head: true }).not('audio_url', 'is', null).neq('audio_url', ''),
        supabase.from('novels').select('views'),
        supabase.from('listen_history').select('progress_seconds'),
      ])

      const novelsResult = results[0].status === 'fulfilled' ? results[0].value : { count: 0 }
      const audioResult  = results[1].status === 'fulfilled' ? results[1].value : { count: 0 }
      const viewsResult  = results[2].status === 'fulfilled' ? results[2].value : { data: [] }
      const listenResult = results[3].status === 'fulfilled' ? results[3].value : { data: [] }

      // ✅ จำนวนตอนที่มีเสียงทั้งหมด (ไม่ใช่จำนวนนิยาย)
      const audioChapters = audioResult.count || 0
      const totalSeconds  = (listenResult.data || []).reduce((sum, r) => sum + (r.progress_seconds || 0), 0)
      const totalHours    = Math.floor(totalSeconds / 3600)

      setStats({
        novels:      novelsResult.count || 0,
        audioNovels: audioChapters,
        totalViews:  (viewsResult.data || []).reduce((sum, n) => sum + (n.views || 0), 0),
        totalHours,
      })
    } catch (err) {
      console.error('loadStats error:', err)
    } finally {
      loadingRef.current = false
    }
  }

  function fmt(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M+'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K+'
    return n.toString()
  }

  return (
    <section style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center',
      padding: '120px 20px 40px',
      background: 'radial-gradient(ellipse at 50% 0%, #0d1b3e 0%, #050510 60%)',
    }}>
      <canvas id="starCanvas" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, opacity: 0.06,
        backgroundImage: 'linear-gradient(#4fc3f7 1px, transparent 1px), linear-gradient(90deg, #4fc3f7 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', width: '100%' }}>
        <p style={{
          fontSize: '0.75rem', color: '#4fc3f7', letterSpacing: '4px',
          textTransform: 'uppercase', marginBottom: '20px',
        }}>
          ยินดีต้อนรับสู่จักรวาลนิยายแห่งอนาคต
        </p>

        <h1 style={{
          fontSize: 'clamp(2.8rem, 9vw, 5.5rem)', fontWeight: 900,
          lineHeight: 1.05, marginBottom: '16px',
          background: 'linear-gradient(135deg, #4fc3f7, #ffffff, #7c4dff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          STAR NOVEL
        </h1>

        <p style={{
          fontSize: 'clamp(0.9rem, 2.5vw, 1.4rem)', fontWeight: 300,
          color: '#4fc3f7', letterSpacing: '0px', marginBottom: '28px',
          wordSpacing: '8px',
        }}>
          ฟัง · ดื่มด่ำ · จินตนาการ · ไม่มีขีดจำกัด
        </p>

        <div style={{
          width: '3px', height: '40px',
          background: 'linear-gradient(to bottom, #4fc3f7, transparent)',
          margin: '0 auto 20px',
        }} />

        <p style={{
          fontSize: '1rem', fontWeight: 600,
          color: '#e0e8ff', marginBottom: '8px', lineHeight: 1.6,
        }}>
          เปิดหูเปิดใจ — ปล่อยให้เสียงพาคุณไปสู่<span style={{ color: '#4fc3f7' }}>จักรวาลที่ไม่มีขีดจำกัด</span>
        </p>
        <p style={{ fontSize: '0.85rem', color: '#8899bb', marginBottom: '36px' }}>
          เรื่องราวที่ดีที่สุด ควรได้ยินด้วยหู ไม่ใช่แค่มองด้วยตา
        </p>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>🎧</div>
          <p style={{ fontSize: '0.8rem', color: '#8899bb', marginBottom: '16px' }}>
            <span style={{ color: '#4fc3f7' }}>●</span> สมัครเพื่อฟัง · ภายใน 10 วินาที
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="อีเมลของคุณ"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(79,195,247,0.3)',
                borderRadius: '30px', padding: '12px 20px',
                color: '#fff', fontSize: '0.9rem',
                outline: 'none', width: '260px',
                fontFamily: 'Kanit, sans-serif',
              }}
            />
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'linear-gradient(135deg, #4fc3f7, #7c4dff)',
                border: 'none', borderRadius: '30px',
                padding: '12px 28px', color: '#fff',
                fontWeight: 700, fontSize: '0.9rem',
                cursor: 'pointer', fontFamily: 'Kanit, sans-serif',
              }}>
              เริ่มฟังเลย
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex', gap: '24px', justifyContent: 'center',
          flexWrap: 'wrap', marginBottom: '48px',
          fontSize: '0.75rem', color: '#8899bb',
        }}>
          {['✦ ไม่ต้องใส่บัตรเครดิต', '✦ สมัครฟรี 10 วินาที', '✦ ยกเลิกได้ทุกเมื่อ'].map(t => (
            <span key={t}>{t}</span>
          ))}
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1px', background: 'rgba(79,195,247,0.15)',
          borderRadius: '16px', overflow: 'hidden',
          border: '1px solid rgba(79,195,247,0.2)',
        }}>
          {[
            { value: fmt(stats.novels),      label: 'นิยาย',        color: '#fff' },
            { value: fmt(stats.audioNovels), label: 'นิยายเสียง',   color: '#4fc3f7' },
            { value: fmt(stats.totalViews),  label: 'ยอดฟัง',       color: '#7c4dff' },
            { value: fmt(stats.totalHours),  label: 'ชั่วโมงที่ฟัง', color: '#ffd700' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(5,5,16,0.8)',
              padding: '20px 10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: s.color }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8899bb', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '32px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '1px solid rgba(79,195,247,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto', color: '#4fc3f7', fontSize: '14px',
            cursor: 'pointer', animation: 'bounce 2s infinite',
          }}>↓</div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
      `}</style>
    </section>
  )
}
