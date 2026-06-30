import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerSupabase()

  const { data, error } = await supabase
    .from('posts')
    .select('bar_name, city')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Agrégation bar_name + city → count
  const counts: Record<string, { bar_name: string; city: string; count: number }> = {}
  for (const post of data || []) {
    if (!post.bar_name || !post.city) continue
    const key = `${post.bar_name}|${post.city}`
    if (!counts[key]) counts[key] = { bar_name: post.bar_name, city: post.city, count: 0 }
    counts[key].count++
  }

  const bars = Object.values(counts).sort((a, b) => b.count - a.count)
  return NextResponse.json({ bars })
}