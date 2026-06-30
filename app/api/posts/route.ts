import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getPseudo } from '@/lib/auth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const MILESTONES = [50, 100, 250, 500, 1000, 2000, 5000]

const MILESTONE_MESSAGES: Record<number, string> = {
  50:   "50 pintes ! La machine est lancée 🚀",
  100:  "100 pintes ! Un siècle de mousse 🍺",
  250:  "250 pintes ! Le quart de chemin est fait 💪",
  500:  "500 pintes ! La moitié du chemin, respect 🏅",
  1000: "1000 pintes ! 4 chiffres, ça en jette 🔥",
  2000: "2000 pintes ! Les légendes sont en marche 🏆",
  5000: "5000 pintes ! OBJECTIF ATTEINT ! 🎉🍺🎉",
}

// Définition des badges
const BADGE_DEFINITIONS = {
  premier_post:  { label: "Premier post", emoji: "🥇", desc: "Premier à avoir posté une pinte" },
  centenaire:    { label: "Centenaire",   emoji: "💯", desc: "A posté la 100ème pinte du groupe" },
  explorateur:   { label: "Explorateur",  emoji: "📍", desc: "A posté depuis 5 bars différents" },
  vendredi:      { label: "Vendredi",     emoji: "📅", desc: "A posté un vendredi" },
  assidu:        { label: "Assidu",       emoji: "🔥", desc: "A posté 3 semaines de suite" },
}

export type BadgeType = keyof typeof BADGE_DEFINITIONS

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
  const isMilestone = MILESTONES.includes(pintNumber)

  // Upload photo
  const ext = photo.name.split('.').pop() || 'jpg'
  const fileName = `${pintNumber}-${pseudo}-${Date.now()}.${ext}`
  const arrayBuffer = await photo.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('pints')
    .upload(fileName, arrayBuffer, { contentType: photo.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: 'Erreur upload photo' }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('pints').getPublicUrl(fileName)

  const { data: member } = await supabase
    .from('members').select('id').eq('pseudo', pseudo).single()

  const { data: post, error: insertError } = await supabase
    .from('posts')
    .insert({ pseudo, member_id: member?.id ?? null, location, photo_url: publicUrl, pint_number: pintNumber, is_milestone: isMilestone })
    .select().single()

  if (insertError) return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })

  // Attribution des badges
  const earnedBadges: BadgeType[] = []

  // 🥇 Premier post du groupe
  if (pintNumber === 1) {
    await awardBadge(supabase, pseudo, 'premier_post')
    earnedBadges.push('premier_post')
  }

  // 💯 A posté la 100ème pinte
  if (pintNumber === 100) {
    await awardBadge(supabase, pseudo, 'centenaire')
    earnedBadges.push('centenaire')
  }

  // 📅 Vendredi
  if (new Date().getDay() === 5) {
    const already = await hasBadge(supabase, pseudo, 'vendredi')
    if (!already) {
      await awardBadge(supabase, pseudo, 'vendredi')
      earnedBadges.push('vendredi')
    }
  }

  // 📍 Explorateur — 5 bars différents
  const { data: userPosts } = await supabase
    .from('posts').select('location').eq('pseudo', pseudo)
  const uniqueLocs = new Set((userPosts || []).map(p => p.location.toLowerCase().trim()))
  if (uniqueLocs.size >= 5) {
    const already = await hasBadge(supabase, pseudo, 'explorateur')
    if (!already) {
      await awardBadge(supabase, pseudo, 'explorateur')
      earnedBadges.push('explorateur')
    }
  }

  // 🔥 Assidu — 3 semaines de suite
  const isAssidu = await checkAssidu(supabase, pseudo)
  if (isAssidu) {
    const already = await hasBadge(supabase, pseudo, 'assidu')
    if (!already) {
      await awardBadge(supabase, pseudo, 'assidu')
      earnedBadges.push('assidu')
    }
  }

  // Email palier
  if (isMilestone) await sendMilestoneEmail(pintNumber, pseudo, location, publicUrl)

  return NextResponse.json({ post, isMilestone, earnedBadges }, { status: 201 })
}

// Helpers badges
async function awardBadge(supabase: ReturnType<typeof import('@/lib/supabase-server').createServerSupabase>, pseudo: string, badge: BadgeType) {
  await supabase.from('member_badges').insert({ pseudo, badge }).select()
}

async function hasBadge(supabase: ReturnType<typeof import('@/lib/supabase-server').createServerSupabase>, pseudo: string, badge: BadgeType) {
  const { data } = await supabase.from('member_badges').select('id').eq('pseudo', pseudo).eq('badge', badge).single()
  return !!data
}

async function checkAssidu(supabase: ReturnType<typeof import('@/lib/supabase-server').createServerSupabase>, pseudo: string): Promise<boolean> {
  // Vérifie si le membre a posté durant les 3 dernières semaines calendaires
  const now = new Date()
  const weeks: { start: Date; end: Date }[] = []
  for (let i = 0; i < 3; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() - i * 7)
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    weeks.push({ start: monday, end: sunday })
  }
  for (const week of weeks) {
    const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true })
      .eq('pseudo', pseudo)
      .gte('created_at', week.start.toISOString())
      .lte('created_at', week.end.toISOString())
    if (!count || count === 0) return false
  }
  return true
}

async function sendMilestoneEmail(pintNumber: number, pseudo: string, location: string, photoUrl: string) {
  const supabase = createServerSupabase()
  const { data: members } = await supabase.from('members').select('email').not('email', 'is', null)
  const emails = (members || []).map(m => m.email!).filter(Boolean)
  if (emails.length === 0) return

  const goal = parseInt(process.env.NEXT_PUBLIC_GOAL || '5000')
  const message = MILESTONE_MESSAGES[pintNumber] || `Pinte #${pintNumber} atteinte !`

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#030712;font-family:Arial,sans-serif;">
  <div style="max-width:500px;margin:0 auto;padding:24px;">
    <div style="text-align:center;padding:40px 24px;background:linear-gradient(135deg,#78350f,#d97706,#fbbf24);border-radius:20px;margin-bottom:24px;">
      <div style="font-size:64px;margin-bottom:12px;">🎉</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:900;">PALIER ATTEINT !</h1>
      <div style="color:#fef3c7;font-size:64px;font-weight:900;margin:8px 0;">#${pintNumber}</div>
      <p style="color:#fef3c7;margin:0;font-size:16px;">${message}</p>
    </div>
    <div style="background:#111827;border-radius:16px;padding:24px;margin-bottom:16px;text-align:center;">
      <p style="color:#9ca3af;margin:0 0 8px;font-size:13px;">Posté par</p>
      <p style="color:#f59e0b;font-size:28px;font-weight:900;margin:0 0 4px;">${pseudo}</p>
      <p style="color:#6b7280;font-size:14px;margin:0;">📍 ${location}</p>
    </div>
    <div style="border-radius:16px;overflow:hidden;margin-bottom:16px;border:3px solid #d97706;">
      <img src="${photoUrl}" alt="Pinte #${pintNumber}" style="width:100%;display:block;" />
    </div>
    <div style="background:#111827;border-radius:16px;padding:20px;text-align:center;">
      <p style="color:#f59e0b;font-size:36px;font-weight:900;margin:0;">${pintNumber} <span style="color:#4b5563;font-size:18px;">/ ${goal}</span></p>
      <div style="background:#1f2937;border-radius:99px;height:10px;margin:12px 0 6px;">
        <div style="background:linear-gradient(90deg,#92400e,#f59e0b);border-radius:99px;height:10px;width:${Math.min(100, (pintNumber / goal) * 100).toFixed(1)}%;"></div>
      </div>
    </div>
    <p style="color:#374151;text-align:center;font-size:12px;margin-top:24px;">Santé 🍺</p>
  </div>
</body></html>`

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: emails,
    subject: `🎉 Palier #${pintNumber} atteint ! ${message}`,
    html,
  })
}

export { BADGE_DEFINITIONS }