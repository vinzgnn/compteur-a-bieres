import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getPseudo } from '@/lib/auth'

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// GET : pinte du mois + vote du user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') || currentMonth()
  const pseudo = await getPseudo()

  const supabase = createServerSupabase()

  // Tous les votes du mois
  const { data: votes } = await supabase
    .from('votes_pinte_mois')
    .select('post_id, pseudo')
    .eq('month', month)

  if (!votes || votes.length === 0) {
    return NextResponse.json({ winner: null, votes: [], myVote: null, month })
  }

  // Compter les votes par post
  const counts: Record<string, number> = {}
  for (const v of votes) {
    counts[v.post_id] = (counts[v.post_id] || 0) + 1
  }

  // Post gagnant
  const winnerId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  let winner = null
  if (winnerId) {
    const { data } = await supabase.from('posts').select('*').eq('id', winnerId).single()
    winner = data ? { ...data, voteCount: counts[winnerId] } : null
  }

  const myVote = pseudo ? votes.find(v => v.pseudo === pseudo)?.post_id ?? null : null

  return NextResponse.json({ winner, votes: counts, myVote, month })
}

// POST : voter pour une pinte du mois
export async function POST(req: NextRequest) {
  const pseudo = await getPseudo()
  if (!pseudo) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { post_id } = await req.json()
  if (!post_id) return NextResponse.json({ error: 'post_id manquant' }, { status: 400 })

  const month = currentMonth()
  const supabase = createServerSupabase()

  // Vérifier que le post appartient au mois en cours
  const { data: post } = await supabase.from('posts').select('created_at').eq('id', post_id).single()
  if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })

  const postMonth = post.created_at.slice(0, 7)
  if (postMonth !== month) {
    return NextResponse.json({ error: 'Tu ne peux voter que pour une pinte de ce mois-ci' }, { status: 400 })
  }

  // Supprimer l'ancien vote du mois si existant
  await supabase.from('votes_pinte_mois').delete().eq('pseudo', pseudo).eq('month', month)

  // Voter
  await supabase.from('votes_pinte_mois').insert({ post_id, pseudo, month })

  return NextResponse.json({ success: true, post_id, month })
}