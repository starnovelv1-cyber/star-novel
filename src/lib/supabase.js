import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ดึง role ของผู้ใช้ที่ login อยู่
export async function getUserRole() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return data?.role || 'beginner'
}

// เช็คว่าเป็น owner ไหม
export async function isOwner() {
  const role = await getUserRole()
  return role === 'owner'
}
