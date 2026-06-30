import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { validateInviteCode, PSEUDO_COOKIE } from '@/lib/auth'

// Normalise le pseudo : première lettre majuscule, reste minuscule
// "BEN" → "Ben", "ben" → "Ben", "VINZ" → "Vinz"
function normalizePseudo(input: string): string {
  const trimmed = input.trim()
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

export async function POST(req: NextRequest) {
  const { inviteCode, pseudo, email } = await req.json()

  if (!validateInviteCode(inviteCode)) {
    return NextResponse.json({ error: 'Code d\'invitation invalide' }, { status: 401 })
  }

  if (!pseudo || pseudo.trim().length < 2) {
    return NextResponse.json({ error: 'Pseudo trop court (min 2 caractères)' }, { status: 400 })
  }

  const normalized = normalizePseudo(pseudo)
  const supabase = createServerSupabase()

  // Recherche insensible à la casse : "BEN", "ben", "Ben" → même compte
  const { data: existing } = await supabase
    .from('members')
    .select('id, pseudo')
    .ilike('pseudo', normalized)
    .single()

  if (existing) {
    // Le compte existe déjà → on connecte avec le pseudo STOCKÉ en base
    // (pour éviter que "ben" écrase "Ben" si quelqu'un tape différemment)
    const storedPseudo = existing.pseudo
    const res = NextResponse.json({ success: true, pseudo: storedPseudo })
    res.cookies.set(PSEUDO_COOKIE, storedPseudo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })
    return res
  }

  // Nouveau membre → on crée avec le pseudo normalisé
  const { error } = await supabase
    .from('members')
    .insert({ pseudo: normalized, email: email || null })

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 })
  }

  const res = NextResponse.json({ success: true, pseudo: normalized })
  res.cookies.set(PSEUDO_COOKIE, normalized, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return res
}