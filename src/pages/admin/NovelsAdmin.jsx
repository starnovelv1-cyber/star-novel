import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const inputStyle = {
  background: '#111', border: '1px solid #333', color: '#fff',
  padding: '8px 12px', borderRadius: '8px', width: '100%'
}

export default function NovelsAdmin() {
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [writers, setWriters] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedTags, setSelectedTags] = useState([]) // แท็กที่เลือก (array of category_id)
  const [form, setForm] = useState({
    title: '', description: '', category_id: '', writer_id: '',
    status: 'ongoing', cover_url: ''
  })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [n, c, w] = await Promise.all([
      supabase.from('novels').select('*, categories!novels_category_id_fkey(name), writers!novels_writer_id_fkey(pen_name)')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*'),
      supabase.from('writers').select('*'),
    ])
    setNovels(n.data || [])
    setCategories(c.data || [])
    setWriters(w.data || [])
    setLoading(false)
  }

  function handleCoverSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    const mb = file.size / 1024 / 1024
    if (mb > 5) {
      alert('❌ รูปใหญ่เกินไป (สูงสุด 5 MB)')
      e.target.value = ''
      return
    }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function uploadCover(novelId) {
    if (!coverFile) return null
    setUploading(true)
    setUploadProgress(0)

    const fake = setInterval(() => {
      setUploadProgress(p => p >= 90 ? 90 : p + Math.random() * 20)
    }, 200)

    const ext = coverFile.name.split('.').pop()
    const path = `novels/${novelId}/cover_${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('covers')
      .upload(path, coverFile, { upsert: true, contentType: coverFile.type })

    clearInterval(fake)

    if (error) {
      setUploading(false)
      setUploadProgress(0)
      alert('อัปโหลดรูปล้มเหลว: ' + error.message)
      return null
    }

    setUploadProgress(100)
    setTimeout(() => { setUploading(false); setUploadProgress(0) }, 600)

    const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path)
    return urlData.publicUrl
  }

  function toggleTag(categoryId) {
    setSelectedTags(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  async function loadNovelTags(novelId) {
    const { data } = await supabase
      .from('novel_tags')
      .select('category_id')
      .eq('novel_id', novelId)
    return (data || []).map(t => t.category_id)
  }

  async function handleEdit(novel) {
    setEditId(novel.id)
    setForm({
      title: novel.title || '',
      description: novel.description || '',
      category_id: novel.category_id || '',
      writer_id: novel.writer_id || '',
      status: novel.status || 'ongoing',
      cover_url: novel.cover_url || '',
    })
    setCoverFile(null)
    setCoverPreview(novel.cover_url || null)
    const tags = await loadNovelTags(novel.id)
    setSelectedTags(tags)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null)
    setCoverFile(null)
    setCoverPreview(null)
    setUploadProgress(0)
    setSelectedTags([])
    setForm({ title: '', description: '', category_id: '', writer_id: '', status: 'ongoing', cover_url: '' })
    setShowForm(false)
  }

  async function saveTags(novelId) {
    // ลบแท็กเก่าทั้งหมดก่อน แล้วใส่ใหม่
    await supabase.from('novel_tags').delete().eq('novel_id', novelId)
    if (selectedTags.length === 0) return
    await supabase.from('novel_tags').insert(
      selectedTags.map(category_id => ({ novel_id: novelId, category_id }))
    )
  }

  async function handleSave() {
    if (!form.title) return alert('กรุณาใส่ชื่อนิยาย')

    // แปลง string ว่างเป็น null ป้องกัน error integer type
    const cleanForm = {
      ...form,
      category_id: form.category_id || null,
      writer_id: form.writer_id || null,
    }

    let coverUrl = cleanForm.cover_url

    if (editId) {
      if (coverFile) {
        const uploaded = await uploadCover(editId)
        if (!uploaded) return
        coverUrl = uploaded
      }
      const { error } = await supabase.from('novels').update({
        ...cleanForm, cover_url: coverUrl
      }).eq('id', editId)
      if (error) return alert('เกิดข้อผิดพลาด: ' + error.message)
      await saveTags(editId)

    } else {
      const { data: inserted, error } = await supabase.from('novels')
        .insert([{ ...cleanForm, cover_url: '' }])
        .select().single()
      if (error) return alert('เกิดข้อผิดพลาด: ' + error.message)

      if (coverFile) {
        const uploaded = await uploadCover(inserted.id)
        if (uploaded) {
          await supabase.from('novels').update({ cover_url: uploaded }).eq('id', inserted.id)
        }
      }
      await saveTags(inserted.id)
    }

    resetForm()
    loadAll()
  }

  async function handleDelete(id) {
    if (!confirm('ลบนิยายนี้? (จะลบตอนทั้งหมดด้วย)')) return
    await supabase.from('novels').delete().eq('id', id)
    loadAll()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#fff' }}>📚 จัดการนิยาย</h1>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          style={{ background: '#FFD700', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          + เพิ่มนิยาย
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#1a1a1a', border: `1px solid ${editId ? '#3b82f6' : '#333'}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ color: editId ? '#60a5fa' : '#FFD700', marginBottom: '1rem', fontSize: '16px' }}>
            {editId ? '✏️ แก้ไขนิยาย' : '➕ เพิ่มนิยายใหม่'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '20px', alignItems: 'start' }}>

            {/* ซ้าย: รูปปก */}
            <div>
              <div style={{
                width: '100%', aspectRatio: '2/3',
                background: '#111', border: '2px dashed #333',
                borderRadius: '12px', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '8px', position: 'relative'
              }}>
                {coverPreview
                  ? <img src={coverPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#555', fontSize: '40px' }}>🖼️</span>
                }
              </div>

              <label style={{
                display: 'block', textAlign: 'center', padding: '8px',
                background: '#222', border: '1px solid #444', borderRadius: '8px',
                color: '#aaa', fontSize: '13px', cursor: 'pointer'
              }}>
                📷 เลือกรูปปก
                <input type="file" accept="image/*" onChange={handleCoverSelect} style={{ display: 'none' }} />
              </label>

              {coverFile && (
                <p style={{ color: '#34d399', fontSize: '11px', marginTop: '4px', textAlign: 'center' }}>
                  ✅ {coverFile.name}<br />({(coverFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}

              {uploading && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '3px' }}>
                    <span>กำลังอัปโหลด...</span>
                    <span style={{ color: '#FFD700' }}>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div style={{ background: '#333', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '99px',
                      width: `${uploadProgress}%`,
                      background: uploadProgress === 100 ? '#34d399' : 'linear-gradient(90deg, #FFD700, #f59e0b)',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              )}

              <input
                placeholder="หรือวาง URL รูปปก"
                value={form.cover_url}
                onChange={e => { setForm({ ...form, cover_url: e.target.value }); setCoverPreview(e.target.value) }}
                style={{ ...inputStyle, marginTop: '8px', fontSize: '12px' }}
              />
            </div>

            {/* ขวา: ข้อมูลนิยาย */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input placeholder="ชื่อนิยาย *" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ ...inputStyle, gridColumn: '1/-1' }} />

              <select value={form.writer_id} onChange={e => setForm({ ...form, writer_id: e.target.value })} style={inputStyle}>
                <option value="">เลือกนักเขียน</option>
                {writers.map(w => <option key={w.id} value={w.id}>{w.pen_name}</option>)}
              </select>

              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                <option value="ongoing">กำลังดำเนินเรื่อง</option>
                <option value="completed">จบแล้ว</option>
              </select>

              {/* Multi-tag selector */}
              <div style={{ gridColumn: '1/-1' }}>
                <p style={{ color: '#888', fontSize: '12px', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🏷️ แท็ก/หมวดหมู่ — เลือกได้หลายอัน
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {categories.map(c => {
                    const selected = selectedTags.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleTag(c.id)}
                        style={{
                          padding: '5px 12px', borderRadius: '99px', fontSize: '13px',
                          cursor: 'pointer', fontWeight: selected ? 600 : 400,
                          background: selected ? '#FFD700' : '#222',
                          color: selected ? '#000' : '#aaa',
                          border: selected ? '1px solid #FFD700' : '1px solid #444',
                          transition: 'all 0.15s'
                        }}
                      >
                        {selected ? '✓ ' : ''}{c.name}
                      </button>
                    )
                  })}
                </div>
                {selectedTags.length > 0 && (
                  <p style={{ color: '#FFD700', fontSize: '12px', marginTop: '8px' }}>
                    เลือกแล้ว {selectedTags.length} แท็ก
                  </p>
                )}
              </div>

              <textarea placeholder="คำอธิบายนิยาย" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ ...inputStyle, gridColumn: '1/-1', minHeight: '120px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={handleSave} disabled={uploading}
              style={{ background: uploading ? '#555' : editId ? '#3b82f6' : '#FFD700', color: uploading || editId ? '#fff' : '#000', border: 'none', padding: '8px 24px', borderRadius: '8px', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              {uploading ? `⏫ ${Math.round(uploadProgress)}%` : editId ? '💾 บันทึกการแก้ไข' : '💾 บันทึก'}
            </button>
            <button onClick={resetForm} disabled={uploading}
              style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer' }}>
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* ตาราง */}
      {loading ? <p style={{ color: '#888' }}>กำลังโหลด...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              {['ปก', 'ชื่อนิยาย', 'หมวดหมู่', 'นักเขียน', 'สถานะ', 'วิว', 'จัดการ'].map(h => (
                <th key={h} style={{ padding: '10px', textAlign: 'left', color: '#888', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {novels.map(novel => (
              <tr key={novel.id} style={{ borderBottom: '1px solid #1e1e1e' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1a1a2e'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '8px 10px' }}>
                  {novel.cover_url
                    ? <img src={novel.cover_url} alt={novel.title} style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '6px' }} />
                    : <div style={{ width: '40px', height: '56px', background: '#222', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📚</div>
                  }
                </td>
                <td style={{ padding: '12px 10px', fontWeight: 500 }}>{novel.title}</td>
                <td style={{ padding: '12px 10px', color: '#aaa' }}>{novel.categories?.name || '-'}</td>
                <td style={{ padding: '12px 10px', color: '#aaa' }}>{novel.writers?.pen_name || '-'}</td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{
                    background: novel.status === 'completed' ? '#064e3b' : '#1e3a5f',
                    color: novel.status === 'completed' ? '#34d399' : '#60a5fa',
                    padding: '2px 10px', borderRadius: '20px', fontSize: '12px'
                  }}>
                    {novel.status === 'completed' ? 'จบแล้ว' : 'ดำเนินเรื่อง'}
                  </span>
                </td>
                <td style={{ padding: '12px 10px', color: '#aaa' }}>{(novel.views || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 10px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleEdit(novel)}
                      style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      ✏️ แก้ไข
                    </button>
                    <button onClick={() => handleDelete(novel.id)}
                      style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}