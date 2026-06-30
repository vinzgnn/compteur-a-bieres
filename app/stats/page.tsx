import { redirect } from 'next/navigation'
import { getPseudo } from '@/lib/auth'
import Navigation from '@/components/Navigation'
import StatsClient from '@/components/StatsClient'

export default async function StatsPage() {
  const pseudo = await getPseudo()
  if (!pseudo) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-950 pb-24 sm:pb-8">
      <Navigation pseudo={pseudo} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">Stats 📊</h1>
          <p className="text-gray-500 text-sm mt-1">Les chiffres qui font peur</p>
        </div>

        <StatsClient currentPseudo={pseudo} />
      </main>
    </div>
  )
}