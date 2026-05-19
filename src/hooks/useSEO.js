// src/hooks/useSEO.js
// ใช้งาน: useSEO({ title: '...', description: '...' })

import { useEffect } from 'react'

export default function useSEO({ title, description, image, url } = {}) {
  useEffect(() => {
    const siteName = 'Star Novel'
    const fullTitle = title ? `${title} — ${siteName}` : `${siteName} — นิยายเสียงออนไลน์`
    const fullDesc = description || 'แพลตฟอร์มนิยายเสียงออนไลน์ รวมนิยายหลากหลายแนว ฟังได้ทุกที่ทุกเวลา สมัครฟรี!'
    const fullImage = image || 'https://star-novel.vercel.app/covers/bg.jpg'
    const fullUrl = url || window.location.href

    // Title
    document.title = fullTitle

    // Helper
    const setMeta = (selector, content) => {
      let el = document.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        const attr = selector.includes('property') ? 'property' : 'name'
        const val = selector.match(/["']([^"']+)["']/)?.[1]
        if (attr && val) { el.setAttribute(attr, val); document.head.appendChild(el) }
      }
      if (el) el.setAttribute('content', content)
    }

    setMeta('meta[name="description"]', fullDesc)
    setMeta('meta[property="og:title"]', fullTitle)
    setMeta('meta[property="og:description"]', fullDesc)
    setMeta('meta[property="og:image"]', fullImage)
    setMeta('meta[property="og:url"]', fullUrl)
    setMeta('meta[name="twitter:title"]', fullTitle)
    setMeta('meta[name="twitter:description"]', fullDesc)
    setMeta('meta[name="twitter:image"]', fullImage)
  }, [title, description, image, url])
}
