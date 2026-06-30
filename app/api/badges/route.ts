import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pseudo = searchParams.get('pseudo')
  if (!pseudo) return NextResponse.json({ error: 'pseudo manquant' }, { status: 400 })

  const supabase = createServerSupabase()
  const { data } = await supabase
    .from('member_badges')
    .select('badge, earned_at')
    .eq('pseudo', pseudo)
    .order('earned_at', { ascending: true })

  return NextResponse.json({ badges: (data || []).map(b => b.badge) })
}