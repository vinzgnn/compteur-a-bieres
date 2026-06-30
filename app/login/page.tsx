'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'code' | 'pseudo'>('code')
  const [inviteCode, setInviteCode] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setStep('pseudo')
  }

  async function handlePseudoSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode, pseudo, email }),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error || 'Erreur')
      if (res.status === 401) setStep('code')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">🍺</div>
          <h1 className="text-3xl font-black text-white mb-2">Road to 5000 pintes</h1>
          <p className="text-gray-500">Le compteur officiel du groupe</p>
        </div>

        {step === 'code' ? (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Code d'invitation</label>
              <input
                type="password"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="Entre le code secret 🤫"
                className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-amber-500 focus:outline-none placeholder-gray-600"
                autoFocus
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-black transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }}
            >
              Entrer →
            </button>
          </form>
        ) : (
          <form onSubmit={handlePseudoSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Ton pseudo</label>
              <input
                type="text"
                value={pseudo}
                onChange={e => setPseudo(e.target.value)}
                placeholder="Ex: Alex, Benoît, Toto..."
                className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-amber-500 focus:outline-none placeholder-gray-600"
                autoFocus
                minLength={2}
                required
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                Email <span className="text-gray-600">(optionnel — pour la newsletter hebdo)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ton@email.com"
                className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-amber-500 focus:outline-none placeholder-gray-600"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }}
            >
              {loading ? 'Connexion...' : '🍺 Rejoindre le groupe'}
            </button>
            <button
              type="button"
              onClick={() => setStep('code')}
              className="w-full py-2 text-gray-500 text-sm hover:text-gray-300"
            >
              ← Retour
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
