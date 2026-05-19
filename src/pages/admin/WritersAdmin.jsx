import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function WritersAdmin() {
  const [writers, setWriters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ pen_name: '', bio: '', is_verified: false })

  useEffect(() => { loadWriters() }, [])

  async function loadWriters() {
    setLoading(true)
    const { data } = await supabase.from('writers').select('*').order('created_at', { ascending: false })
    setWriters(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.pen_name) return alert('กรุณาใส่นามปากกา')
    const { error } = await supabase.from('writers').insert([form])
    if (!error) {
      setShowForm(false)
      setForm({ pen_name: '', bio: '', is_verified: false })
      loadWriters()
    } else alert('เกิดข้อผิดพลาด: ' + error.message)
  }

  async function handleDelete(id) {
    if (!confirm('ลบนักเขียนนี้?')) return
    await supabase.from('writers').delete().eq('id', id)
    loadWriters()
  }

  async function toggleVerify(id, current) {
    await supabase.from('writers').update({ is_verified: !current }).eq('id', id)
    loadWriters()
  }

  const inputStyle = {
    background: '#111', border: '1px solid #333', color: '#fff',
    padding: '8px 12px', borderRadius: '8px', width: '100%'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#fff' }}>✍️ จัดการนักเขียน</h1>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: '#FFD700', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          + เพิ่มนักเขียน
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input placeholder="นามปากกา *" value={form.pen_name}
              onChange={e => setForm({ ...form, pen_name: e.target.value })} style={inputStyle} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={form.is_verified}
                onChange={e => setForm({ ...form, is_verified: e.target.checked })}
                style={{ width: '16px', height: '16px' }} />
              <label style={{ color: '#aaa', fontSize: '14px' }}>นักเขียนยืนยันแล้ว ✅</label>
            </div>
            <textarea placeholder="ประวัติย่อ" value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              style={{ ...inputStyle, gridColumn: '1/-1', minHeight: '80px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={handleSave}
              style={{ background: '#FFD700', color: '#000', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              บันทึก
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer' }}>
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {loading ? <p style={{ color: '#888' }}>กำลังโหลด...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              {['นามปากกา', 'ประวัติย่อ', 'นิยาย', 'สถานะ', 'จัดการ'].map(h => (
                <th key={h} style={{ padding: '10px', textAlign: 'left', color: '#888', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {writers.map(w => (
              <tr key={w.id} style={{ borderBottom: '1px solid #1e1e1e' }}>
                <td style={{ padding: '12px 10px', fontWeight: 500 }}>{w.pen_name}</td>
                <td style={{ padding: '12px 10px', color: '#aaa', maxWidth: '200px' }}>
                  {w.bio ? w.bio.slice(0, 50) + '...' : '-'}
                </td>
                <td style={{ padding: '12px 10px', color: '#aaa' }}>{w.total_novels}</td>
                <td style={{ padding: '12px 10px' }}>
                  <button onClick={() => toggleVerify(w.id, w.is_verified)}
                    style={{
                      background: w.is_verified ? '#064e3b' : '#1e1e1e',
                      color: w.is_verified ? '#34d399' : '#888',
                      border: '1px solid #333', padding: '2px 10px',
                      borderRadius: '20px', fontSize: '12px', cursor: 'pointer'
                    }}>
                    {w.is_verified ? '✅ ยืนยันแล้ว' : '⏳ รอยืนยัน'}
                  </button>
                </td>
                <td style={{ padding: '12px 10px' }}>
                  <button onClick={() => handleDelete(w.id)}
                    style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    ลบ
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
