import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getPseudo } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const pseudo = await getPseudo()
  if (!pseudo) return NextResponse.json({ locations: [] })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() || ''

  if (q.length < 1) return NextResponse.json({ locations: [] })

  const supabase = createServerSupabase()

  // Récupère les lieux distincts qui contiennent la recherche (insensible à la casse)
  const { data } = await supabase
    .from('posts')
    .select('location')
    .ilike('location', `%${q}%`)
    .order('created_at', { ascending: false })
    .limit(50)

  // Dédoublonne et limite à 6 suggestions
  const seen = new Set<string>()
  const locations: string[] = []
  for (const row of data || []) {
    const key = row.location.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      locations.push(row.location)
    }
    if (locations.length >= 6) break
  }

  return NextResponse.json({ locations })
}