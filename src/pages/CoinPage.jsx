import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import CoinIcon from '../components/CoinIcon'
import useSEO from "../hooks/useSEO"

const COIN_PACKAGES = [
  { coins: 50,   price: 20,  label: '50 เหรียญ' },
  { coins: 100,  price: 29,  label: '100 เหรียญ',   tag: '🔥 ยอดนิยม',  tagColor: '#ef4444' },
  { coins: 300,  price: 79,  label: '300 เหรียญ',   bonusCoins: 20,  tag: '⭐ แนะนำ',   tagColor: '#FFD700' },
  { coins: 500,  price: 129, label: '500 เหรียญ',   bonusCoins: 50,  tag: '💎 คุ้มค่า',  tagColor: '#8b5cf6' },
  { coins: 1000, price: 249, label: '1,000 เหรียญ', bonusCoins: 150, tag: '👑 สุดคุ้ม',  tagColor: '#f59e0b' },
]

export default function CoinPage() {
  useSEO({ title: 'เติมเหรียญ' })
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [userCoins, setUserCoins] = useState(0)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState(null)
  const [chargeId, setChargeId] = useState(null)
  const [polling, setPolling] = useState(false)
  const pollingRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadCoins(session.user.id)
    })
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [])

  async function loadCoins(userId) {
    const { data } = await supabase.from('profiles').select('coins').eq('id', userId).maybeSingle()
    if (data) setUserCoins(data.coins || 0)
  }

  function resetForm() {
    setSelectedPackage(null)
    setQrCodeUrl(null); setChargeId(null)
    setPolling(false)
    if (pollingRef.current) clearInterval(pollingRef.current)
  }

  function startPolling(cId, coins, amount) {
    setPolling(true)
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/check-charge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chargeId: cId, userId: user.id, coins, amount }) })
        const data = await res.json()
        if (data.paid === true) { clearInterval(pollingRef.current); setPolling(false); setMsg('✅ ชำระเงินสำเร็จ! เหรียญถูกเติมแล้ว 🎉'); loadCoins(user.id); resetForm() }
        else if (data.failed) { clearInterval(pollingRef.current); setPolling(false); setMsg('❌ ' + (data.error || 'การชำระเงินล้มเหลว')) }
      } catch (err) { console.error("Polling error:", err) }
    }, 3000)
  }

  async function handlePay() {
    if (!selectedPackage) return setMsg('❌ เลือกแพ็กเกจก่อน')
    if (!user) return navigate('/login')
    const totalCoins = selectedPackage.coins + (selectedPackage.bonusCoins || 0)
    const amount = selectedPackage.price * 100
    setLoading(true); setMsg('')
    try {
      const res = await fetch('/api/create-charge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, userId: user.id, coins: totalCoins, paymentMethod: 'promptpay' }) })
      const data = await res.json()
      if (data.success && data.chargeId) {
        setQrCodeUrl(data.qrCodeUrl)
        setChargeId(data.chargeId)
        setMsg('📱 สแกน QR Code เพื่อชำระเงิน')
        startPolling(data.chargeId, totalCoins, amount)
      } else {
        setMsg('❌ ' + (data.error || 'ไม่สามารถสร้าง QR Code ได้'))
      }
    } catch (err) { console.error(err); setMsg('❌ ' + err) }
    setLoading(false)
  }

  async function handleDownloadQR() {
    if (!qrCodeUrl) return
    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `promptpay-qr-${selectedPackage?.price ?? ''}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // fallback: open in new tab
      window.open(qrCodeUrl, '_blank')
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#fff', paddingTop: '80px' }}>
      <Navbar />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* ปุ่มย้อนกลับ */}
        <button onClick={() => navigate(-1)} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '6px 14px', color: '#94a3b8', cursor: 'pointer',
          fontSize: '0.85rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6
        }}>← ย้อนกลับ</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><CoinIcon size={80} /></div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f5c842', marginBottom: '0.5rem' }}>เติมเหรียญ</h1>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.3)', borderRadius: '20px', padding: '4px 16px', color: '#f5c842', fontSize: '0.9rem' }}>
            <CoinIcon size={18} /> เหรียญของคุณ: {userCoins} เหรียญ
          </span>
        </div>

        {/* Package Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          {COIN_PACKAGES.map((pkg, i) => {
            const selected = selectedPackage?.coins === pkg.coins
            return (
              <div key={i} onClick={() => { setSelectedPackage(pkg); setQrCodeUrl(null); setChargeId(null); setMsg('') }} style={{ background: selected ? 'linear-gradient(135deg, #b8860b, #f5c842)' : 'rgba(255,255,255,0.04)', border: selected ? '2px solid #f5c842' : pkg.tag ? `1px solid ${pkg.tagColor}55` : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.4rem 1rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
                {pkg.tag && <div style={{ position: 'absolute', top: '8px', right: '8px', background: selected ? 'rgba(0,0,0,0.2)' : pkg.tagColor, color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{pkg.tag}</div>}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px', marginTop: pkg.tag ? '8px' : '0' }}><CoinIcon size={56} /></div>
                <div style={{ fontWeight: 'bold', color: selected ? '#1a1a1a' : '#f5c842', fontSize: '1.1rem', marginBottom: '4px' }}>{pkg.label}</div>
                {pkg.bonusCoins && <div style={{ fontSize: '0.8rem', color: selected ? '#5a3a00' : '#ff9f43', marginBottom: '4px' }}>🎁 +{pkg.bonusCoins} โบนัส</div>}
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: selected ? '#1a1a1a' : '#fff' }}>฿{pkg.price}</div>
                <div style={{ fontSize: '0.72rem', color: selected ? '#5a3a00' : '#666', marginTop: '3px' }}>{((pkg.price / (pkg.coins + (pkg.bonusCoins || 0))) * 100).toFixed(1)} สต./เหรียญ</div>
              </div>
            )
          })}
        </div>

        {/* Payment Form */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem' }}>

          {/* PromptPay label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem' }}>
            <span style={{ fontSize: '1.3rem' }}>📱</span>
            <span style={{ fontWeight: 'bold', color: '#f5c842', fontSize: '1rem' }}>ชำระผ่าน PromptPay</span>
          </div>

          {/* QR Code */}
          {qrCodeUrl && (
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <div style={{ fontSize: '0.9rem', color: '#f5c842', marginBottom: '0.8rem' }}>สแกน QR Code ด้านล่างด้วยแอปธนาคาร</div>
              <img src={qrCodeUrl} alt="QR Code" style={{ width: '200px', height: '200px', borderRadius: '8px', background: '#fff', padding: '8px' }} />
              {polling && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>⏳ รอการชำระเงิน...</div>}

              {/* ปุ่มบันทึกรูป */}
              <div style={{ marginTop: '0.8rem' }}>
                <button onClick={handleDownloadQR} style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px', padding: '8px 20px', color: '#fff', cursor: 'pointer',
                  fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}>
                  💾 บันทึก QR Code
                </button>
              </div>
            </div>
          )}

          {msg && <div style={{ color: msg.startsWith('✅') ? '#2ecc71' : msg.startsWith('📱') ? '#f5c842' : '#ff6b6b', fontSize: '0.9rem', marginBottom: '0.8rem' }}>{msg}</div>}

          {!polling && (
            <button onClick={handlePay} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#555' : 'linear-gradient(135deg, #f5c842, #e6a817)', color: '#1a1a1a', fontWeight: 'bold', fontSize: '1.05rem', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '⏳ กำลังสร้าง QR Code...' : `ชำระ ฿${selectedPackage?.price ?? '...'} ผ่าน PromptPay`}
            </button>
          )}

          <div style={{ textAlign: 'center', marginTop: '0.8rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
            🔒 ปลอดภัยด้วย Omise Payment Gateway
          </div>
        </div>
      </div>
    </div>
  )
}
