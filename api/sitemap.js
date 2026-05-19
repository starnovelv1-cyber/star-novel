import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY  // เปลี่ยนตรงนี้
)

export default async function handler(req, res) {
  const { data: novels } = await supabase
    .from('novels')
    .select('id, updated_at')

  const baseUrl = 'https://star-novel.vercel.app'

  const staticPages = [
    { url: '/', priority: '1.0' },
    { url: '/login', priority: '0.5' },
    { url: '/coins', priority: '0.7' },
  ]

  const novelPages = novels?.map(novel => ({
    url: `/novel/${novel.id}`,
    priority: '0.8',
    lastmod: novel.updated_at?.split('T')[0]
  })) || []

  const allPages = [...staticPages, ...novelPages]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  res.setHeader('Content-Type', 'application/xml')
  res.status(200).send(xml)
}
