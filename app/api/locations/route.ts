import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getPseudo } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const pseudo = await getPseudo()
  if (!pseudo) return NextResponse.json({ locations: [] })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() || ''
  const type = searchParams.get('type') || 'bar' // 'bar' | 'city'
  const column = type === 'city' ? 'city' : 'bar_name'

  const supabase = createServerSupabase()

  // Si q est vide → retourne les lieux les plus récents (suggestions au focus)
  // Si q est renseigné → filtre avec ilike
  let query = supabase
    .from('posts')
    .select('bar_name, city')
    .not(column, 'is', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (q.length > 0) {
    query = query.ilike(column, `%${q}%`)
  }

  const { data } = await query

  // Dédoublonne par bar_name (insensible à la casse), garde la ville associée
  const seen = new Set<string>()
  const results: { bar_name: string; city: string }[] = []

  for (const row of data || []) {
    const val = type === 'city' ? row.city : row.bar_name
    if (!val) continue
    const key = val.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      results.push({ bar_name: row.bar_name || '', city: row.city || '' })
    }
    if (results.length >= 6) break
  }

  // Pour le champ bar : on retourne aussi la ville associée pour l'auto-complétion
  const locations = results.map(r => (type === 'city' ? r.city : r.bar_name))
  const cityByBar: Record<string, string> = {}
  for (const r of results) {
    if (r.bar_name) cityByBar[r.bar_name] = r.city
  }

  return NextResponse.json({ locations, cityByBar })
}