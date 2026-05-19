import { useState } from 'react'

const STORAGE_KEY = 'duplicate_check_history'

function normalize(str) {
  return (str || '').toLowerCase().replace(/\s+/g, '').replace(/[^\u0E00-\u0E7Fa-z0-9]/g, '')
}

function levenshtein(a, b) {
  if (!a) return b.length
  if (!b) return a.length
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

function similarity(a, b) {
  const na = normalize(a), nb = normalize(b)
  if (!na || !nb) return 0
  const maxLen = Math.max(na.length, nb.length)
  return maxLen === 0 ? 1 : 1 - levenshtein(na, nb) / maxLen
}

function normalizeLink(url) {
  try {
    const u = new URL(url)
    return (u.hostname.replace(/^www\.|^m\./, '') + u.pathname + u.search).toLowerCase()
  } catch {
    return normalize(url)
  }
}

export function useDuplicateCheck() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const checkDuplicate = async ({ title, sourceLink, translatorName }) => {
    if (!title && !sourceLink && !translatorName) {
      setResults({ type: 'empty' })
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // ดึงประวัติจาก localStorage เท่านั้น
      let history = []
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) history = JSON.parse(saved)
      } catch {}

      const matches = []

      for (const entry of history) {
        const flags = []

        // ตรวจชื่อเรื่อง (>= 72%)
        if (title && entry.title) {
          const score = similarity(title, entry.title)
          if (score >= 0.72) {
            flags.push({
              field: 'ชื่อเรื่อง',
              type: score >= 0.99 ? 'exact' : 'fuzzy',
              score,
              existing: entry.title,
            })
          }
        }

        // ตรวจลิงก์ต้นฉบับ (>= 92%)
        if (sourceLink && entry.sourceLink) {
          const score = similarity(normalizeLink(sourceLink), normalizeLink(entry.sourceLink))
          if (score >= 0.92) {
            flags.push({
              field: 'ลิงก์ต้นฉบับ',
              type: score >= 0.99 ? 'exact' : 'fuzzy',
              score,
              existing: entry.sourceLink,
            })
          }
        }

        // ตรวจนักแปล (>= 85%)
        if (translatorName && entry.translatorName) {
          const score = similarity(translatorName, entry.translatorName)
          if (score >= 0.85) {
            flags.push({
              field: 'นักแปล',
              type: score >= 0.99 ? 'exact' : 'fuzzy',
              score,
              existing: entry.translatorName,
            })
          }
        }

        if (flags.length > 0) {
          matches.push({
            novel: {
              id: entry.id,
              title: entry.title,
              source_link: entry.sourceLink,
              translator_name: entry.translatorName,
              status: null,
              created_at: entry.checkedAt,
            },
            flags,
            isExact: flags.some(f => f.type === 'exact'),
            topScore: Math.max(...flags.map(f => f.score)),
          })
        }
      }

      matches.sort((a, b) => b.topScore - a.topScore)

      const resultData = {
        type: matches.length === 0 ? 'clear' : matches.some(m => m.isExact) ? 'danger' : 'warning',
        matches,
        checkedCount: history.length,
      }

      setResults(resultData)
      return resultData
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { checkDuplicate, results, loading, error, reset: () => setResults(null) }
}
