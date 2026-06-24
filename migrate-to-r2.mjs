import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import fetch from 'node-fetch'

const SUPABASE_URL = 'https://lsjphxrlnqxasligrzae.supabase.co'
const SUPABASE_SERVICE_KEY = 'sb_secret_BrGkQU3FFdCojdbllW7AVQ_--4txqAS'
const R2_ACCOUNT_ID = 'f2fc439ae103dece7028455c9733db1d'
const R2_ACCESS_KEY_ID = 'e1c1d5fc3bd76d68b23b2dc7463e997d'
const R2_SECRET_ACCESS_KEY = '081460b8ca2dc3ddf6b2e4fa8f5f1e7350c1d0f3b10c4430b58200695b66de21'
const R2_BUCKET = 'star-novel-audio'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

async function migrate() {
  console.log('🚀 เริ่มย้ายไฟล์เสียง...\n')
  const { data: folders } = await supabase.storage.from('audio').list('novels', { limit: 1000 })
  let allFiles = []
  for (const folder of folders) {
    if (folder.id === null) {
      const { data: subFiles } = await supabase.storage.from('audio').list(`novels/${folder.name}`, { limit: 1000 })
      if (subFiles) subFiles.forEach(f => allFiles.push({ path: `novels/${folder.name}/${f.name}` }))
    }
  }
  console.log(`📁 พบไฟล์ ${allFiles.length} ไฟล์\n`)
  let success = 0, failed = 0
  for (const file of allFiles) {
    try {
      const { data: signedUrl } = await supabase.storage.from('audio').createSignedUrl(file.path, 60)
      const response = await fetch(signedUrl.signedUrl)
      const buffer = await response.arrayBuffer()
      await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: file.path, Body: Buffer.from(buffer), ContentType: 'audio/mpeg' }))
      success++
      console.log(`✅ [${success}/${allFiles.length}] ${file.path}`)
    } catch (err) {
      failed++
      console.error(`❌ ล้มเหลว: ${file.path}`, err.message)
    }
  }
  console.log(`\n🎉 เสร็จสิ้น! สำเร็จ ${success} / ล้มเหลว ${failed}`)
}
migrate()
