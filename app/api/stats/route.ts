import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getPseudo } from '@/lib/auth'

// Retourne la plage 12h→12h du "jour en cours"
function getDayRange() {
  const now = new Date()
  const todayNoon = new Date(now)
  todayNoon.setHours(12, 0, 0, 0)

  if (now.getHours() >= 12) {
    // On est après midi : la journée a commencé aujourd'hui à 12h
    const start = todayNoon
    const end = new Date(todayNoon)
    end.setDate(end.getDate() + 1)
    return { start, end }
  } else {
    // On est avant midi : la journée a commencé hier à 12h
    const start = new Date(todayNoon)
    start.setDate(start.getDate() - 1)
    const end = todayNoon
    return { start, end }
  }
}

export async function GET(req: NextRequest) {
  const pseudo = await getPseudo()
  if (!pseudo) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const filterPseudo = searchParams.get('pseudo') // 'all' ou un pseudo

  const supabase = createServerSupabase()

  // Tous les posts (ou filtrés par pseudo)
  let query = supabase
    .from('posts')
    .select('pseudo, created_at, pint_number')
    .order('created_at', { ascending: true })

  if (filterPseudo && filterPseudo !== 'all') {
    query = query.eq('pseudo', filterPseudo)
  }

  const { data: posts, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const allPosts = posts || []

  // --- Pintes du jour (12h→12h) ---
  const { start: dayStart, end: dayEnd } = getDayRange()
  let todayQuery = supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', dayStart.toISOString())
    .lt('created_at', dayEnd.toISOString())

  if (filterPseudo && filterPseudo !== 'all') {
    todayQuery = todayQuery.eq('pseudo', filterPseudo)
  }

  const { count: todayCount } = await todayQuery

  // --- Liste des pseudos ---
  const { data: membersData } = await supabase.from('members').select('pseudo').order('pseudo')
  const pseudos = (membersData || []).map(m => m.pseudo)

  // --- Temps moyen entre 2 pintes (par pseudo) ---
  // On regroupe les posts par pseudo et on calcule les écarts
  const postsByPseudo: Record<string, string[]> = {}
  for (const post of allPosts) {
    if (!postsByPseudo[post.pseudo]) postsByPseudo[post.pseudo] = []
    postsByPseudo[post.pseudo].push(post.created_at)
  }

  const avgTimeBetween: Record<string, number | null> = {}
  for (const [p, dates] of Object.entries(postsByPseudo)) {
    if (dates.length < 2) {
      avgTimeBetween[p] = null
      continue
    }
    const diffs: number[] = []
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 60000 // minutes
      diffs.push(diff)
    }
    avgTimeBetween[p] = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length)
  }

  // --- Distribution horaire ---
  const hourlyDistribution: Record<number, number> = {}
  for (let h = 0; h < 24; h++) hourlyDistribution[h] = 0
  for (const post of allPosts) {
    const hour = new Date(post.created_at).getHours()
    hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1
  }

  // Heure de pointe
  let peakHour = 0
  let peakCount = 0
  for (const [h, count] of Object.entries(hourlyDistribution)) {
    if (count > peakCount) {
      peakCount = count
      peakHour = parseInt(h)
    }
  }

  return NextResponse.json({
    todayCount: todayCount ?? 0,
    todayRange: { start: dayStart.toISOString(), end: dayEnd.toISOString() },
    pseudos,
    avgTimeBetween,
    hourlyDistribution,
    peakHour,
    totalPosts: allPosts.length,
  })
}