'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface Post {
  id: string
  pseudo: string
  location: string
  photo_url: string
  pint_number: number
  created_at: string
  voteCount: number
}

interface PinteDuMoisProps {
  pseudo: string
}

export default function PinteDuMois({ pseudo }: PinteDuMoisProps) {
  const [winner, setWinner] = useState<Post | null>(null)
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [myVote, setMyVote] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)

  const month = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  useEffect(() => {
    fetch('/api/votes')
      .then(r => r.json())
      .then(d => {
        setWinner(d.winner)
        setVotes(d.votes || {})
        setMyVote(d.myVote)
        setLoading(false)
      })
  }, [])

  async function vote(postId: string) {
    if (voting) return
    setVoting(true)
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId }),
    })
    if (res.ok) {
      setMyVote(postId)
      setVotes(prev => {
        const next = { ...prev }
        if (myVote) next[myVote] = Math.max(0, (next[myVote] || 1) - 1)
        next[postId] = (next[postId] || 0) + 1
        return next
      })
      // Rafraîchir le gagnant
      const data = await fetch('/api/votes').then(r => r.json())
      setWinner(data.winner)
    }
    setVoting(false)
  }

  if (loading) {
    return <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 h-32 animate-pulse" />
  }

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden border border-amber-800/40">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">🏆 Pinte du mois</h2>
          <p className="text-gray-500 text-sm capitalize">{month}</p>
        </div>
        {myVote && (
          <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">
            Tu as voté ✓
          </span>
        )}
      </div>

      {winner ? (
        <div>
          {/* Photo gagnante */}
          <div className="relative aspect-video">
            <Image
              src={winner.photo_url}
              alt={`Pinte #${winner.pint_number}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 672px"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-amber-400 font-black text-xl">Pinte #{winner.pint_number}</p>
              <p className="text-white font-bold">{winner.pseudo} · 📍 {winner.location}</p>
              <p className="text-gray-400 text-xs mt-1">{formatDate(winner.created_at)}</p>
            </div>
            <div className="absolute top-3 right-3 bg-amber-500 text-black font-black text-sm px-3 py-1 rounded-full">
              {winner.voteCount} vote{winner.voteCount > 1 ? 's' : ''}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 flex items-center justify-between">
            <p className="text-gray-500 text-sm">
              {myVote === winner.id ? 'Tu votes pour cette pinte 🎉' : 'Vote pour ta pinte préférée du mois'}
            </p>
            <button
              onClick={() => vote(winner.id)}
              disabled={voting || myVote === winner.id}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                myVote === winner.id
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-default'
                  : 'text-black hover:opacity-90 disabled:opacity-50'
              }`}
              style={myVote !== winner.id ? { background: 'linear-gradient(90deg, #d97706, #f59e0b)' } : {}}
            >
              {myVote === winner.id ? '✓ Voté' : '🏆 Voter'}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center">
          <div className="text-4xl mb-3">🍺</div>
          <p className="text-gray-500">Aucun vote ce mois-ci encore.</p>
          <p className="text-gray-600 text-sm mt-1">Vote pour ta pinte préférée depuis le feed !</p>
        </div>
      )}
    </div>
  )
}