import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getPseudo } from '@/lib/auth'

// GET : récupérer les posts (paginés)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '0')
  const pageSize = 20
  const from = page * pageSize
  const to = from + pageSize - 1

  const supabase = createServerSupabase()
  const { data, error, count } = await supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ posts: data, total: count, page, pageSize })
}

// POST : créer un nouveau post avec photo
export async function POST(req: NextRequest) {
  const pseudo = await getPseudo()
  if (!pseudo) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const formData = await req.formData()
  const photo = formData.get('photo') as File | null
  const location = (formData.get('location') as string)?.trim()

  if (!photo) return NextResponse.json({ error: 'Photo manquante' }, { status: 400 })
  if (!location) return NextResponse.json({ error: 'Lieu manquant' }, { status: 400 })

  const supabase = createServerSupabase()

  // Numéro de pinte suivant
  const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true })
  const pintNumber = (count ?? 0) + 1

  // Upload photo dans Supabase Storage
  const ext = photo.name.split('.').pop() || 'jpg'
  const fileName = `${pintNumber}-${pseudo}-${Date.now()}.${ext}`
  const arrayBuffer = await photo.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('pints')
    .upload(fileName, arrayBuffer, { contentType: photo.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: 'Erreur upload photo' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('pints')
    .getPublicUrl(fileName)

  // Récupérer le member_id
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('pseudo', pseudo)
    .single()

  // Insérer le post
  const { data: post, error: insertError } = await supabase
    .from('posts')
    .insert({
      pseudo,
      member_id: member?.id ?? null,
      location,
      photo_url: publicUrl,
      pint_number: pintNumber,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  return NextResponse.json({ post }, { status: 201 })
}
