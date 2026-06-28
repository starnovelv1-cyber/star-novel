import { useNavigate } from 'react-router-dom'

export default function Footer() {
  const navigate = useNavigate()

  return (
    <footer className="footer">
      <div className="footer-brand">
        <div className="logo">⭐ STAR NOVEL</div>
        <p>แพลตฟอร์มนิยายเสียงและนิยายออนไลน์ยุคใหม่ ดีไซน์ Neon Blue พรีเมียม</p>
      </div>
      <div className="footer-col">
        <h4>สำรวจ</h4>
        <a href="/novels">นิยายทั้งหมด</a>
        <a href="/novels?tab=audio">นิยายเสียง</a>
        <a href="/categories">หมวดหมู่</a>
        <a href="/ranking">Ranking</a>
      </div>
      <div className="footer-col">
        <h4>บัญชี</h4>
        <a href="/login">เข้าสู่ระบบ</a>
        <a href="/login">สมัครสมาชิก</a>
        <a href="/coins">เติม Coin</a>
        <a href="#">VIP</a>
      </div>
      <div className="footer-col">
        <h4>ช่วยเหลือ</h4>
        <a href="/policy#contact">ติดต่อเรา</a>
        <a href="/policy#terms">ข้อตกลง</a>
        <a href="/policy#privacy">ความเป็นส่วนตัว</a>
        <a href="/policy#refund">นโยบายคืนเงิน</a>
        <a href="https://line.me/R/ti/p/@896hyozw"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            padding: '6px 14px',
            backgroundColor: '#06C755',
            color: '#fff',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          💬 แชท Support
        </a>
      </div>
      <div className="footer-bottom">© 2026 STAR NOVEL · All rights reserved</div>
    </footer>
  )
}
