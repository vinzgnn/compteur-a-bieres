import { redirect } from 'next/navigation'
import Image from 'next/image'
import { getPseudo } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase-server'
import Navigation from '@/components/Navigation'
import BadgeList from '@/components/BadgeList'
import { formatDate } from '@/lib/utils'

export default async function ProfilPage({ params }: { params: { pseudo: string } }) {
  const currentPseudo = await getPseudo()
  if (!currentPseudo) redirect('/login')

  const pseudo = decodeURIComponent(params.pseudo)
  const supabase = createServerSupabase()

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('pseudo', pseudo)
    .order('created_at', { ascending: false })

  if (!posts) redirect('/')

  const total = posts.length
  const barSet = new Set(posts.map(p => p.bar_name).filter(Boolean))
  const citySet = new Set(posts.map(p => p.city).filter(Boolean))
  const milestones = posts.filter(p => p.is_milestone).length

  const barCounts: Record<string, number> = {}
  for (const p of posts) {
    if (p.bar_name) barCounts[p.bar_name] = (barCounts[p.bar_name] || 0) + 1
  }
  const topBar = Object.entries(barCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="min-h-screen bg-gray-950 pb-24 sm:pb-8">
      <Navigation pseudo={currentPseudo} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-3xl">
              🍺
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{pseudo}</h1>
              {currentPseudo === pseudo && (
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Ton profil
                </span>
              )}
            </div>
          </div>
          <BadgeList pseudo={pseudo} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { val: total, label: 'pinte' },
            { val: barSet.size, label: 'bar' },
            { val: citySet.size, label: 'ville' },
            { val: milestones, label: 'palier' },
          ].map(({ val, label }) => (
            <div key={label} className="bg-gray-900 rounded-2xl p-4 border border-gray-800 text-center">
              <p className="text-amber-400 text-3xl font-black">{val}</p>
              <p className="text-gray-500 text-xs mt-1">{label}{val > 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>

        {topBar && (
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">🏅 Bar favori</p>
            <p className="text-white font-black text-lg">{topBar[0]}</p>
            <p className="text-amber-400 text-sm mt-1">{topBar[1]} pinte{topBar[1] > 1 ? 's' : ''} ici</p>
          </div>
        )}

        {posts.length > 0 ? (
          <div>
            <h2 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-3">Ses pintes</h2>
            <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
              {posts.map(post => (
                <div key={post.id} className="relative aspect-square group">
                  <Image
                    src={post.photo_url}
                    alt={`Pinte #${post.pint_number}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 33vw, 224px"
                  />
                  {post.is_milestone && (
                    <div className="absolute inset-0 bg-amber-500/20 border-2 border-amber-500" />
                  )}
                  <div className="absolute bottom-1 left-1 bg-black/60 text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    #{post.pint_number}
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                    <p className="text-white text-xs font-bold text-center leading-tight">{post.bar_name}</p>
                    <p className="text-gray-300 text-[10px]">{formatDate(post.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🍺</div>
            <p className="text-gray-500">Aucune pinte postée pour l'instant</p>
          </div>
        )}
      </main>
    </div>
  )
}