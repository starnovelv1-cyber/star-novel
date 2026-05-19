import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

export default function Categories() {
  const [categories, setCategories] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("name")
      setCategories(data || [])
    }
    fetchCategories()
  }, [])

  return (
    <section className="section">
      <div className="section-header">
        <h2>หมวดหมู่</h2>
        <span className="section-sub">เลือกแนวนิยายที่ชอบ</span>
      </div>
      <div className="categories">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="cat-tag"
            onClick={() => navigate(`/category/${cat.id}`)}
          >
            {cat.icon || "📚"} {cat.name}
          </div>
        ))}
      </div>
    </section>
  )
}
