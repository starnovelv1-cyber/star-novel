import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050510',
      flexDirection: 'column',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🌟</div>
      <h1 style={{
        fontSize: '6rem',
        fontWeight: '900',
        color: '#4fc3f7',
        margin: '0',
        lineHeight: '1'
      }}>
        404
      </h1>
      <h2 style={{
        color: 'white',
        fontSize: '1.5rem',
        margin: '1rem 0 0.5rem'
      }}>
        ไม่พบหน้าที่คุณค้นหา
      </h2>
      <p style={{
        color: '#888',
        marginBottom: '2rem',
        maxWidth: '400px',
        lineHeight: '1.8'
      }}>
        หน้านี้อาจถูกลบไปแล้ว หรือ URL ที่พิมพ์อาจผิดพลาด
      </p>
      <Link to="/" style={{
        background: 'linear-gradient(135deg, #4fc3f7, #7c4dff)',
        color: 'white',
        padding: '14px 32px',
        borderRadius: '30px',
        fontWeight: '700',
        fontSize: '1rem',
        textDecoration: 'none',
        transition: 'opacity .2s'
      }}>
        กลับหน้าหลัก
      </Link>
    </div>
  )
}
