import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getPreviousWeekRange } from '@/lib/utils'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createServerSupabase()
  const { start, end } = getPreviousWeekRange()

  const { data: weekPosts, count: weekCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: false })

  const { count: totalCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })

  const ranking = buildRanking(weekPosts || [])

  // Bar le plus visité cette semaine
  const barCounts: Record<string, number> = {}
  for (const p of weekPosts || []) {
    if (p.bar_name) barCounts[p.bar_name] = (barCounts[p.bar_name] || 0) + 1
  }
  const topBar = Object.entries(barCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

  // Ville la plus visitée cette semaine
  const cityCounts: Record<string, number> = {}
  for (const p of weekPosts || []) {
    if (p.city) cityCounts[p.city] = (cityCounts[p.city] || 0) + 1
  }
  const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

  const { data: members } = await supabase
    .from('members')
    .select('email, pseudo')
    .not('email', 'is', null)

  const emails = (members || []).map(m => m.email!).filter(Boolean)
  if (emails.length === 0) {
    return NextResponse.json({ message: 'Aucun email à envoyer' })
  }

  const goal = parseInt(process.env.NEXT_PUBLIC_GOAL || '5000')
  const progressPct = Math.min(100, Math.round(((totalCount || 0) / goal) * 100))

  const rankingRows = ranking.slice(0, 5)
    .map((r, i) => {
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
      return `<tr>
        <td style="padding:8px 12px;font-size:20px;">${medals[i]}</td>
        <td style="padding:8px 12px;font-weight:600;">${r.pseudo}</td>
        <td style="padding:8px 12px;text-align:right;">${r.count} pinte${r.count > 1 ? 's' : ''}</td>
      </tr>`
    }).join('')

  const weekLabel = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    + ' → ' + end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const encouragements = [
    "Le foie aussi vous remercie 🙏",
    "La mousse n'attend pas !",
    "In beer we trust 🍺",
    "Chaque pinte compte. Surtout la vôtre.",
    "5000 pintes : un rêve, une mission, un mode de vie.",
  ]
  const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)]

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#1c1c2e;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="text-align:center;padding:32px 24px;background:linear-gradient(135deg,#92400e,#d97706);border-radius:16px;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:8px;">🍺</div>
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;">Road to ${goal} pintes</h1>
      <p style="color:#fef3c7;margin:8px 0 0;font-size:14px;">Récap de la semaine · ${weekLabel}</p>
    </div>

    <div style="background:#2d2d44;border-radius:12px;padding:24px;margin-bottom:16px;text-align:center;">
      <p style="color:#9ca3af;margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Total général</p>
      <p style="color:#f59e0b;margin:0;font-size:48px;font-weight:900;">${totalCount || 0} <span style="font-size:24px;color:#9ca3af;">/ ${goal}</span></p>
      <div style="background:#374151;border-radius:99px;height:12px;margin:16px 0 8px;">
        <div style="background:linear-gradient(90deg,#d97706,#f59e0b);border-radius:99px;height:12px;width:${progressPct}%;"></div>
      </div>
      <p style="color:#6b7280;margin:0;font-size:13px;">${progressPct}% de l'objectif atteint</p>
    </div>

    <div style="background:#2d2d44;border-radius:12px;padding:24px;margin-bottom:16px;">
      <h2 style="color:#f59e0b;margin:0 0 16px;font-size:18px;">📊 La semaine en chiffres</h2>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <div style="flex:1;min-width:120px;background:#1c1c2e;border-radius:8px;padding:16px;text-align:center;">
          <p style="color:#f59e0b;font-size:32px;font-weight:800;margin:0;">${weekCount || 0}</p>
          <p style="color:#9ca3af;font-size:12px;margin:4px 0 0;">pintes cette semaine</p>
        </div>
        <div style="flex:1;min-width:120px;background:#1c1c2e;border-radius:8px;padding:16px;text-align:center;">
          <p style="color:#f59e0b;font-size:32px;font-weight:800;margin:0;">${ranking.length}</p>
          <p style="color:#9ca3af;font-size:12px;margin:4px 0 0;">participants actifs</p>
        </div>
        <div style="flex:1;min-width:120px;background:#1c1c2e;border-radius:8px;padding:16px;text-align:center;">
          <p style="color:#f59e0b;font-size:16px;font-weight:800;margin:0;">🍺 ${topBar}</p>
          <p style="color:#9ca3af;font-size:12px;margin:4px 0 0;">📍 ${topCity}</p>
          <p style="color:#6b7280;font-size:11px;margin:4px 0 0;">lieu de la semaine</p>
        </div>
      </div>
    </div>

    ${rankingRows ? `
    <div style="background:#2d2d44;border-radius:12px;padding:24px;margin-bottom:16px;">
      <h2 style="color:#f59e0b;margin:0 0 16px;font-size:18px;">🏆 Classement de la semaine</h2>
      <table style="width:100%;border-collapse:collapse;">${rankingRows}</table>
    </div>
    ` : ''}

    <div style="background:linear-gradient(135deg,#1e3a5f,#1c1c2e);border:1px solid #374151;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="color:#e5e7eb;font-size:16px;font-style:italic;margin:0;">"${encouragement}"</p>
    </div>

    <p style="color:#4b5563;text-align:center;font-size:12px;margin:0;">
      Tu reçois cet email parce que tu fais partie du groupe Road to ${goal} pintes.<br>Santé 🍺
    </p>
  </div>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: emails,
    subject: `🍺 Road to ${goal} pintes — Récap semaine ${weekLabel}`,
    html,
  })

  if (error) {
    console.error('Erreur Resend:', error)
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
  }

  return NextResponse.json({ message: `Newsletter envoyée à ${emails.length} membres`, weekCount, totalCount })
}

function buildRanking(posts: { pseudo: string }[]) {
  const counts: Record<string, number> = {}
  for (const p of posts) counts[p.pseudo] = (counts[p.pseudo] || 0) + 1
  return Object.entries(counts).map(([pseudo, count]) => ({ pseudo, count })).sort((a, b) => b.count - a.count)
}