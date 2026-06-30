import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { validateInviteCode, PSEUDO_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { inviteCode, pseudo, email } = await req.json()

  if (!validateInviteCode(inviteCode)) {
    return NextResponse.json({ error: 'Code d\'invitation invalide' }, { status: 401 })
  }

  if (!pseudo || pseudo.trim().length < 2) {
    return NextResponse.json({ error: 'Pseudo trop court (min 2 caractères)' }, { status: 400 })
  }

  const cleanPseudo = pseudo.trim()
  const supabase = createServerSupabase()

  // Vérifier si le pseudo existe déjà
  const { data: existing } = await supabase
    .from('members')
    .select('id, pseudo')
    .eq('pseudo', cleanPseudo)
    .single()

  if (!existing) {
    // Créer le membre
    const { error } = await supabase
      .from('members')
      .insert({ pseudo: cleanPseudo, email: email || null })

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 })
    }
  }

  // Poser le cookie
  const res = NextResponse.json({ success: true, pseudo: cleanPseudo })
  res.cookies.set(PSEUDO_COOKIE, cleanPseudo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365, // 1 an
    path: '/',
  })
  return res
}
