import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useNovels(filters = {}) {
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNovels() {
      setLoading(true)
      let query = supabase
        .from('novels')
        .select('*, writers(pen_name), categories(name, slug)')
        .order('updated_at', { ascending: false })

      if (filters.trending) query = query.eq('is_trending', true)
      if (filters.limit) query = query.limit(filters.limit)

      const { data } = await query
      setNovels(data || [])
      setLoading(false)
    }
    fetchNovels()
  }, [])

  return { novels, loading }
}
