import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getPseudo } from '@/lib/auth'

// GET : commentaires d'un post
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('post_id')
  if (!postId) return NextResponse.json({ error: 'post_id manquant' }, { status: 400 })

  const supabase = createServerSupabase()
  const { data } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  return NextResponse.json({ comments: data || [] })
}

// POST : ajouter un commentaire
export async function POST(req: NextRequest) {
  const pseudo = await getPseudo()
  if (!pseudo) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { post_id, content } = await req.json()
  if (!post_id || !content?.trim()) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
  }
  if (content.trim().length > 300) {
    return NextResponse.json({ error: 'Commentaire trop long (max 300 caractères)' }, { status: 400 })
  }

  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id, pseudo, content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ comment: data }, { status: 201 })
}