import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    }
    setLoading(false)
  }

  if (success) return (
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
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>เปลี่ยนรหัสผ่านสำเร็จ!</h2>
        <p style={{ color: '#888' }}>กำลังพาไปหน้าหลัก...</p>
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
          ตั้งรหัสผ่านใหม่
        </h2>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: '1.5rem', fontSize: '14px' }}>
          กรอกรหัสผ่านใหม่ของคุณ
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
              รหัสผ่านใหม่
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="อย่างน้อย 6 ตัวอักษร"
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

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#888', fontSize: '14px', display: 'block', marginBottom: '0.5rem' }}>
              ยืนยันรหัสผ่านใหม่
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="กรอกรหัสผ่านอีกครั้ง"
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
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
          </button>
        </form>
      </div>
    </div>
  )
}
