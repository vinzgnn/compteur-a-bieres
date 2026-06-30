import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getPseudo } from '@/lib/auth'
 
const ALLOWED_EMOJIS = ['🍺', '👏', '🔥']
 
// GET : réactions d'un post
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('post_id')
  if (!postId) return NextResponse.json({ error: 'post_id manquant' }, { status: 400 })
 
  const supabase = createServerSupabase()
  const { data } = await supabase
    .from('reactions')
    .select('emoji, pseudo')
    .eq('post_id', postId)
 
  return NextResponse.json({ reactions: data || [] })
}
 
// POST : toggle réaction (ajouter ou supprimer)
export async function POST(req: NextRequest) {
  const pseudo = await getPseudo()
  if (!pseudo) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
 
  const { post_id, emoji } = await req.json()
  if (!post_id || !ALLOWED_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
  }
 
  const supabase = createServerSupabase()
 
  // Vérifier si la réaction existe déjà
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('post_id', post_id)
    .eq('pseudo', pseudo)
    .eq('emoji', emoji)
    .single()
 
  if (existing) {
    // Supprimer
    await supabase.from('reactions').delete().eq('id', existing.id)
    return NextResponse.json({ action: 'removed' })
  } else {
    // Ajouter
    await supabase.from('reactions').insert({ post_id, pseudo, emoji })
    return NextResponse.json({ action: 'added' })
  }
}