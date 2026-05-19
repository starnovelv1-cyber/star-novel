import { useEffect, useRef, useState, useCallback } from "react"
import { supabase } from "../lib/supabase"

export default function AudioPlayer({ audioUrl: src, chapter, novelId, novel, chapters = [], onChapterChange, onProgressUpdate }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(() => Number(localStorage.getItem('player-speed')) || 1)
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('player-volume')) || 1)
  const [sleepTimer, setSleepTimer] = useState(null)
  const [sleepRemaining, setSleepRemaining] = useState(0)
  const [showSleepMenu, setShowSleepMenu] = useState(false)
  const [showExtra, setShowExtra] = useState(false)
  const [autoNext, setAutoNext] = useState(() => localStorage.getItem('player-auto-next') !== 'false')
  const [isMobile, setIsMobile] = useState(false)

  const hasSavedHistory = useRef(false)
  const lastSaveTime = useRef(0)
  const sleepIntervalRef = useRef(null)
  const resumeApplied = useRef(false)
  const playingRef = useRef(false)

  const chaptersWithAudio = chapters.filter(ch => ch.audio_url)
  const currentIndex = chaptersWithAudio.findIndex(ch => ch.id === chapter?.id)
  const prevChapter = currentIndex > 0 ? chaptersWithAudio[currentIndex - 1] : null
  const nextChapter = currentIndex < chaptersWithAudio.length - 1 ? chaptersWithAudio[currentIndex + 1] : null

  const chapterIdRef = useRef(chapter?.id)
  const novelIdRef = useRef(novelId)
  const onProgressUpdateRef = useRef(onProgressUpdate)
  const autoNextRef = useRef(autoNext)
  const nextChapterRef = useRef(nextChapter)

  useEffect(() => { chapterIdRef.current = chapter?.id }, [chapter?.id])
  useEffect(() => { novelIdRef.current = novelId }, [novelId])
  useEffect(() => { onProgressUpdateRef.current = onProgressUpdate }, [onProgressUpdate])
  useEffect(() => { autoNextRef.current = autoNext }, [autoNext])
  useEffect(() => { nextChapterRef.current = nextChapter }, [nextChapter])
  useEffect(() => { playingRef.current = playing }, [playing])

  // ✅ ตรวจจอมือถือ — รองรับทั้ง portrait และ landscape
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      // mobile = จอแคบ หรือ landscape ที่สูงน้อย (มือถือหมุนข้าง)
      setIsMobile(w < 768 || (h < 500 && w < 1024))
    }
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  const saveListenHistory = useCallback(async (currentSecs) => {
    const cid = chapterIdRef.current
    const nid = novelIdRef.current
    if (!cid) return
    const secs = currentSecs ?? audioRef.current?.currentTime ?? 0
    if (secs < 1) return
    localStorage.setItem(`audio-progress-${cid}`, secs)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    if (nid) {
      await supabase.from('listen_history').upsert({
        user_id: session.user.id, novel_id: Number(nid),
        chapter_id: Number(cid), progress_seconds: Math.floor(secs),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,chapter_id' })
    }
  }, [])

  useEffect(() => {
    if (!audioRef.current || !src) return
    const audio = audioRef.current
    const wasPlaying = playingRef.current
    audio.pause()
    audio.src = src
    audio.volume = volume
    audio.playbackRate = speed
    setProgress(0); setCurrentTime(0); setDuration(0)
    hasSavedHistory.current = false
    lastSaveTime.current = 0
    resumeApplied.current = false

    const onMeta = async () => {
    const cid = chapterIdRef.current
    audio.volume = volume
    audio.playbackRate = speed
    let resumeTime = 0
    try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && cid) {
          const { data } = await supabase.from('listen_history').select('progress_seconds')
            .eq('user_id', session.user.id).eq('chapter_id', Number(cid)).maybeSingle()
          if (data?.progress_seconds > 5) resumeTime = data.progress_seconds
          else {
            const saved = localStorage.getItem(`audio-progress-${cid}`)
            if (saved && Number(saved) > 5) resumeTime = Number(saved)
          }
        } else {
          const saved = localStorage.getItem(`audio-progress-${cid}`)
          if (saved && Number(saved) > 5) resumeTime = Number(saved)
        }
      } catch (err) { console.error('resume fetch error:', err) }

      if (resumeTime > 0 && !resumeApplied.current) {
        resumeApplied.current = true
        const onSeeked = () => {
          if (wasPlaying) audio.play().then(() => setPlaying(true)).catch(console.log)
        }
        audio.addEventListener('seeked', onSeeked, { once: true })
        audio.currentTime = resumeTime
      } else {
        if (wasPlaying) audio.play().then(() => setPlaying(true)).catch(console.log)
      }
    }
    audio.addEventListener('loadedmetadata', onMeta, { once: true })
    audio.load()
    return () => { audio.removeEventListener('loadedmetadata', onMeta) }
  }, [src, chapter?.id])

  useEffect(() => {
    if (!duration || hasSavedHistory.current) return
    if ((currentTime / duration) * 100 >= 98) {
      saveListenHistory(duration)
      hasSavedHistory.current = true
    }
  }, [currentTime, duration, saveListenHistory])

  useEffect(() => {
    if (sleepTimer === null) { clearInterval(sleepIntervalRef.current); setSleepRemaining(0); return }
    setSleepRemaining(sleepTimer)
    clearInterval(sleepIntervalRef.current)
    sleepIntervalRef.current = setInterval(() => {
      setSleepRemaining(prev => {
        if (prev <= 1) {
          clearInterval(sleepIntervalRef.current)
          audioRef.current?.pause(); setPlaying(false); setSleepTimer(null); return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(sleepIntervalRef.current)
  }, [sleepTimer])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (audioRef.current && chapterIdRef.current) {
        const t = audioRef.current.currentTime
        if (t < 1) return
        localStorage.setItem(`audio-progress-${chapterIdRef.current}`, t)
        const nid = novelIdRef.current
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user && nid) {
            supabase.from('listen_history').upsert({
              user_id: session.user.id, novel_id: Number(nid),
              chapter_id: Number(chapterIdRef.current), progress_seconds: Math.floor(t),
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,chapter_id' })
          }
        })
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

    function handleEnded() {
  if (autoNextRef.current && nextChapterRef.current && onChapterChange) {
    playingRef.current = true
    setTimeout(() => onChapterChange(nextChapterRef.current), 800)
  } else {
    setPlaying(false)
    playingRef.current = false
  }
}

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return
    const current = audioRef.current.currentTime
    const total = audioRef.current.duration || 1
    setCurrentTime(current); setDuration(total); setProgress((current / total) * 100)
    if (onProgressUpdateRef.current && chapterIdRef.current) {
      onProgressUpdateRef.current(chapterIdRef.current, current, total)
    }
    const now = Date.now()
    if (now - lastSaveTime.current >= 15000) {
      saveListenHistory(current)
      lastSaveTime.current = now
    }
  }, [saveListenHistory])

  const togglePlay = async () => {
    if (!audioRef.current) return
    try {
      if (playing) {
        audioRef.current.pause(); setPlaying(false)
        saveListenHistory(audioRef.current.currentTime)
      } else {
        await audioRef.current.play(); setPlaying(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && novelIdRef.current) {
          await supabase.from('novel_views').insert({
            user_id: session.user.id, novel_id: Number(novelIdRef.current),
            chapter_id: chapterIdRef.current, viewed_at: new Date().toISOString()
          })
        }
      }
    } catch (err) { console.log(err) }
  }

  function toggleAutoNext() {
    const next = !autoNext
    setAutoNext(next)
    localStorage.setItem('player-auto-next', next)
  }

  const forward15 = () => { if (audioRef.current) audioRef.current.currentTime += 15 }
  const backward15 = () => { if (audioRef.current) audioRef.current.currentTime -= 15 }
  const changeVolume = (e) => { const v = Number(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; localStorage.setItem('player-volume', v) }
  const changeSpeed = (s) => { setSpeed(s); if (audioRef.current) audioRef.current.playbackRate = s; localStorage.setItem('player-speed', s) }
  const handleSeek = (e) => {
    if (!audioRef.current) return
    const v = Number(e.target.value)
    audioRef.current.currentTime = (v / 100) * duration; setProgress(v)
  }
  const formatTime = (t) => { const m = Math.floor(t / 60), s = Math.floor(t % 60); return `${m}:${s < 10 ? '0' : ''}${s}` }
  const formatSleep = (sec) => {
    if (sec >= 3600) return `${Math.floor(sec / 3600)}ชม.`
    if (sec >= 60) return `${Math.floor(sec / 60)}น.`
    return `${sec}วิ`
  }

  const sleepOptions = [
    { label: '5 นาที', sec: 300 }, { label: '10 นาที', sec: 600 },
    { label: '15 นาที', sec: 900 }, { label: '30 นาที', sec: 1800 },
    { label: '45 นาที', sec: 2700 }, { label: '1 ชั่วโมง', sec: 3600 },
    { label: '1.5 ชั่วโมง', sec: 5400 }, { label: 'จบตอนนี้', sec: -1 },
  ]

  function handleSleepSelect(opt) {
    setShowSleepMenu(false)
    if (opt.sec === -1) {
      setSleepTimer(null)
      audioRef.current?.addEventListener('ended', () => { audioRef.current?.pause(); setPlaying(false) }, { once: true })
    } else { setSleepTimer(opt.sec) }
  }

  if (!src) return null

  const btnBase = {
    background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '50%',
    color: '#e2e8f0', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
  }

  // ✅ Speed buttons — แสดงทั้งบน desktop และมือถือ (ไม่ซ่อนใน showExtra บนมือถือ)
  const speedButtons = [0.75, 1, 1.5, 2]  // ✅ 4 ตัวพอดีบรรทัดเดียวบนมือถือ

  return (
    <div style={{
      position: 'fixed', bottom: isMobile ? 0 : 16,
      left: isMobile ? 0 : '50%',
      transform: isMobile ? 'none' : 'translateX(-50%)',
      width: isMobile ? '100%' : '94%',
      maxWidth: isMobile ? '100%' : 860,
      background: 'rgba(10,10,28,0.97)', backdropFilter: 'blur(20px)',
      border: isMobile ? 'none' : '1px solid rgba(79,195,247,0.2)',
      borderTop: isMobile ? '1px solid rgba(79,195,247,0.2)' : undefined,
      borderRadius: isMobile ? '20px 20px 0 0' : 20,
      padding: isMobile ? '10px 14px 20px' : '12px 18px',
      zIndex: 9999,
      boxShadow: '0 -4px 32px rgba(0,0,0,0.5)',
    }}>
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} preload="auto">
        <source src={src} type="audio/mp3" />
      </audio>

      {/* Row 1: Info + Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
        {/* Cover + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <img src="/covers/bg.jpg" alt="cover"
            style={{ width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
            onError={e => { e.target.style.display = 'none' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.82rem', fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {novel?.title || 'STAR NOVEL'}
            </div>
            <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ตอน {chapter?.chapter_number} — {chapter?.title || 'กำลังเล่น...'}
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8 }}>
          <button onClick={() => prevChapter && onChapterChange(prevChapter)} disabled={!prevChapter}
            style={{ ...btnBase, width: isMobile ? 30 : 34, height: isMobile ? 30 : 34, fontSize: isMobile ? 14 : 16, opacity: prevChapter ? 1 : 0.3 }}>⏮</button>
          <button onClick={backward15}
            style={{ ...btnBase, width: isMobile ? 30 : 34, height: isMobile ? 30 : 34, fontSize: isMobile ? 11 : 13 }}>↺{isMobile ? '' : '15'}</button>
          <button onClick={togglePlay}
            style={{ ...btnBase, width: isMobile ? 40 : 44, height: isMobile ? 40 : 44, fontSize: isMobile ? 16 : 18, borderRadius: '50%',
              background: 'linear-gradient(135deg, #38bdf8, #2563eb)' }}>
            {playing ? '⏸' : '▶'}
          </button>
          <button onClick={forward15}
            style={{ ...btnBase, width: isMobile ? 30 : 34, height: isMobile ? 30 : 34, fontSize: isMobile ? 11 : 13 }}>↻{isMobile ? '' : '15'}</button>
          <button onClick={() => nextChapter && onChapterChange(nextChapter)} disabled={!nextChapter}
            style={{ ...btnBase, width: isMobile ? 30 : 34, height: isMobile ? 30 : 34, fontSize: isMobile ? 14 : 16, opacity: nextChapter ? 1 : 0.3 }}>⏭</button>
        </div>

        {/* Extra buttons — desktop only */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button onClick={toggleAutoNext} style={{
              padding: '5px 10px', borderRadius: 16, fontSize: '0.75rem', cursor: 'pointer',
              border: autoNext ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.12)',
              background: autoNext ? 'rgba(52,211,153,0.1)' : 'transparent',
              color: autoNext ? '#34d399' : '#64748b', whiteSpace: 'nowrap',
            }}>
              {autoNext ? '🔁 ต่อเนื่อง' : '➡️ หยุด'}
            </button>

            <div style={{ position: 'relative' }}>
              <button onClick={() => { setShowSleepMenu(!showSleepMenu); setShowExtra(false) }} style={{
                padding: '5px 10px', borderRadius: 16, fontSize: '0.75rem', cursor: 'pointer',
                border: sleepTimer ? '1px solid #4fc3f7' : '1px solid rgba(255,255,255,0.12)',
                background: sleepTimer ? 'rgba(79,195,247,0.1)' : 'transparent',
                color: sleepTimer ? '#4fc3f7' : '#64748b', whiteSpace: 'nowrap',
              }}>
                🌙 {sleepTimer ? formatSleep(sleepRemaining) : 'ตั้งเวลา'}
              </button>
              {showSleepMenu && (
                <div style={{ position: 'absolute', bottom: '110%', right: 0, background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 6, minWidth: 150, boxShadow: '0 8px 30px rgba(0,0,0,0.6)', zIndex: 9999 }}>
                  <p style={{ color: '#64748b', fontSize: '0.7rem', padding: '4px 8px', marginBottom: 2 }}>⏰ หยุดเล่นอัตโนมัติ</p>
                  {sleepTimer && (
                    <button onClick={() => { setSleepTimer(null); setShowSleepMenu(false) }}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,100,100,0.3)', background: 'rgba(255,100,100,0.08)', color: '#f87171', cursor: 'pointer', fontSize: '0.82rem', marginBottom: 2, textAlign: 'left' }}>
                      ❌ ยกเลิก
                    </button>
                  )}
                  {sleepOptions.map(opt => (
                    <button key={opt.label} onClick={() => handleSleepSelect(opt)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#e2e8f0', cursor: 'pointer', fontSize: '0.82rem', textAlign: 'left' }}
                      onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => { setShowExtra(!showExtra); setShowSleepMenu(false) }}
              style={{ ...btnBase, width: 30, height: 30, fontSize: 13, borderRadius: 8,
                color: showExtra ? '#4fc3f7' : '#64748b',
                border: showExtra ? '1px solid rgba(79,195,247,0.4)' : '1px solid rgba(255,255,255,0.1)' }}>
              ⚙
            </button>
          </div>
        )}
      </div>

      {/* Seek bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 0' }}>
        <span style={{ fontSize: '0.72rem', color: '#64748b', minWidth: 36 }}>{formatTime(currentTime)}</span>
        <input type="range" min="0" max="100" value={progress} onChange={handleSeek}
          style={{ flex: 1, accentColor: '#4fc3f7', cursor: 'pointer', height: 3 }} />
        <span style={{ fontSize: '0.72rem', color: '#64748b', minWidth: 36, textAlign: 'right' }}>{formatTime(duration)}</span>
      </div>

      {/* ✅ Speed buttons — แสดงเสมอบนมือถือ */}
      {isMobile && (
        <div style={{ marginTop: 10 }}>
          {/* Row: auto-next + sleep + speed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={toggleAutoNext} style={{
              padding: '4px 10px', borderRadius: 16, fontSize: '0.72rem', cursor: 'pointer',
              border: autoNext ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.15)',
              background: autoNext ? 'rgba(52,211,153,0.1)' : 'transparent',
              color: autoNext ? '#34d399' : '#64748b',
            }}>
              {autoNext ? '🔁 ต่อเนื่อง' : '➡️ หยุด'}
            </button>

            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowSleepMenu(!showSleepMenu)} style={{
                padding: '4px 10px', borderRadius: 16, fontSize: '0.72rem', cursor: 'pointer',
                border: sleepTimer ? '1px solid #4fc3f7' : '1px solid rgba(255,255,255,0.15)',
                background: sleepTimer ? 'rgba(79,195,247,0.1)' : 'transparent',
                color: sleepTimer ? '#4fc3f7' : '#64748b',
              }}>
                🌙 {sleepTimer ? formatSleep(sleepRemaining) : 'ตั้งเวลา'}
              </button>
              {showSleepMenu && (
                <div style={{ position: 'absolute', bottom: '110%', left: 0, background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 6, minWidth: 150, boxShadow: '0 8px 30px rgba(0,0,0,0.6)', zIndex: 9999 }}>
                  {sleepTimer && (
                    <button onClick={() => { setSleepTimer(null); setShowSleepMenu(false) }}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,100,100,0.3)', background: 'rgba(255,100,100,0.08)', color: '#f87171', cursor: 'pointer', fontSize: '0.82rem', marginBottom: 2, textAlign: 'left' }}>
                      ❌ ยกเลิก
                    </button>
                  )}
                  {sleepOptions.map(opt => (
                    <button key={opt.label} onClick={() => handleSleepSelect(opt)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#e2e8f0', cursor: 'pointer', fontSize: '0.82rem', textAlign: 'left' }}
                      onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ✅ ปุ่มความเร็วแสดงตลอดบนมือถือ */}
            <span style={{ color: '#64748b', fontSize: '0.72rem', marginLeft: 4 }}>⚡</span>
            {speedButtons.map(v => (
              <button key={v} onClick={() => changeSpeed(v)} style={{
                padding: '4px 8px', borderRadius: 20, fontSize: '0.72rem', cursor: 'pointer',
                border: '1px solid rgba(79,195,247,0.3)',
                background: Math.abs(speed - v) < 0.01 ? 'rgba(79,195,247,0.25)' : 'transparent',
                color: Math.abs(speed - v) < 0.01 ? '#4fc3f7' : '#64748b',
                fontWeight: Math.abs(speed - v) < 0.01 ? 700 : 400,
              }}>
                {v}x
              </button>
            ))}
          </div>

          {/* ✅ Speed slider + Volume slider บนมือถือ */}
          <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: 4 }}>
              <span>⚡ ความเร็ว</span>
              <strong style={{ color: '#e2e8f0' }}>{speed.toFixed(2)}x</strong>
            </div>
            <input type="range" min="0.5" max="3" step="0.05" value={speed}
              onChange={e => changeSpeed(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#4fc3f7', cursor: 'pointer', height: 3 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', flexShrink: 0 }}>
              🔊 {Math.round(volume * 100)}%
            </span>
            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={changeVolume}
              style={{ flex: 1, accentColor: '#4fc3f7', cursor: 'pointer', height: 3 }} />
          </div>
        </div>
      )}

      {/* Extra panel — desktop only */}
      {!isMobile && showExtra && (
        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem', color: '#64748b' }}>
              <span>⚡ ความเร็ว</span><strong style={{ color: '#e2e8f0' }}>{speed.toFixed(2)}x</strong>
            </div>
            <input type="range" min="0.5" max="5" step="0.05" value={speed}
              onChange={e => changeSpeed(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#4fc3f7', cursor: 'pointer' }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {[0.75, 1, 1.5, 2, 3, 4, 5].map(v => (
                <button key={v} onClick={() => changeSpeed(v)}
                  style={{ flex: 1, padding: '3px 0', borderRadius: 20, fontSize: '0.72rem', cursor: 'pointer',
                    border: '1px solid rgba(79,195,247,0.3)',
                    background: speed === v ? 'rgba(79,195,247,0.2)' : 'transparent',
                    color: speed === v ? '#4fc3f7' : '#64748b' }}>
                  {v}x
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 160, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem', color: '#64748b' }}>
              <span>🔊 เสียง</span><strong style={{ color: '#e2e8f0' }}>{Math.round(volume * 100)}%</strong>
            </div>
            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={changeVolume}
              style={{ width: '100%', accentColor: '#4fc3f7', cursor: 'pointer' }} />
          </div>
        </div>
      )}
    </div>
  )
}
