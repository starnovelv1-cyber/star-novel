import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import AudioPlayer from '../components/AudioPlayer'
import CoinIcon from '../components/CoinIcon'
import Comments from '../components/Comments'

export default function NovelPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [novel, setNovel] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [user, setUser] = useState(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [ratingLoading, setRatingLoading] = useState(false)
  const [chapterProgress, setChapterProgress] = useState({})
  const [unlockedChapters, setUnlockedChapters] = useState(new Set())
  const [userCoins, setUserCoins] = useState(0)
  const [unlockLoading, setUnlockLoading] = useState(null)
  const [unlockModal, setUnlockModal] = useState(null)
  const [novelTags, setNovelTags] = useState([]) // แท็กหลายอัน

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function fetchNovel() {
      const { data: novelData } = await supabase
        .from('novels')
        .select('*, writers(pen_name), categories!novels_category_id_fkey(name, icon, color)')
        .eq('id', id).single()
      const { data: chapterData } = await supabase
        .from('chapters').select('*').eq('novel_id', id).order('chapter_number')
      // ดึงแท็กหลายอันจาก novel_tags
      const { data: tagsData } = await supabase
        .from('novel_tags')
        .select('categories(id, name, icon, color)')
        .eq('novel_id', id)
      setNovelTags((tagsData || []).map(t => t.categories).filter(Boolean))

      setNovel(novelData)
      if (novelData) await supabase.rpc('increment_views', { novel_id: Number(id) })
      setChapters(chapterData || [])
      const savedChapterId = localStorage.getItem(`novel-current-chapter-${id}`)
      if (savedChapterId && chapterData) {
        const savedChapter = chapterData.find(ch => String(ch.id) === String(savedChapterId))
        if (savedChapter?.audio_url) { setSelectedChapter(savedChapter); setLoading(false); return }
      }
      const firstWithAudio = chapterData?.find(ch => ch.audio_url)
      if (firstWithAudio) setSelectedChapter(firstWithAudio)
      setLoading(false)
    }
    fetchNovel()
  }, [id])

  useEffect(() => {
    async function loadUserData() {
      if (!user?.id) return
      const { data: prof } = await supabase.from('profiles').select('coins').eq('id', user.id).maybeSingle()
      if (prof) setUserCoins(prof.coins || 0)
      const { data: unlocked } = await supabase.from('unlocked_chapters')
        .select('chapter_id').eq('user_id', user.id).eq('novel_id', Number(id))
      if (unlocked) setUnlockedChapters(new Set(unlocked.map(u => u.chapter_id)))
    }
    loadUserData()
  }, [user, id])

  useEffect(() => {
    async function loadAllProgress() {
      if (!chapters.length) return
      const progressMap = {}
      if (user?.id) {
        const { data } = await supabase.from('listen_history')
          .select('chapter_id, progress_seconds').eq('user_id', user.id).eq('novel_id', Number(id))
        if (data) data.forEach(row => { progressMap[row.chapter_id] = { progress_seconds: row.progress_seconds } })
      } else {
        chapters.forEach(ch => {
          const saved = localStorage.getItem(`audio-progress-${ch.id}`)
          if (saved) progressMap[ch.id] = { progress_seconds: Number(saved) }
        })
      }
      setChapterProgress(progressMap)
    }
    loadAllProgress()
  }, [chapters, user, id])

  const handleProgressUpdate = useCallback((chapterId, progressSeconds, durationSeconds) => {
    setChapterProgress(prev => ({ ...prev, [chapterId]: { progress_seconds: progressSeconds, duration: durationSeconds } }))
  }, [])

  useEffect(() => {
    async function checkBookmark() {
      if (!user?.id || !id) return
      const { data } = await supabase.from('bookmarks').select('id')
        .eq('user_id', user.id).eq('novel_id', id).maybeSingle()
      setIsBookmarked(!!data)
    }
    checkBookmark()
  }, [user, id])

  useEffect(() => {
    async function checkRating() {
      if (!user?.id || !id) return
      const { data } = await supabase.from('ratings').select('rating')
        .eq('user_id', user.id).eq('novel_id', id).maybeSingle()
      if (data) setUserRating(data.rating)
    }
    checkRating()
  }, [user, id])

  async function handleBookmark() {
    if (!user) { alert('กรุณาเข้าสู่ระบบก่อน'); return }
    setBookmarkLoading(true)
    try {
      if (isBookmarked) {
        const { error } = await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('novel_id', id)
        if (!error) setIsBookmarked(false)
      } else {
        const { error } = await supabase.from('bookmarks').insert({ user_id: user.id, novel_id: id })
        if (!error) setIsBookmarked(true)
      }
    } catch (err) { console.error('Bookmark error:', err) }
    setBookmarkLoading(false)
  }

  async function handleRating(star) {
    if (!user) { alert('กรุณาเข้าสู่ระบบก่อน'); return }
    setRatingLoading(true)
    try {
      const { error } = await supabase.from('ratings').upsert(
        { user_id: user.id, novel_id: Number(id), rating: star },
        { onConflict: 'user_id,novel_id' }
      )
      if (error) { console.error(error); setRatingLoading(false); return }
      setUserRating(star)
      await supabase.rpc('update_novel_rating', { novel_id: Number(id) })
      const { data: novelData } = await supabase.from('novels').select('rating, rating_count').eq('id', id).single()
      if (novelData) setNovel(prev => ({ ...prev, rating: novelData.rating, rating_count: novelData.rating_count }))
    } catch (err) { console.error('Rating error:', err) }
    setRatingLoading(false)
  }

  async function handleUnlock(ch) {
    if (!user) { alert('กรุณาเข้าสู่ระบบก่อน'); return }
    if (userCoins < ch.coin_price) { setUnlockModal({ ch, notEnough: true }); return }
    setUnlockModal({ ch, notEnough: false })
  }

  async function confirmUnlock() {
    const ch = unlockModal.ch
    setUnlockModal(null)
    setUnlockLoading(ch.id)
    try {
      const { data, error } = await supabase.rpc('unlock_chapter', {
        p_user_id: user.id, p_chapter_id: ch.id, p_novel_id: Number(id), p_coins: ch.coin_price
      })
      if (error || !data?.success) { alert(data?.message || 'เกิดข้อผิดพลาด'); return }
      setUnlockedChapters(prev => new Set([...prev, ch.id]))
      setUserCoins(prev => prev - ch.coin_price)
    } catch (err) { console.error('Unlock error:', err) }
    setUnlockLoading(null)
  }

  function handleSelectChapter(ch) {
    if (!ch?.audio_url) return
    const canAccess = ch.is_free || unlockedChapters.has(ch.id)
    if (!canAccess) return
    setSelectedChapter(ch)
    localStorage.setItem(`novel-current-chapter-${id}`, ch.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function formatTime(sec) {
    if (!sec || sec <= 0) return null
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (loading) return (<><Navbar /><div style={{ textAlign: 'center', paddingTop: '200px', color: '#888' }}><p>กำลังโหลด...</p></div></>)
  if (!novel) return (<><Navbar /><div style={{ textAlign: 'center', paddingTop: '200px', color: '#888' }}><h2>ไม่พบนิยายนี้</h2></div></>)

  // แสดงแท็ก: ถ้ามีใน novel_tags ใช้อันนั้น ถ้าไม่มีให้ fallback เป็น category เดิม
  const displayTags = novelTags.length > 0
    ? novelTags
    : novel.categories ? [novel.categories] : []

  return (
    <>
      <Navbar />
      <div className="novel-page">
        <div className="novel-page-cover">
          {novel.cover_url ? <img src={novel.cover_url} alt={novel.title} /> : (
            <div style={{
              width: '100%', aspectRatio: '2/3',
              background: `linear-gradient(135deg, ${novel.categories?.color || '#1a1a3e'}44, #0d0d2b)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '80px', borderRadius: '16px', border: '1px solid #1a1a3e'
            }}>{novel.categories?.icon || '📚'}</div>
          )}
        </div>

        <div className="novel-page-info">

          {/* แท็กหลายอัน */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {displayTags.map(tag => (
              <span key={tag.id} className="novel-genre" style={{ margin: 0 }}>
                {tag.icon ? `${tag.icon} ` : ''}{tag.name}
              </span>
            ))}
            {displayTags.length === 0 && (
              <span className="novel-genre">ไม่ระบุหมวดหมู่</span>
            )}
          </div>

          <h1>{novel.title}</h1>
          <p className="novel-author">✍️ โดย {novel.writers?.pen_name || 'ไม่ระบุนักเขียน'}</p>

          <div className="novel-page-stats">
            <div><strong>{chapters.length}</strong><span>ตอน</span></div>
            <div><strong>{(novel.views || 0).toLocaleString()}</strong><span>วิว</span></div>
            <div><strong>{novel.rating ? Number(novel.rating).toFixed(1) : '-'}</strong><span>⭐ คะแนน</span></div>
            {novel.rating_count > 0 && <div><strong>{novel.rating_count}</strong><span>โหวต</span></div>}
          </div>

          {user && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)',
              borderRadius: 20, padding: '4px 12px', marginTop: 8, cursor: 'pointer'
            }} onClick={() => navigate('/coins')}>
              <CoinIcon size={18} />
              <span style={{ color: '#FFD700', fontWeight: 700 }}>{userCoins}</span>
              <span style={{ color: '#888', fontSize: '0.8rem' }}>เหรียญ</span>
            </div>
          )}

          {/* โหวตดาว */}
          <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#888', fontSize: '14px' }}>โหวด:</span>
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star}
                onClick={() => !ratingLoading && handleRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  fontSize: '24px', cursor: ratingLoading ? 'not-allowed' : 'pointer',
                  color: star <= (hoverRating || userRating) ? '#FFD700' : '#444',
                  transition: 'color 0.15s'
                }}>★</span>
            ))}
            {userRating > 0 && <span style={{ color: '#888', fontSize: '13px' }}>(คุณให้ {userRating} ดาว)</span>}
          </div>

          {/* ปุ่มติดตาม */}
          <button onClick={handleBookmark} disabled={bookmarkLoading} style={{
            marginTop: '8px', padding: '10px 28px', borderRadius: '30px',
            border: isBookmarked ? '1px solid #4fc3f7' : '1px solid rgba(79,195,247,0.35)',
            background: isBookmarked ? 'rgba(79,195,247,0.15)' : 'transparent',
            color: isBookmarked ? '#4fc3f7' : '#888',
            cursor: bookmarkLoading ? 'not-allowed' : 'pointer',
            fontSize: '0.95rem', fontWeight: '600', transition: 'all 0.25s',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            {bookmarkLoading ? '⏳' : isBookmarked ? '✅ ติดตามแล้ว' : '➕ ติดตาม'}
          </button>

          <p className="novel-page-desc" style={{ marginTop: '20px' }}>
            {novel.description || 'ยังไม่มีคำอธิบาย'}
          </p>

          {selectedChapter?.audio_url && (
            <div style={{
              margin: '24px 0', padding: '12px 16px',
              background: 'rgba(79,195,247,0.06)', borderRadius: '10px',
              border: '1px solid rgba(79,195,247,0.15)',
            }}>
              <p style={{ color: '#4fc3f7', fontSize: '13px', margin: 0 }}>
                🎧 กำลังเล่น: ตอนที่ {selectedChapter.chapter_number} — {selectedChapter.title}
              </p>
            </div>
          )}

          {/* รายการตอน */}
          <div className="chapter-list">
            <h3>รายการตอน ({chapters.length} ตอน)</h3>
            {chapters.length === 0 ? <p style={{ color: '#888' }}>ยังไม่มีตอน</p> : (
              chapters.map((ch) => {
                const p = chapterProgress[ch.id]
                const hasDuration = p?.duration > 0
                const percent = hasDuration ? Math.min(100, Math.round((p.progress_seconds / p.duration) * 100)) : 0
                const listened = p?.progress_seconds > 5
                const remaining = hasDuration ? Math.max(0, Math.floor(p.duration - p.progress_seconds)) : null
                const isFinished = percent >= 98
                const canAccess = ch.is_free || unlockedChapters.has(ch.id)
                const isLocked = !ch.is_free && !unlockedChapters.has(ch.id)

                return (
                  <div key={ch.id}
                    className={`chapter-item ${selectedChapter?.id === ch.id ? 'chapter-item--active' : ''}`}
                    onClick={() => canAccess ? handleSelectChapter(ch) : null}
                    style={{ cursor: canAccess && ch.audio_url ? 'pointer' : 'default', opacity: isLocked ? 0.75 : 1 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        {isLocked && <span style={{ fontSize: '14px' }}>🔒</span>}
                        <span className="chapter-num">ตอนที่ {ch.chapter_number}</span>
                        <span className="chapter-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ch.title || `บทที่ ${ch.chapter_number}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                        <span className="chapter-date">
                          {ch.is_free ? '🆓 ฟรี' : unlockedChapters.has(ch.id) ? '✅ ปลดล็อคแล้ว' : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <CoinIcon size={13} /> {ch.coin_price}
                            </span>
                          )}
                          {ch.audio_url && canAccess ? ' 🎵' : ''}
                        </span>
                        {isLocked && ch.audio_url && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUnlock(ch) }}
                            disabled={unlockLoading === ch.id}
                            style={{
                              padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem',
                              border: '1px solid rgba(255,215,0,0.4)',
                              background: 'rgba(255,215,0,0.1)', color: '#FFD700',
                              cursor: unlockLoading === ch.id ? 'not-allowed' : 'pointer',
                              fontWeight: 600, whiteSpace: 'nowrap'
                            }}>
                            {unlockLoading === ch.id ? '⏳' : 'ปลดล็อค'}
                          </button>
                        )}
                      </div>
                    </div>

                    {ch.audio_url && canAccess && listened && (
                      <div style={{ width: '100%', marginTop: 6 }}>
                        <div style={{ width: '100%', height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{
                            width: `${percent}%`, height: '100%', borderRadius: 99,
                            background: isFinished ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #38bdf8, #2563eb)',
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: '0.68rem', color: '#64748b' }}>
                          {isFinished ? (
                            <span style={{ color: '#22c55e' }}>✅ ฟังจบแล้ว</span>
                          ) : (
                            <span style={{ color: '#4fc3f7' }}>
                              ▶ ฟังไปแล้ว {percent}%
                              {formatTime(p.progress_seconds) && ` (${formatTime(p.progress_seconds)})`}
                            </span>
                          )}
                          {!isFinished && remaining !== null && <span>เหลืออีก {formatTime(remaining)}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {selectedChapter && (
            <Comments
              novelId={Number(id)}
              chapterId={selectedChapter.chapter_number}
              user={user}
            />
          )}

        </div>
      </div>

      {selectedChapter?.audio_url && (
        <AudioPlayer
          audioUrl={selectedChapter.audio_url}
          chapter={selectedChapter}
          novelId={id}
          novel={novel}
          chapters={chapters.filter(ch => ch.audio_url && (ch.is_free || unlockedChapters.has(ch.id)))}
          onChapterChange={handleSelectChapter}
          user={user}
          onProgressUpdate={handleProgressUpdate}
        />
      )}

      {/* Popup ยืนยันซื้อ */}
      {unlockModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: '#1a1a2e', border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: '16px', padding: '2rem', maxWidth: '360px', width: '100%', textAlign: 'center'
          }}>
            {unlockModal.notEnough ? (
              <>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>😔</div>
                <h3 style={{ color: '#fff', marginBottom: '8px' }}>เหรียญไม่พอ</h3>
                <p style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>
                  คุณมี <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#FFD700', fontWeight: 700 }}>
                    <CoinIcon size={14} /> {userCoins}
                  </span> เหรียญ
                </p>
                <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>
                  ต้องการ <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#FFD700', fontWeight: 700 }}>
                    <CoinIcon size={14} /> {unlockModal.ch.coin_price}
                  </span> เหรียญ
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={() => { setUnlockModal(null); navigate('/coins') }}
                    style={{ padding: '10px 24px', borderRadius: '30px', border: 'none',
                      background: 'linear-gradient(135deg, #FFD700, #f59e0b)', color: '#000', fontWeight: 700, cursor: 'pointer' }}>
                    เติมเหรียญ
                  </button>
                  <button onClick={() => setUnlockModal(null)}
                    style={{ padding: '10px 24px', borderRadius: '30px', border: '1px solid #333',
                      background: 'transparent', color: '#888', cursor: 'pointer' }}>
                    ยกเลิก
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔓</div>
                <h3 style={{ color: '#fff', marginBottom: '8px' }}>ยืนยันการปลดล็อค</h3>
                <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '4px' }}>
                  ตอนที่ {unlockModal.ch.chapter_number} — {unlockModal.ch.title}
                </p>
                <p style={{ color: '#888', fontSize: '14px', marginBottom: '4px' }}>
                  ราคา <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#FFD700', fontWeight: 700 }}>
                    <CoinIcon size={14} /> {unlockModal.ch.coin_price}
                  </span> เหรียญ
                </p>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
                  คงเหลือหลังซื้อ <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#4fc3f7', fontWeight: 700 }}>
                    <CoinIcon size={14} /> {userCoins - unlockModal.ch.coin_price}
                  </span> เหรียญ
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={confirmUnlock}
                    style={{ padding: '10px 24px', borderRadius: '30px', border: 'none',
                      background: 'linear-gradient(135deg, #FFD700, #f59e0b)', color: '#000', fontWeight: 700, cursor: 'pointer' }}>
                    ✅ ยืนยัน
                  </button>
                  <button onClick={() => setUnlockModal(null)}
                    style={{ padding: '10px 24px', borderRadius: '30px', border: '1px solid #333',
                      background: 'transparent', color: '#888', cursor: 'pointer' }}>
                    ยกเลิก
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
