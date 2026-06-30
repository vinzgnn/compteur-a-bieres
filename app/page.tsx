import { redirect } from 'next/navigation'
import { getPseudo } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase-server'
import FeedClient from '@/components/FeedClient'
import Navigation from '@/components/Navigation'
import Counter from '@/components/Counter'

export const revalidate = 0

export default async function HomePage() {
  const pseudo = await getPseudo()
  if (!pseudo) redirect('/login')

  const supabase = createServerSupabase()
  const goal = parseInt(process.env.NEXT_PUBLIC_GOAL || '5000')

  // Nombre total de posts
  const { count: total } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })

  // Premiers posts pour le SSR
  const { data: initialPosts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(0, 19)

  return (
    <div className="min-h-screen bg-gray-950 pb-24 sm:pb-8">
      <Navigation pseudo={pseudo} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">Road to 5000 pintes 🍺</h1>
        </div>

        {/* Compteur */}
        <Counter total={total || 0} goal={goal} />

        {/* Feed avec formulaire */}
        <FeedClient pseudo={pseudo} initialPosts={initialPosts || []} initialTotal={total || 0} />
      </main>
    </div>
  )
}
