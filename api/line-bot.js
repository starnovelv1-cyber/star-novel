// api/line-bot.js
import crypto from 'crypto';

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ความรู้เกี่ยวกับ Star Novel สำหรับ AI
const SYSTEM_PROMPT = `คุณคือผู้ช่วย Support ของ Star Novel เว็บนิยายเสียงภาษาไทย
คุณต้องวิเคราะห์ปัญหาและตอบเป็นภาษาไทยสั้นๆ กระชับ

ปัญหาที่พบบ่อยและวิธีแก้:
1. "เหรียญไม่เข้า / จ่ายแล้วเหรียญไม่ได้" → ให้ออกจากระบบแล้ว Login ใหม่ รอ 2-3 นาที ระบบจะอัปเดตเหรียญอัตโนมัติ ถ้ายังไม่เข้าให้แจ้ง TXN ID มาที่นี่
2. "Login ไม่ได้ / เข้าระบบไม่ได้" → ลองกด Logout แล้ว Login ใหม่, ลองล้าง Cache, ลอง Browser อื่น ถ้าลืมรหัสผ่านกด "ลืมรหัสผ่าน" ในหน้า Login
3. "ปลดล็อคตอนแล้วฟังไม่ได้" → Refresh หน้า, ออก-เข้าระบบใหม่
4. "เสียงไม่มี / เล่นไม่ได้" → เช็คเสียงโทรศัพท์, ลอง Browser อื่น, ลอง WiFi/Data สลับกัน
5. "หมวดหมู่ใช้งานไม่ได้" → Refresh หน้า หรือเข้าใหม่

ถ้าปัญหาซับซ้อนหรือแก้ตามนี้ไม่ได้ ให้บอกว่า "จะแจ้งทีมงานให้ตรวจสอบให้นะคะ 🙏 รบกวนบอก Email ที่ใช้สมัครและเวลาที่เกิดปัญหาด้วยนะคะ"

ตอบสั้นๆ ไม่เกิน 5 บรรทัด ใช้ emoji พอดี อย่าเยิ่นเย้อ`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Verify Line Signature
  const signature = req.headers['x-line-signature'];
  const body = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', LINE_CHANNEL_SECRET)
    .update(body)
    .digest('base64');
  
  if (hash !== signature) return res.status(401).end();

  const events = req.body.events || [];
  
  for (const event of events) {
    if (event.type !== 'message' || event.message.type !== 'text') continue;
    
    const userMessage = event.message.text;
    const replyToken = event.replyToken;
    
    // ส่งไป Claude วิเคราะห์
    const aiResponse = await callClaude(userMessage);
    
    // ตอบกลับใน Line
    await replyLine(replyToken, aiResponse);
  }

  res.status(200).json({ status: 'ok' });
}

async function callClaude(userMessage) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // เร็ว + ถูก เหมาะกับ support
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    
    const data = await response.json();
    return data.content?.[0]?.text || 'ขออภัยค่ะ ระบบขัดข้องชั่วคราว 🙏';
  } catch (err) {
    return 'ขออภัยค่ะ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง 🙏';
  }
}

async function replyLine(replyToken, message) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text: message }],
    }),
  });
}
