import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Upload } from 'tus-js-client'

export default function ChaptersAdmin() {
  const [chapters, setChapters] = useState([])
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedNovel, setSelectedNovel] = useState('')   // '' = ทุกนิยาย
  const [audioFile, setAudioFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [editId, setEditId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [openPlaylists, setOpenPlaylists] = useState({})   // novelId → true/false
  const [form, setForm] = useState({
    novel_id: '', chapter_number: '', title: '', content: '',
    audio_url: '', is_free: true, coin_price: 0
  })

  const dragItem = useRef(null)
  const dragOver = useRef(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [c, n] = await Promise.all([
        supabase.from('chapters')
          .select('*, novels(id, title)')
          .order('novel_id')
          .order('chapter_number'),
        supabase.from('novels').select('id, title').order('title'),
      ])
      setChapters(c.data || [])
      setNovels(n.data || [])
      // เปิด playlist แรกให้อัตโนมัติ
      if (n.data?.length > 0) {
        setOpenPlaylists({ [String(n.data[0].id)]: true })
      }
    } catch (err) {
      console.error('loadAll error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ✅ แก้หลัก: compare ด้วย String() ทั้งคู่
  function sameNovel(a, b) {
    return String(a) === String(b)
  }

  function togglePlaylist(novelId) {
    setOpenPlaylists(prev => ({ ...prev, [String(novelId)]: !prev[String(novelId)] }))
  }

  // จัดกลุ่มตอนตามนิยาย
  const grouped = novels
    .map(novel => ({
      novel,
      chapters: chapters
        .filter(ch => sameNovel(ch.novel_id, novel.id))
        .sort((a, b) => a.chapter_number - b.chapter_number),
    }))
    .filter(g => {
      if (!selectedNovel) return g.chapters.length > 0
      return sameNovel(g.novel.id, selectedNovel)
    })

  async function uploadAudio(novelId, chapterNumber) {
    if (!audioFile) return null
    setUploading(true)
    setUploadProgress(0)
    const SUPABASE_URL = 'https://lsjphxrlnqxasligrzae.supabase.co'
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    const ext = audioFile.name.split('.').pop().toLowerCase()
    const path = `novels/${novelId}/chapter_${chapterNumber}_${Date.now()}.${ext}`
    return new Promise((resolve) => {
      const upload = new Upload(audioFile, {
        endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000],
        headers: { authorization: `Bearer ${token}`, 'x-upsert': 'true' },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: 'audio', objectName: path,
          contentType: audioFile.type || 'audio/mpeg', cacheControl: '3600',
        },
        chunkSize: 6 * 1024 * 1024,
        onError: (err) => {
          alert('อัปโหลดเสียงล้มเหลว: ' + err.message)
          setUploading(false); setUploadProgress(0); resolve(null)
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          setUploadProgress(Math.round((bytesUploaded / bytesTotal) * 100))
        },
        onSuccess: () => {
          const { data: urlData } = supabase.storage.from('audio').getPublicUrl(path)
          setUploading(false); setUploadProgress(100); resolve(urlData.publicUrl)
        },
      })
      upload.findPreviousUploads().then((prev) => {
        if (prev.length) upload.resumeFromPreviousUpload(prev[0])
        upload.start()
      })
    })
  }

  function handleEdit(ch) {
    setEditId(ch.id)
    setForm({
      novel_id: ch.novel_id, chapter_number: ch.chapter_number,
      title: ch.title || '', content: ch.content || '',
      audio_url: ch.audio_url || '', is_free: ch.is_free ?? true,
      coin_price: ch.coin_price || 0,
    })
    setAudioFile(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditId(null); setAudioFile(null)
    setForm({ novel_id: '', chapter_number: '', title: '', content: '', audio_url: '', is_free: true, coin_price: 0 })
    setShowForm(false)
  }

  async function handleSave() {
    if (!form.novel_id || !form.chapter_number || !form.title)
      return alert('กรุณาใส่ข้อมูลให้ครบ (นิยาย / ตอนที่ / ชื่อตอน)')
    let audioUrl = form.audio_url
    if (audioFile) {
      const uploaded = await uploadAudio(form.novel_id, form.chapter_number)
      if (!uploaded) return
      audioUrl = uploaded
    }
    const payload = {
      novel_id: form.novel_id, chapter_number: Number(form.chapter_number),
      title: form.title, content: form.content, audio_url: audioUrl,
      is_free: form.is_free, coin_price: Number(form.coin_price),
    }
    const { error } = editId
      ? await supabase.from('chapters').update(payload).eq('id', editId)
      : await supabase.from('chapters').insert([payload])
    if (!error) { resetForm(); loadAll() }
    else alert('เกิดข้อผิดพลาด: ' + error.message)
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('chapters').delete().eq('id', id)
    if (error) alert('เกิดข้อผิดพลาดในการลบ: ' + error.message)
    else setChapters(prev => prev.filter(c => c.id !== id))
    setDeleteTarget(null)
  }

  // Drag & drop (ใช้ได้เฉพาะเมื่อกรองนิยายเดียว)
  function handleDragStart(index) { dragItem.current = index }
  function handleDragEnter(index) {
    if (!selectedNovel || dragItem.current === index) return
    dragOver.current = index
    const novelId = selectedNovel
    const others = chapters.filter(c => !sameNovel(c.novel_id, novelId))
    const novelChapters = [...chapters.filter(c => sameNovel(c.novel_id, novelId))]
    const dragged = novelChapters[dragItem.current]
    novelChapters.splice(dragItem.current, 1)
    novelChapters.splice(dragOver.current, 0, dragged)
    dragItem.current = dragOver.current
    setChapters([...others, ...novelChapters])
  }
  async function handleDragEnd(novelChapters) {
    await Promise.all(
      novelChapters.map((ch, i) =>
        supabase.from('chapters').update({ chapter_number: i + 1 }).eq('id', ch.id)
      )
    )
    dragItem.current = null; dragOver.current = null
    loadAll()
  }

  const inputStyle = {
    background: '#111', border: '1px solid #333', color: '#fff',
    padding: '8px 12px', borderRadius: '8px', width: '100%'
  }

  return (
    <div>
      {/* Custom Confirm Modal */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '24px 28px', maxWidth: '360px', width: '90%' }}>
            <p style={{ color: '#fff', fontWeight: 600, marginBottom: '8px' }}>ลบตอนนี้?</p>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ background: '#333', color: '#ccc', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer' }}>ยกเลิก</button>
              <button onClick={() => handleDelete(deleteTarget)} style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>🗑️ ลบ</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#fff' }}>🎙️ จัดการตอน / เสียง</h1>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          style={{ background: '#FFD700', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          + เพิ่มตอน
        </button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '1.5rem' }}>
        <select value={selectedNovel} onChange={e => setSelectedNovel(e.target.value)}
          style={{ ...inputStyle, width: '280px' }}>
          <option value="">📚 แสดงทุกนิยาย</option>
          {novels.map(n => <option key={n.id} value={String(n.id)}>{n.title}</option>)}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#1a1a1a', border: `1px solid ${editId ? '#3b82f6' : '#333'}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ color: editId ? '#60a5fa' : '#FFD700', marginBottom: '1rem', fontSize: '16px' }}>
            {editId ? '✏️ แก้ไขตอน' : '➕ เพิ่มตอนใหม่'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <select value={form.novel_id} onChange={e => setForm({ ...form, novel_id: e.target.value })}
              style={inputStyle} disabled={!!editId}>
              <option value="">เลือกนิยาย *</option>
              {novels.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
            </select>
            <input placeholder="ตอนที่ * เช่น 1" type="number" value={form.chapter_number}
              onChange={e => setForm({ ...form, chapter_number: e.target.value })} style={inputStyle} />
            <input placeholder="ชื่อตอน *" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              style={{ ...inputStyle, gridColumn: '1/-1' }} />
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                🎵 ไฟล์เสียง {editId && form.audio_url && <span style={{ color: '#34d399' }}>(มีไฟล์อยู่แล้ว)</span>}
              </label>
              <input type="file" accept="audio/*,video/mp4,video/x-matroska,video/avi,video/quicktime"
                onChange={e => setAudioFile(e.target.files[0] || null)}
                style={{ ...inputStyle, padding: '6px' }} />
              {audioFile && <p style={{ color: '#34d399', fontSize: '12px', marginTop: '4px' }}>✅ {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
              {editId && form.audio_url && !audioFile && (
                <p style={{ color: '#60a5fa', fontSize: '12px', marginTop: '4px' }}>🎵 ไฟล์เดิม: <a href={form.audio_url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>ฟัง</a></p>
              )}
              <input placeholder="หรือวาง URL เสียงโดยตรง" value={form.audio_url}
                onChange={e => setForm({ ...form, audio_url: e.target.value })}
                style={{ ...inputStyle, marginTop: '6px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={form.is_free}
                onChange={e => setForm({ ...form, is_free: e.target.checked })}
                style={{ width: '16px', height: '16px' }} />
              <label style={{ color: '#aaa', fontSize: '14px' }}>ตอนฟรี</label>
            </div>
            {!form.is_free && (
              <input placeholder="ราคาเหรียญ" type="number" value={form.coin_price}
                onChange={e => setForm({ ...form, coin_price: e.target.value })} style={inputStyle} />
            )}
            <textarea placeholder="เนื้อหาตอน (ถ้ามี)" value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              style={{ ...inputStyle, gridColumn: '1/-1', minHeight: '100px' }} />
          </div>

          {uploading && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '13px', marginBottom: '4px' }}>
                <span>⏫ กำลังอัปโหลด...</span><span>{uploadProgress}%</span>
              </div>
              <div style={{ background: '#333', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
                <div style={{ background: '#3b82f6', height: '100%', width: `${uploadProgress}%`, borderRadius: '8px', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={handleSave} disabled={uploading}
              style={{ background: uploading ? '#555' : editId ? '#3b82f6' : '#FFD700', color: uploading || editId ? '#fff' : '#000', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              {uploading ? '⏫ กำลังอัปโหลด...' : editId ? '💾 บันทึกการแก้ไข' : '💾 บันทึก'}
            </button>
            <button onClick={resetForm} style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer' }}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* ✅ Playlist Accordion */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#888', padding: '2rem' }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #444', borderTopColor: '#4fc3f7', animation: 'spin 0.8s linear infinite' }} />
          กำลังโหลด...
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : grouped.length === 0 ? (
        <p style={{ color: '#555', textAlign: 'center', padding: '3rem' }}>ไม่พบตอน</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {grouped.map(({ novel, chapters: novelChapters }) => {
            const isOpen = !!openPlaylists[String(novel.id)]
            const freeCount = novelChapters.filter(c => c.is_free).length
            const paidCount = novelChapters.length - freeCount
            const hasAudio = novelChapters.filter(c => c.audio_url).length

            return (
              <div key={novel.id} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Playlist Header */}
                <div
                  onClick={() => togglePlaylist(novel.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', cursor: 'pointer',
                    background: isOpen ? '#1a1a2e' : '#111',
                    transition: 'background 0.2s',
                    borderBottom: isOpen ? '1px solid #2a2a2a' : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1a1a2e'}
                  onMouseLeave={e => e.currentTarget.style.background = isOpen ? '#1a1a2e' : '#111'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{isOpen ? '📂' : '📁'}</span>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>{novel.title}</div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ background: '#1e3a5f', color: '#60a5fa', padding: '1px 8px', borderRadius: '20px', fontSize: '11px' }}>
                          📄 {novelChapters.length} ตอน
                        </span>
                        {hasAudio > 0 && (
                          <span style={{ background: '#1a2e1a', color: '#34d399', padding: '1px 8px', borderRadius: '20px', fontSize: '11px' }}>
                            🎵 {hasAudio} เสียง
                          </span>
                        )}
                        {freeCount > 0 && (
                          <span style={{ background: '#1a2e1a', color: '#34d399', padding: '1px 8px', borderRadius: '20px', fontSize: '11px' }}>
                            ฟรี {freeCount}
                          </span>
                        )}
                        {paidCount > 0 && (
                          <span style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700', padding: '1px 8px', borderRadius: '20px', fontSize: '11px' }}>
                            🪙 {paidCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setEditId(null)
                        setAudioFile(null)
                        setForm({ novel_id: String(novel.id), chapter_number: '', title: '', content: '', audio_url: '', is_free: true, coin_price: 0 })
                        setSelectedNovel(String(novel.id))
                        setShowForm(true)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      style={{ background: '#FFD700', color: '#000', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                    >+ ตอน</button>
                    <span style={{ color: '#555', fontSize: '18px', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                  </div>
                </div>

                {/* Chapter Rows */}
                {isOpen && (
                  <div>
                    {selectedNovel && sameNovel(selectedNovel, novel.id) && (
                      <div style={{ padding: '6px 18px', background: '#0d1117', fontSize: '12px', color: '#888' }}>
                        ☝️ ลากแถวเพื่อเรียงลำดับตอนใหม่ได้เลย
                      </div>
                    )}
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1e1e1e', background: '#0d1117' }}>
                          {['', 'ตอนที่', 'ชื่อตอน', 'เสียง', 'ราคา', 'จัดการ'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#555', fontWeight: 500, fontSize: '12px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {novelChapters.map((ch, index) => (
                          <tr
                            key={ch.id}
                            draggable={!!selectedNovel && sameNovel(selectedNovel, novel.id)}
                            onDragStart={() => handleDragStart(index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragEnd={() => handleDragEnd(novelChapters)}
                            onDragOver={e => e.preventDefault()}
                            style={{ borderBottom: '1px solid #1a1a1a', cursor: selectedNovel && sameNovel(selectedNovel, novel.id) ? 'grab' : 'default', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#151520'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '10px 8px', color: '#444', fontSize: '16px', userSelect: 'none', width: '24px' }}>
                              {selectedNovel && sameNovel(selectedNovel, novel.id) ? '⠿' : ''}
                            </td>
                            <td style={{ padding: '10px', color: '#FFD700', fontWeight: 700, width: '70px' }}>
                              {ch.chapter_number}
                            </td>
                            <td style={{ padding: '10px', fontWeight: 500, color: '#ddd' }}>{ch.title}</td>
                            <td style={{ padding: '10px', width: '70px' }}>
                              {ch.audio_url
                                ? <a href={ch.audio_url} target="_blank" rel="noreferrer" style={{ color: '#34d399', fontSize: '12px', textDecoration: 'none' }}>🎵 ฟัง</a>
                                : <span style={{ color: '#444', fontSize: '12px' }}>-</span>}
                            </td>
                            <td style={{ padding: '10px', width: '80px' }}>
                              {ch.is_free
                                ? <span style={{ color: '#34d399', fontSize: '12px' }}>ฟรี</span>
                                : <span style={{ color: '#FFD700', fontSize: '12px' }}>🪙 {ch.coin_price}</span>}
                            </td>
                            <td style={{ padding: '10px', width: '120px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => handleEdit(ch)}
                                  style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '3px 9px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
                                  ✏️
                                </button>
                                <button onClick={() => setDeleteTarget(ch.id)}
                                  style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '3px 9px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
