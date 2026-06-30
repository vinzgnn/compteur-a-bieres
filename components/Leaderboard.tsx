'use client'

import { useState, useEffect } from 'react'

interface RankEntry {
  pseudo: string
  count: number
}

const MEDALS = ['🥇', '🥈', '🥉']
const COLORS = ['text-yellow-400', 'text-gray-300', 'text-amber-600']

type PeriodType = 'day' | 'week' | 'all'

const TABS: { value: PeriodType; label: string }[] = [
  { value: 'day',  label: 'Aujourd\'hui' },
  { value: 'week', label: 'Cette semaine' },
  { value: 'all',  label: 'Global' },
]

export default function Leaderboard() {
  const [type, setType] = useState<PeriodType>('week')
  const [ranking, setRanking] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leaderboard?type=${type}`)
      .then(r => r.json())
      .then(data => { setRanking(data.ranking || []); setLoading(false) })
  }, [type])

  const maxCount = ranking[0]?.count || 1

  const emptyMessages: Record<PeriodType, string> = {
    day:  'Personne n\'a encore posté aujourd\'hui 😴',
    week: 'Personne n\'a encore posté cette semaine 😴',
    all:  'Aucune pinte enregistrée 😴',
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      {/* Onglets */}
      <div className="flex bg-gray-800 rounded-xl p-1 gap-1 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setType(tab.value)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              type === tab.value
                ? 'bg-amber-500 text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : ranking.length === 0 ? (
        <p className="text-gray-500 text-center py-4">{emptyMessages[type]}</p>
      ) : (
        <div className="space-y-2">
          {ranking.map((entry, i) => (
            <div key={entry.pseudo} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50">
              <span className={`text-xl ${COLORS[i] || 'text-gray-500'} w-8 text-center`}>
                {MEDALS[i] || `${i + 1}`}
              </span>
              <span className="flex-1 font-medium text-white">{entry.pseudo}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden hidden sm:block">
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