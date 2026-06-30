'use client'

import { useState, useEffect } from 'react'

interface RankEntry {
  pseudo: string
  count: number
}

interface LeaderboardProps {
  defaultType?: 'all' | 'week'
  compact?: boolean
}

const MEDALS = ['🥇', '🥈', '🥉']
const COLORS = ['text-yellow-400', 'text-gray-300', 'text-amber-600']

export default function Leaderboard({ defaultType = 'all', compact = false }: LeaderboardProps) {
  const [type, setType] = useState<'all' | 'week'>(defaultType)
  const [ranking, setRanking] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leaderboard?type=${type}`)
      .then(r => r.json())
      .then(data => { setRanking(data.ranking || []); setLoading(false) })
  }, [type])

  const maxCount = ranking[0]?.count || 1

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">🏆 Classement</h2>
        {!compact && (
          <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
            <button
              onClick={() => setType('all')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${type === 'all' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Global
            </button>
            <button
              onClick={() => setType('week')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${type === 'week' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Cette semaine
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : ranking.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Personne n'a encore posté cette semaine 😴</p>
      ) : (
        <div className="space-y-2">
          {(compact ? ranking.slice(0, 5) : ranking).map((entry, i) => (
            <div key={entry.pseudo} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50">
              <span className={`text-xl ${COLORS[i] || 'text-gray-500'} w-8 text-center`}>
                {MEDALS[i] || `${i + 1}`}
              </span>
              <span className="flex-1 font-medium text-white">{entry.pseudo}</span>
              <div className="flex items-center gap-2">
                {/* Barre mini */}
                <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden hidden sm:block">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${(entry.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-amber-400 font-bold text-sm w-16 text-right">
                  {entry.count} 🍺
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
