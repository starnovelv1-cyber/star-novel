import { useState, useEffect } from 'react'
import { useDuplicateCheck } from '../../hooks/useDuplicateCheck'

const STORAGE_KEY = 'duplicate_check_history'

export default function DuplicateCheckAdmin() {
  const [title, setTitle] = useState('')
  const [sourceLink, setSourceLink] = useState('')
  const [translatorName, setTranslatorName] = useState('')
  const [notes, setNotes] = useState('')
  const [history, setHistory] = useState([])
  const { checkDuplicate, results, loading, error, reset } = useDuplicateCheck()

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
  }, [])

  const saveHistory = (newEntry) => {
    const updated = [newEntry, ...history].slice(0, 100)
    setHistory(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  }

  const handleCheck = async () => {
    const res = await checkDuplicate({ title, sourceLink, translatorName })
    if (!res) return
    const status =
      res.type === 'danger' ? 'danger'
      : res.type === 'warning' ? 'warning'
      : res.type === 'clear' ? 'clear'
      : null
    if (status) {
      saveHistory({
        id: Date.now(),
        title,
        translatorName,
        sourceLink,
        notes,
        status,
        checkedAt: new Date().toISOString()
      })
    }
  }

  const handleClear = () => {
    setTitle('')
    setSourceLink('')
    setTranslatorName('')
    setNotes('')
    reset()
  }

  const deleteEntry = (id) => {
    const updated = history.filter(h => h.id !== id)
    setHistory(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  }

  const clearAllHistory = () => {
    if (!window.confirm('ลบประวัติทั้งหมดใช่ไหม?')) return
    setHistory([])
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const inp = {
    width: '100%', padding: '8px 12px',
    background: '#111', border: '1px solid #333',
    borderRadius: '8px', color: '#fff',
    fontSize: '0.9rem', boxSizing: 'border-box'
  }

  const lbl = {
    display: 'block', fontSize: '0.75rem', fontWeight: 600,
    color: '#888', marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '0.04em'
  }

  const statusConfig = {
    danger:  { label: '🔴 ซ้ำ 100%',  color: '#ff6b6b', bg: '#2d0d0d', border: '#ff4444' },
    warning: { label: '🟡 ใกล้เคียง', color: '#FFD700', bg: '#2d1f00', border: '#FFD700' },
    clear:   { label: '✅ ไม่พบซ้ำ',  color: '#4ade80', bg: '#0d2d1a', border: '#2d7a4a' },
  }

  return (
    <div style={{ maxWidth: '860px' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 600, margin: '0 0 4px' }}>
          🛡️ ระบบป้องกันงานซ้ำ
        </h1>
        <p style={{ color: '#888', fontSize: '0.9rem', margin: '0 0 8px' }}>
          ตรวจสอบชื่อเรื่อง ลิงก์ต้นฉบับ และนักแปลก่อนเริ่มแปล ว่าซ้ำกับคนอื่นไหม
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.2)',
          borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', color: '#4fc3f7'
        }}>
          ℹ️ หน้านี้ใช้ตรวจสอบเท่านั้น — ไม่มีการบันทึกข้อมูลลงระบบ
        </div>
      </div>

      {/* Form */}
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={lbl}>ชื่อเรื่อง</label>
            <input type="text" value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCheck()}
              placeholder="เช่น ราชันย์มังกรดำ" style={inp} />
          </div>
          <div>
            <label style={lbl}>ชื่อนักแปล</label>
            <input type="text" value={translatorName}
              onChange={e => setTranslatorName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCheck()}
              placeholder="เช่น SkyDragon" style={inp} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={lbl}>ลิงก์ต้นฉบับ</label>
            <input type="url" value={sourceLink}
              onChange={e => setSourceLink(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCheck()}
              placeholder="https://www.jjwxc.net/onebook.php?novelid=1234" style={inp} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleCheck}
            disabled={loading || (!title && !sourceLink && !translatorName)}
            style={{
              background: '#FFD700', color: '#000', border: 'none',
              borderRadius: '8px', padding: '9px 20px',
              fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
              opacity: (loading || (!title && !sourceLink && !translatorName)) ? 0.5 : 1
            }}>
            {loading ? '⏳ กำลังตรวจสอบ...' : '🔍 ตรวจสอบ'}
          </button>
          <button onClick={handleClear}
            style={{
              background: 'transparent', color: '#aaa',
              border: '1px solid #333', borderRadius: '8px',
              padding: '9px 16px', fontSize: '0.9rem', cursor: 'pointer'
            }}>
            ล้างค่า
          </button>
        </div>
      </div>

      {/* Notes */}
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span>📝</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            บันทึก / หมายเหตุ
          </span>
          <span style={{
            marginLeft: '6px', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '99px',
            background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', color: '#FFD700'
          }}>
            จะถูกบันทึกพร้อมผลตรวจ
          </span>
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="จดบันทึกสำหรับการตรวจสอบครั้งนี้ เช่น เหตุผลที่ตรวจ, ข้อสังเกต, ผลสรุป..."
          rows={3}
          style={{ ...inp, resize: 'vertical', lineHeight: '1.6', fontFamily: 'inherit', minHeight: '72px' }}
        />
        {notes && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button onClick={() => setNotes('')}
              style={{ background: 'transparent', color: '#666', border: 'none', fontSize: '0.78rem', cursor: 'pointer', padding: '2px 0' }}>
              ล้างบันทึก ✕
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#2d1a1a', border: '1px solid #ff4444', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1rem', color: '#ff6b6b' }}>
          ❌ เกิดข้อผิดพลาด: {error}
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div style={{ marginBottom: '1.5rem' }}>
          {results.type === 'empty' && (
            <div style={{ background: '#1a1a1a', border: '1px solid #444', borderRadius: '10px', padding: '1rem 1.25rem', color: '#aaa' }}>
              ⚠️ กรุณากรอกข้อมูลอย่างน้อย 1 ช่อง
            </div>
          )}

          {results.type === 'clear' && (
            <div style={{ background: '#0d2d1a', border: '1px solid #2d7a4a', borderRadius: '10px', padding: '1rem 1.25rem', color: '#4ade80' }}>
              ✅ <strong>ไม่พบงานซ้ำ</strong> — ตรวจสอบแล้ว {results.checkedCount} รายการ ไม่มีชื่อเรื่อง ลิงก์ หรือนักแปลที่ตรงหรือใกล้เคียง
            </div>
          )}

          {(results.type === 'danger' || results.type === 'warning') && (
            <>
              <div style={{
                background: results.type === 'danger' ? '#2d0d0d' : '#2d1f00',
                border: `1px solid ${results.type === 'danger' ? '#ff4444' : '#FFD700'}`,
                borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1rem',
                color: results.type === 'danger' ? '#ff6b6b' : '#FFD700'
              }}>
                {results.type === 'danger' ? '🚨' : '⚠️'}{' '}
                <strong>{results.type === 'danger' ? 'พบงานซ้ำทุกประการ!' : 'พบข้อมูลที่คล้ายกัน'}</strong>
                {' '}ตรวจพบ {results.matches.length} รายการจากทั้งหมด {results.checkedCount} รายการในระบบ
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {results.matches.map(({ novel, flags, isExact }) => (
                  <div key={novel.id} style={{
                    background: '#1a1a1a',
                    border: `1.5px solid ${isExact ? '#ff4444' : '#FFD700'}`,
                    borderRadius: '10px', padding: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: '99px',
                        background: isExact ? '#3d0000' : '#2d1f00',
                        color: isExact ? '#ff6b6b' : '#FFD700'
                      }}>
                        {isExact ? '🔴 ซ้ำ 100%' : '🟡 ใกล้เคียง'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: 'auto' }}>
                        ความเหมือน {Math.round(Math.max(...flags.map(f => f.score)) * 100)}%
                      </span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{novel.title}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.82rem', color: '#888', marginBottom: '10px' }}>
                      {novel.translator_name && <span>👤 {novel.translator_name}</span>}
                      {novel.source_link && (
                        <a href={novel.source_link} target="_blank" rel="noopener noreferrer" style={{ color: '#FFD700', textDecoration: 'none' }}>
                          🔗 ดูต้นฉบับ
                        </a>
                      )}
                      <span>📅 {new Date(novel.created_at).toLocaleDateString('th-TH')}</span>
                      <span style={{
                        fontSize: '0.75rem', padding: '2px 8px', borderRadius: '99px',
                        background: novel.status === 'ongoing' ? '#1e3a5f' : novel.status === 'completed' ? '#1a3a2a' : '#2a2a2a',
                        color: novel.status === 'ongoing' ? '#60a5fa' : novel.status === 'completed' ? '#4ade80' : '#aaa'
                      }}>
                        {novel.status === 'ongoing' ? 'กำลังแปล' : novel.status === 'completed' ? 'จบแล้ว' : novel.status}
                      </span>
                    </div>
                    <div style={{ background: '#111', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
                      {flags.map((flag, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', marginBottom: i < flags.length - 1 ? '6px' : 0 }}>
                          <span style={{ color: flag.type === 'exact' ? '#ff6b6b' : '#FFD700', fontWeight: 600, flexShrink: 0 }}>
                            {flag.type === 'exact' ? '🔴' : '🟡'} {flag.field}:
                          </span>
                          <span style={{ color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{flag.existing}</span>
                          <span style={{ color: '#555', flexShrink: 0, marginLeft: 'auto' }}>{Math.round(flag.score * 100)}%</span>
                        </div>
                      ))}
                    </div>
                    <a href="/admin/novels" style={{ fontSize: '0.82rem', color: '#FFD700', textDecoration: 'none', fontWeight: 500 }}>
                      ดูนิยายนี้ในระบบ →
                    </a>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* History Table */}
      {history.length > 0 && (
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🕓</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ประวัติการตรวจสอบ
              </span>
              <span style={{
                fontSize: '0.72rem', padding: '2px 8px', borderRadius: '99px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#666'
              }}>
                {history.length} รายการ
              </span>
            </div>
            <button onClick={clearAllHistory}
              style={{ background: 'transparent', color: '#555', border: '1px solid #333', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer' }}>
              ล้างทั้งหมด
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                  {['ผล', 'ชื่อเรื่อง', 'นักแปล', 'หมายเหตุ', 'วันที่', ''].map((h, i) => (
                    <th key={i} style={{ padding: '8px 10px', color: '#555', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => {
                  const cfg = statusConfig[entry.status] || statusConfig.clear
                  return (
                    <tr key={entry.id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 600, padding: '3px 8px', borderRadius: '99px',
                          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                          whiteSpace: 'nowrap'
                        }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', color: '#ddd', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.title || <span style={{ color: '#444' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#aaa', whiteSpace: 'nowrap' }}>
                        {entry.translatorName || <span style={{ color: '#444' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#666', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.notes || <span style={{ color: '#333' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#555', whiteSpace: 'nowrap' }}>
                        {new Date(entry.checkedAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        <button onClick={() => deleteEntry(entry.id)}
                          style={{ background: 'transparent', color: '#444', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
