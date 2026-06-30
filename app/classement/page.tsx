import { redirect } from 'next/navigation'
import { getPseudo } from '@/lib/auth'
import Navigation from '@/components/Navigation'
import Leaderboard from '@/components/Leaderboard'

export default async function ClassementPage() {
  const pseudo = await getPseudo()
  if (!pseudo) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-950 pb-24 sm:pb-8">
      <Navigation pseudo={pseudo} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">Classement 🏆</h1>
          <p className="text-gray-500 text-sm mt-1">Qui boit le plus ?</p>
        </div>

        {/* Classement hebdo */}
        <div>
          <h2 className="text-amber-400 font-bold mb-3 text-sm uppercase tracking-wider">Cette semaine</h2>
          <Leaderboard defaultType="week" />
        </div>

        {/* Classement global */}
        <div>
          <h2 className="text-amber-400 font-bold mb-3 text-sm uppercase tracking-wider">All-time</h2>
          <Leaderboard defaultType="all" />
        </div>
      </main>
    </div>
  )
}
