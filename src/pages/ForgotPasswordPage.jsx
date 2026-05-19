import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://star-novel.vercel.app/reset-password'
    })

    if (error) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050510'
    }}>
      <div style={{
        background: '#0d0d1f',
        border: '1px solid #2a2a4a',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
        <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>เช็ค Email ได้เลย!</h2>
        <p style={{ color: '#888', marginBottom: '1.5rem' }}>
          เราส่งลิงก์รีเซ็ตรหัสผ่านไปที่ <strong style={{ color: 'white' }}>{email}</strong> แล้ว
        </p>
        <Link to="/login" style={{
          color: '#a78bfa',
          textDecoration: 'none',
          fontSize: '14px'
        }}>
          ← กลับไปหน้า Login
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050510'
    }}>
      <div style={{
        background: '#0d0d1f',
        border: '1px solid #2a2a4a',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h2 style={{ color: 'white', marginBottom: '0.5rem', textAlign: 'center' }}>
          ลืมรหัสผ่าน
        </h2>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: '1.5rem', fontSize: '14px' }}>
          กรอก Email ที่ใช้สมัคร เราจะส่งลิงก์รีเซ็ตให้
        </p>

        {error && (
          <div style={{
            background: '#2a1a1a',
            border: '1px solid #f87171',
            borderRadius: '8px',
            padding: '0.75rem',
            color: '#f87171',
            fontSize: '14px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#888', fontSize: '14px', display: 'block', marginBottom: '0.5rem' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#1a1a2e',
                border: '1px solid #2a2a4a',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? '#4a4a6a' : 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '1rem'
            }}
          >
            {loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <Link to="/login" style={{
            color: '#a78bfa',
            textDecoration: 'none',
            fontSize: '14px'
          }}>
            ← กลับไปหน้า Login
          </Link>
        </div>
      </div>
    </div>
  )
}
