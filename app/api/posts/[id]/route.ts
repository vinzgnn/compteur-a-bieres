import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getPseudo } from '@/lib/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const pseudo = await getPseudo()
  if (!pseudo) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = params
  const supabase = createServerSupabase()

  // Vérifier que le post appartient bien à cet utilisateur
  const { data: post } = await supabase
    .from('posts')
    .select('id, pseudo, photo_url')
    .eq('id', id)
    .single()

  if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
  if (post.pseudo !== pseudo) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  // Supprimer réactions et commentaires d'abord
  await supabase.from('reactions').delete().eq('post_id', id)
  await supabase.from('comments').delete().eq('post_id', id)

  // Supprimer le post
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 })

  // Supprimer la photo du storage
  const fileName = post.photo_url.split('/').pop()
  if (fileName) {
    await supabase.storage.from('pints').remove([fileName])
  }

  return NextResponse.json({ success: true })
}