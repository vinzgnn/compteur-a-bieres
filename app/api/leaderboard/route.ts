import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getWeekRange } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'all' // 'all' | 'week'

  const supabase = createServerSupabase()

  // Classement global
  const { data: allPosts } = await supabase
    .from('posts')
    .select('pseudo')

  const globalRanking = buildRanking(allPosts || [])

  if (type === 'all') {
    return NextResponse.json({ ranking: globalRanking })
  }

  // Classement hebdo
  const { start, end } = getWeekRange()
  const { data: weekPosts } = await supabase
    .from('posts')
    .select('pseudo')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())

  const weekRanking = buildRanking(weekPosts || [])

  return NextResponse.json({ ranking: weekRanking, weekStart: start, weekEnd: end })
}

function buildRanking(posts: { pseudo: string }[]) {
  const counts: Record<string, number> = {}
  for (const p of posts) {
    counts[p.pseudo] = (counts[p.pseudo] || 0) + 1
  }
  return Object.entries(counts)
    .map(([pseudo, count]) => ({ pseudo, count }))
    .sort((a, b) => b.count - a.count)
}
