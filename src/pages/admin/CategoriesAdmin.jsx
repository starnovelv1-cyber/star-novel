import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', slug: '', icon: '', color: '#7C3AED' })

  useEffect(() => { loadCategories() }, [])

  async function loadCategories() {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('id')
    setCategories(data || [])
    setLoading(false)
  }

  function handleEdit(cat) {
    setEditId(cat.id)
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon || '', color: cat.color || '#7C3AED' })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setForm({ name: '', slug: '', icon: '', color: '#7C3AED' })
    setShowForm(false)
  }

  async function handleSave() {
    if (!form.name || !form.slug) return alert('กรุณาใส่ชื่อและ slug')
    let error
    if (editId) {
      ;({ error } = await supabase.from('categories').update(form).eq('id', editId))
    } else {
      ;({ error } = await supabase.from('categories').insert([form]))
    }
    if (!error) { resetForm(); loadCategories() }
    else alert('เกิดข้อผิดพลาด: ' + error.message)
  }

  async function handleDelete(id) {
    if (!confirm('ลบหมวดหมู่นี้?')) return
    await supabase.from('categories').delete().eq('id', id)
    loadCategories()
  }

  const inputStyle = {
    background: '#111', border: '1px solid #333', color: '#fff',
    padding: '8px 12px', borderRadius: '8px', width: '100%'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#fff' }}>🏷️ จัดการหมวดหมู่</h1>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          style={{ background: '#FFD700', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          + เพิ่มหมวดหมู่
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#1a1a1a', border: `1px solid ${editId ? '#3b82f6' : '#333'}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ color: editId ? '#60a5fa' : '#FFD700', marginBottom: '1rem', fontSize: '16px' }}>
            {editId ? '✏️ แก้ไขหมวดหมู่' : '➕ เพิ่มหมวดหมู่ใหม่'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input placeholder="ชื่อหมวดหมู่ * เช่น แฟนตาซี" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
            <input placeholder="slug * เช่น fantasy" value={form.slug}
              onChange={e => setForm({ ...form, slug: e.target.value })} style={inputStyle} />
            <input placeholder="icon เช่น 🐉" value={form.icon}
              onChange={e => setForm({ ...form, icon: e.target.value })} style={inputStyle} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ color: '#aaa', fontSize: '14px' }}>สี:</label>
              <input type="color" value={form.color}
                onChange={e => setForm({ ...form, color: e.target.value })}
                style={{ width: '48px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
              <span style={{ color: '#aaa', fontSize: '13px' }}>{form.color}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={handleSave}
              style={{ background: editId ? '#3b82f6' : '#FFD700', color: editId ? '#fff' : '#000', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              {editId ? '💾 บันทึกการแก้ไข' : '💾 บันทึก'}
            </button>
            <button onClick={resetForm}
              style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer' }}>
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {loading ? <p style={{ color: '#888' }}>กำลังโหลด...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {categories.map(cat => (
            <div key={cat.id} style={{
              background: '#1a1a1a', border: `1px solid ${cat.color || '#333'}44`,
              borderRadius: '12px', padding: '1rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
            }}>
              <div>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>{cat.icon}</div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{cat.name}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>{cat.slug}</div>
                <div style={{ color: cat.color, fontSize: '12px', marginTop: '4px' }}>📚 {cat.novel_count || 0} เรื่อง</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button onClick={() => handleEdit(cat)}
                  style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  ✏️
                </button>
                <button onClick={() => handleDelete(cat.id)}
                  style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
