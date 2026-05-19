import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { chargeId, userId, coins, amount } = req.body

  if (!chargeId || !userId || !coins || !amount) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const secretKey = process.env.OMISE_SECRET_KEY
    const auth = Buffer.from(secretKey + ':').toString('base64')

    // ถาม Omise ว่า charge นี้จ่ายแล้วหรือยัง
    const chargeRes = await fetch(`https://api.omise.co/charges/${chargeId}`, {
      headers: { 'Authorization': `Basic ${auth}` },
    })

    const charge = await chargeRes.json()
    console.log("CHECK CHARGE:", charge.id, charge.status, charge.paid)

    if (charge.paid === true) {
      // จ่ายแล้ว! เพิ่ม coin ให้ user
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      )

      // เช็คว่า charge นี้เคยเพิ่ม coin ไปแล้วหรือยัง (ป้องกันการเพิ่มซ้ำ)
      const { data: existing } = await supabase
        .from('coin_transactions')
        .select('id')
        .eq('charge_id', chargeId)
        .maybeSingle()

      if (existing) {
        // เคยเพิ่มแล้ว ไม่ต้องทำซ้ำ
        return res.status(200).json({ success: true, alreadyProcessed: true })
      }

      // ดึง coins ปัจจุบัน
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', userId)
        .single()

      // เพิ่ม coins
      await supabase
        .from('profiles')
        .update({ coins: (profile?.coins || 0) + coins })
        .eq('id', userId)

      // บันทึก transaction
      await supabase.from('coin_transactions').insert({
        user_id: userId,
        amount: coins,
        price: amount / 100,
        charge_id: chargeId,
        status: 'success',
      })

      return res.status(200).json({ success: true, paid: true })

    } else if (charge.status === 'failed' || charge.failure_code) {
      // จ่ายไม่สำเร็จ
      return res.status(200).json({
        success: false,
        paid: false,
        failed: true,
        error: charge.failure_message || 'การชำระเงินล้มเหลว'
      })

    } else {
      // ยังรอการชำระเงิน
      return res.status(200).json({ success: false, paid: false, status: charge.status })
    }

  } catch (error) {
    console.error("CHECK CHARGE ERROR:", error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
