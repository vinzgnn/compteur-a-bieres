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
      is_milestone: isMilestone,
    })
    .select()
    .single()
 
  if (insertError) {
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }
 
  // Envoyer un email de palier si nécessaire
  if (isMilestone) {
    await sendMilestoneEmail(pintNumber, pseudo, location, publicUrl)
  }
 
  return NextResponse.json({ post, isMilestone }, { status: 201 })
}
 
async function sendMilestoneEmail(
  pintNumber: number,
  pseudo: string,
  location: string,
  photoUrl: string
) {
  const supabase = createServerSupabase()
  const { data: members } = await supabase
    .from('members')
    .select('email')
    .not('email', 'is', null)
 
  const emails = (members || []).map(m => m.email!).filter(Boolean)
  if (emails.length === 0) return
 
  const goal = parseInt(process.env.NEXT_PUBLIC_GOAL || '5000')
  const message = MILESTONE_MESSAGES[pintNumber] || `Pinte #${pintNumber} atteinte !`
 
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#030712;font-family:Arial,sans-serif;">
  <div style="max-width:500px;margin:0 auto;padding:24px;">
 
    <!-- Header palier -->
    <div style="text-align:center;padding:40px 24px;background:linear-gradient(135deg,#78350f,#d97706,#fbbf24);border-radius:20px;margin-bottom:24px;">
      <div style="font-size:64px;margin-bottom:12px;">🎉</div>
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:900;">PALIER ATTEINT !</h1>
      <div style="color:#fef3c7;font-size:64px;font-weight:900;margin:8px 0;">#${pintNumber}</div>
      <p style="color:#fef3c7;margin:0;font-size:16px;">${message}</p>
    </div>
 
    <!-- Qui a posté -->
    <div style="background:#111827;border-radius:16px;padding:24px;margin-bottom:16px;text-align:center;">
      <p style="color:#9ca3af;margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Posté par</p>
      <p style="color:#f59e0b;font-size:28px;font-weight:900;margin:0 0 4px;">${pseudo}</p>
      <p style="color:#6b7280;font-size:14px;margin:0;">📍 ${location}</p>
    </div>
 
    <!-- Photo -->
    <div style="border-radius:16px;overflow:hidden;margin-bottom:16px;border:3px solid #d97706;">
      <img src="${photoUrl}" alt="Pinte #${pintNumber}" style="width:100%;display:block;" />
    </div>
 
    <!-- Progression -->
    <div style="background:#111827;border-radius:16px;padding:20px;text-align:center;">
      <p style="color:#9ca3af;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Progression</p>
      <p style="color:#f59e0b;font-size:36px;font-weight:900;margin:0;">${pintNumber} <span style="color:#4b5563;font-size:18px;">/ ${goal}</span></p>
      <div style="background:#1f2937;border-radius:99px;height:10px;margin:12px 0 6px;">
        <div style="background:linear-gradient(90deg,#92400e,#f59e0b);border-radius:99px;height:10px;width:${Math.min(100, (pintNumber / goal) * 100).toFixed(1)}%;"></div>
      </div>
      <p style="color:#4b5563;font-size:12px;margin:0;">Plus que ${goal - pintNumber} pintes !</p>
    </div>
 
    <p style="color:#374151;text-align:center;font-size:12px;margin-top:24px;">Santé 🍺</p>
  </div>
</body>
</html>`
 
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: emails,
    subject: `🎉 Palier #${pintNumber} atteint ! ${message}`,
    html,
  })
}