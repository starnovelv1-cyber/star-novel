import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://lsjphxrlnqxasligrzae.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
)

async function deleteAll() {
  console.log('🗑️ เริ่มลบไฟล์เสียงจาก Supabase...\n')
  const { data: folders } = await supabase.storage.from('audio').list('novels', { limit: 1000 })
  for (const folder of folders) {
    if (folder.id === null) {
      const { data: files } = await supabase.storage.from('audio').list(`novels/${folder.name}`, { limit: 1000 })
      if (files && files.length > 0) {
        const paths = files.map(f => `novels/${folder.name}/${f.name}`)
        await supabase.storage.from('audio').remove(paths)
        console.log(`✅ ลบ novels/${folder.name} แล้ว (${paths.length} ไฟล์)`)
      }
    }
  }
  console.log('\n🎉 เสร็จสิ้น!')
}

deleteAll()