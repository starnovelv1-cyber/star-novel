import Navbar from '../components/Navbar'
import { useNavigate } from 'react-router-dom'

export default function PolicyPage() {
  const navigate = useNavigate()

  const section = {
    marginBottom: '2.5rem',
  }
  const h2 = {
    fontSize: '1.2rem', fontWeight: 700,
    color: '#4fc3f7', marginBottom: '1rem',
    borderBottom: '1px solid #222', paddingBottom: '8px',
  }
  const p = {
    color: '#aaa', lineHeight: 1.9, fontSize: '14px', marginBottom: '0.8rem',
  }
  const li = {
    color: '#aaa', lineHeight: 1.9, fontSize: '14px', marginBottom: '4px',
  }

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '100px 1rem 4rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          <button onClick={() => navigate(-1)} style={{
            marginBottom: '2rem', background: 'none',
            border: '1px solid #333', color: '#aaa',
            padding: '6px 16px', borderRadius: '20px',
            cursor: 'pointer', fontSize: '13px'
          }}>← ย้อนกลับ</button>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            📋 นโยบายและข้อมูลบริษัท
          </h1>
          <p style={{ color: '#555', fontSize: '13px', marginBottom: '3rem' }}>
            อัปเดตล่าสุด: พฤษภาคม 2568
          </p>

          {/* ติดต่อเรา */}
          <div style={section}>
            <h2 style={h2}>📞 ติดต่อเรา</h2>
            <p style={p}>
              <strong style={{ color: '#fff' }}>ชื่อบริการ:</strong> Star Novel
            </p>
            <p style={p}>
              <strong style={{ color: '#fff' }}>ประเภท:</strong> แพลตฟอร์มนิยายเสียงและนิยายออนไลน์
            </p>
            <p style={p}>
              <strong style={{ color: '#fff' }}>อีเมล:</strong>{' '}
              <a href="mailto:starnovelv1@gmail.com" style={{ color: '#4fc3f7' }}>
                starnovelv1@gmail.com
              </a>
            </p>
            <p style={p}>
              <strong style={{ color: '#fff' }}>เว็บไซต์:</strong>{' '}
              <a href="https://star-novel.vercel.app" style={{ color: '#4fc3f7' }}>
                https://star-novel.vercel.app
              </a>
            </p>
            <p style={p}>
              <strong style={{ color: '#fff' }}>เวลาทำการ:</strong> จันทร์ - อาทิตย์ 09:00 - 21:00 น.
            </p>
          </div>

          {/* รายละเอียดบริการ */}
          <div style={section}>
            <h2 style={h2}>📚 รายละเอียดบริการ</h2>
            <p style={p}>
              Star Novel คือแพลตฟอร์มนิยายเสียงและนิยายออนไลน์ภาษาไทย
              ผู้ใช้สามารถอ่านและฟังนิยายได้ผ่านระบบเหรียญ (Coin)
              โดยนักเขียนอิสระเป็นผู้สร้างเนื้อหาและมอบสิทธิ์การเผยแพร่ให้แก่แพลตฟอร์ม
            </p>
            <p style={p}><strong style={{ color: '#fff' }}>บริการที่ให้:</strong></p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li style={li}>อ่านนิยายออนไลน์ผ่านเว็บไซต์</li>
              <li style={li}>ฟังนิยายเสียง (Audio Novel)</li>
              <li style={li}>ระบบเหรียญสำหรับปลดล็อคตอนพิเศษ</li>
              <li style={li}>ระบบบุ๊กมาร์กและประวัติการฟัง</li>
            </ul>
          </div>

          {/* ราคาและการชำระเงิน */}
          <div style={section}>
            <h2 style={h2}>💰 ราคาและการชำระเงิน</h2>
            <p style={p}>ราคาทั้งหมดแสดงเป็นสกุลเงินบาท (THB) รวม VAT แล้ว</p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li style={li}>แพ็กเกจเหรียญ 50 เหรียญ — 20 บาท</li>
              <li style={li}>แพ็กเกจเหรียญ 100 เหรียญ — 29 บาท</li>
              <li style={li}>แพ็กเกจเหรียญ 300 เหรียญ — 79 บาท (+20 โบนัส)</li>
              <li style={li}>แพ็กเกจเหรียญ 500 เหรียญ — 129 บาท (+50 โบนัส)</li>
              <li style={li}>แพ็กเกจเหรียญ 1,000 เหรียญ — 249 บาท (+150 โบนัส)</li>
            </ul>
            <p style={{ ...p, marginTop: '1rem' }}>
              รับชำระผ่าน: บัตรเครดิต/เดบิต, พร้อมเพย์, TrueMoney Wallet
            </p>
          </div>

          {/* นโยบายการยกเลิกและคืนเงิน */}
          <div style={section}>
            <h2 style={h2}>🔄 นโยบายการยกเลิกและคืนเงิน</h2>
            <p style={p}>
              เนื่องจากเหรียญ (Coin) เป็นสินค้าดิจิทัลที่ใช้งานได้ทันทีหลังการซื้อ
              ทางแพลตฟอร์มจึง<strong style={{ color: '#fff' }}>ไม่รับคืนเงินในทุกกรณี</strong> ยกเว้น:
            </p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li style={li}>ระบบเกิดข้อผิดพลาดทางเทคนิคที่ทำให้ไม่ได้รับเหรียญหลังชำระเงิน</li>
              <li style={li}>มีการเรียกเก็บเงินซ้ำซ้อนโดยไม่ได้ตั้งใจ</li>
            </ul>
            <p style={{ ...p, marginTop: '1rem' }}>
              หากพบปัญหาดังกล่าว กรุณาติดต่อ{' '}
              <a href="mailto:starnovelv1@gmail.com" style={{ color: '#4fc3f7' }}>
                starnovelv1@gmail.com
              </a>{' '}
              ภายใน 7 วันหลังการทำรายการ พร้อมแนบหลักฐานการชำระเงิน
            </p>
          </div>

          {/* Privacy Policy */}
          <div style={section}>
            <h2 style={h2}>🔒 นโยบายความเป็นส่วนตัว (Privacy Policy)</h2>
            <p style={p}>
              Star Novel ให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้งาน
              โดยมีนโยบายการเก็บและใช้ข้อมูลดังนี้:
            </p>

            <p style={{ ...p, color: '#fff', fontWeight: 600 }}>ข้อมูลที่เก็บรวบรวม</p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li style={li}>ชื่อและอีเมลที่ใช้ในการสมัครสมาชิก</li>
              <li style={li}>ประวัติการอ่านและการฟัง</li>
              <li style={li}>ข้อมูลการชำระเงิน (ประมวลผลผ่าน Omise — ไม่เก็บข้อมูลบัตรโดยตรง)</li>
              <li style={li}>ข้อมูลการใช้งานเว็บไซต์ทั่วไป</li>
            </ul>

            <p style={{ ...p, color: '#fff', fontWeight: 600, marginTop: '1rem' }}>วัตถุประสงค์การใช้ข้อมูล</p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li style={li}>เพื่อให้บริการและปรับปรุงประสบการณ์การใช้งาน</li>
              <li style={li}>เพื่อประมวลผลการชำระเงินและยืนยันรายการ</li>
              <li style={li}>เพื่อแจ้งข่าวสารและอัปเดตบริการ (สามารถยกเลิกได้)</li>
            </ul>

            <p style={{ ...p, color: '#fff', fontWeight: 600, marginTop: '1rem' }}>การแบ่งปันข้อมูล</p>
            <p style={p}>
              Star Novel ไม่ขายหรือแบ่งปันข้อมูลส่วนตัวของผู้ใช้แก่บุคคลที่สาม
              ยกเว้นที่จำเป็นสำหรับการประมวลผลชำระเงิน (Omise)
              และการให้บริการระบบฐานข้อมูล (Supabase)
            </p>

            <p style={{ ...p, color: '#fff', fontWeight: 600, marginTop: '1rem' }}>สิทธิ์ของผู้ใช้</p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li style={li}>ขอดู แก้ไข หรือลบข้อมูลส่วนตัวได้ตลอดเวลา</li>
              <li style={li}>ยกเลิกการรับการแจ้งเตือนได้</li>
              <li style={li}>ติดต่อขอใช้สิทธิ์ได้ที่ starnovelv1@gmail.com</li>
            </ul>
          </div>

          {/* Terms */}
          <div style={section}>
            <h2 style={h2}>📜 ข้อกำหนดการใช้งาน</h2>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li style={li}>ผู้ใช้ต้องมีอายุ 13 ปีขึ้นไป</li>
              <li style={li}>ห้ามคัดลอก ดัดแปลง หรือเผยแพร่เนื้อหาโดยไม่ได้รับอนุญาต</li>
              <li style={li}>เหรียญที่ซื้อแล้วไม่สามารถโอนหรือถอนเป็นเงินสดได้</li>
              <li style={li}>แพลตฟอร์มขอสงวนสิทธิ์ในการระงับบัญชีที่มีพฤติกรรมไม่เหมาะสม</li>
            </ul>
          </div>

        </div>
      </div>
    </>
  )
}
