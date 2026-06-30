import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getPseudo } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const pseudo = await getPseudo()
  if (!pseudo) return NextResponse.json({ locations: [] })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() || ''
  const type = searchParams.get('type') || 'bar' // 'bar' | 'city'

  if (q.length < 1) return NextResponse.json({ locations: [] })

  const supabase = createServerSupabase()
  const column = type === 'city' ? 'city' : 'bar_name'

  const { data } = await supabase
    .from('posts')
    .select(column)
    .ilike(column, `%${q}%`)
    .not(column, 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  // Dédoublonne (insensible à la casse) et limite à 6
  const seen = new Set<string>()
  const locations: string[] = []
  for (const row of data || []) {
    const val = (row as Record<string, string>)[column]
    if (!val) continue
    const key = val.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      locations.push(val)
    }
    if (locations.length >= 6) break
  }

  return NextResponse.json({ locations })
}