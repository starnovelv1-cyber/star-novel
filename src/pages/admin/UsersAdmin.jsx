import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function UsersAdmin() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  async function addCoins(id, currentCoins) {
    const amount = prompt('เพิ่มเหรียญกี่เหรียญ?')
    if (!amount || isNaN(amount)) return
    await supabase.from('profiles').update({ coins: currentCoins + Number(amount) }).eq('id', id)
    await supabase.from('coin_transactions').insert([{
      user_id: id,
      amount: Number(amount),
      type: 'topup',
      description: 'Admin เพิ่มเหรียญ'
    }])
    loadUsers()
  }

  async function changeRole(id, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    if (!confirm(`เปลี่ยน role เป็น "${newRole}"?`)) return
    await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    loadUsers()
  }

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const roleColor = (role) => {
    if (role === 'admin') return { bg: '#4c1d95', color: '#c4b5fd' }
    if (role === 'writer') return { bg: '#1e3a5f', color: '#60a5fa' }
    return { bg: '#1e1e1e', color: '#888' }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#fff' }}>👥 จัดการผู้ใช้งาน</h1>
        <input
          placeholder="ค้นหา username / email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '8px 14px', borderRadius: '8px', width: '260px' }}
        />
      </div>

      {loading ? <p style={{ color: '#888' }}>กำลังโหลด...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              {['Username', 'Email', 'เหรียญ', 'Role', 'สมัครเมื่อ', 'จัดการ'].map(h => (
                <th key={h} style={{ padding: '10px', textAlign: 'left', color: '#888', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #1e1e1e' }}>
                <td style={{ padding: '12px 10px', fontWeight: 500 }}>{u.username || '-'}</td>
                <td style={{ padding: '12px 10px', color: '#aaa' }}>{u.email || '-'}</td>
                <td style={{ padding: '12px 10px', color: '#FFD700', fontWeight: 600 }}>
                  🪙 {u.coins || 0}
                </td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{
                    background: roleColor(u.role).bg,
                    color: roleColor(u.role).color,
                    padding: '2px 10px', borderRadius: '20px', fontSize: '12px'
                  }}>
                    {u.role || 'user'}
                  </span>
                </td>
                <td style={{ padding: '12px 10px', color: '#aaa', fontSize: '12px' }}>
                  {new Date(u.created_at).toLocaleDateString('th-TH')}
                </td>
                <td style={{ padding: '12px 10px', display: 'flex', gap: '6px' }}>
                  <button onClick={() => addCoins(u.id, u.coins || 0)}
                    style={{ background: '#064e3b', color: '#34d399', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    + เหรียญ
                  </button>
                  <button onClick={() => changeRole(u.id, u.role)}
                    style={{ background: '#1e3a5f', color: '#60a5fa', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    Role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
