import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

export default function Ranking() {
  const [novels, setNovels] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchRanking() {
      const { data, error } = await supabase
        .from("novels")
        .select("id, title, cover_url, views, rating, categories!category_id(name), writers!writer_id(pen_name)")
        .order("views", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Ranking fetch error:", error)
        return
      }

      setNovels(data || [])
    }
    fetchRanking()
  }, [])

  const rankClass = (i) => {
    if (i === 0) return "rank-num gold"
    if (i === 1) return "rank-num silver"
    if (i === 2) return "rank-num bronze"
    return "rank-num normal"
  }

  return (
    <section className="section">
      <div className="section-header">
        <h2>🏆 อันดับยอดนิยม</h2>
        <span className="section-sub">เรียงตามยอดวิว</span>
      </div>
      <div className="ranking-list">
        {novels.map((novel, index) => (
          <div
            key={novel.id}
            className="rank-item"
            onClick={() => navigate(`/novel/${novel.id}`)}
          >
            <span className={rankClass(index)}>{index + 1}</span>
            {novel.cover_url
              ? <img src={novel.cover_url} alt={novel.title} />
              : <div style={{
                  width: '52px', height: '70px', borderRadius: '6px',
                  background: '#1a1a3e', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '24px'
                }}>📚</div>
            }
            <div className="rank-info">
              <h3>{novel.title}</h3>
              <span>{novel.writers?.pen_name || "ไม่ระบุ"} · 👁 {(novel.views || 0).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
