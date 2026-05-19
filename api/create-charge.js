import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { amount, token, userId, coins, paymentMethod, phoneNumber } = req.body

  if (!amount || !userId || !coins || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  if (amount < 2000) {
    return res.status(400).json({ success: false, error: 'ยอดชำระขั้นต่ำ ฿20' })
  }

  try {
    const secretKey = process.env.OMISE_SECRET_KEY
    const auth = Buffer.from(secretKey + ':').toString('base64')

    let chargeBody = {
      amount: String(amount),
      currency: 'thb',
      description: `Star Novel - ${coins} coins`,
    }

    if (paymentMethod === 'card') {
      if (!token) return res.status(400).json({ error: 'Missing card token' })
      chargeBody.card = token

    } else if (paymentMethod === 'promptpay') {
      const sourceRes = await fetch('https://api.omise.co/sources', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: String(amount),
          currency: 'thb',
          type: 'promptpay',
        }),
      })
      const source = await sourceRes.json()
      console.log("PROMPTPAY SOURCE:", source)
      if (source.object === 'error') {
        return res.status(400).json({ success: false, error: source.message })
      }
      chargeBody.source = source.id

    } else if (paymentMethod === 'truemoney') {
      if (!phoneNumber) return res.status(400).json({ error: 'Missing phone number' })
      const sourceRes = await fetch('https://api.omise.co/sources', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: String(amount),
          currency: 'thb',
          type: 'truemoney',
          phone_number: phoneNumber,
          return_uri: 'https://star-novel.vercel.app/coins',
        }),
      })
      const source = await sourceRes.json()
      console.log("TRUEMONEY SOURCE:", source)
      if (source.object === 'error') {
        return res.status(400).json({ success: false, error: source.message })
      }
      chargeBody.source = source.id
      chargeBody.return_uri = 'https://star-novel.vercel.app/coins'
    }

    const chargeRes = await fetch('https://api.omise.co/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(chargeBody),
    })

    const charge = await chargeRes.json()
    console.log("CHARGE:", charge.id, charge.status, charge.paid)

    if (charge.object === 'error') {
      return res.status(400).json({ success: false, error: charge.message })
    }

    if (paymentMethod === 'card') {
      if (charge.paid === true) {
        const supabase = createClient(
          process.env.VITE_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        )
        const { data: profile } = await supabase
          .from('profiles').select('coins').eq('id', userId).single()
        await supabase
          .from('profiles')
          .update({ coins: (profile?.coins || 0) + coins })
          .eq('id', userId)
        await supabase.from('coin_transactions').insert({
          user_id: userId,
          amount: coins,
          price: amount / 100,
          charge_id: charge.id,
          status: 'success',
        })
        return res.status(200).json({ success: true, paid: true })
      } else {
        return res.status(400).json({
          success: false,
          error: charge.failure_message || 'Payment failed',
        })
      }
    } else {
      return res.status(200).json({
        success: true,
        paid: false,
        chargeId: charge.id,
        qrCodeUrl: charge.source?.scannable_code?.image?.download_uri || null,
        authorizeUri: charge.authorize_uri || null,
        status: charge.status,
      })
    }

  } catch (error) {
    console.error("SERVER ERROR:", error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
