'use client'

import { useState, useEffect } from 'react'

interface StatsData {
  todayCount: number
  todayRange: { start: string; end: string }
  pseudos: string[]
  avgTimeBetween: Record<string, number | null>
  hourlyDistribution: Record<string, number>
  peakHour: number
  totalPosts: number
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}h`
}

export default function StatsClient({ currentPseudo }: { currentPseudo: string }) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/stats?pseudo=${filter}`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filter])

  if (loading || !stats) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-900 rounded-2xl h-32 animate-pulse border border-gray-800" />
        ))}
      </div>
    )
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const maxHourCount = Math.max(...hours.map(h => stats.hourlyDistribution[h] || 0), 1)

  // Heures affichées : uniquement celles avec au moins 1 pinte + voisines
  const activeHours = hours.filter(h => (stats.hourlyDistribution[h] || 0) > 0)
  const displayHours = activeHours.length > 0 ? hours.filter(h => {
    return activeHours.some(ah => Math.abs(ah - h) <= 1)
  }) : hours

  // Temps moyen global
  const allAvgValues = Object.values(stats.avgTimeBetween).filter((v): v is number => v !== null)
  const globalAvg = allAvgValues.length > 0
    ? Math.round(allAvgValues.reduce((a, b) => a + b, 0) / allAvgValues.length)
    : null

  const dayStart = new Date(stats.todayRange.start)
  const dayEnd = new Date(stats.todayRange.end)
  const dayLabel = dayStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  return (
    <div className="space-y-6">
      {/* Filtre */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            filter === 'all'
              ? 'bg-amber-500 text-black'
              : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
          }`}
        >
          Tout le groupe
        </button>
        {stats.pseudos.map(p => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              filter === p
                ? 'bg-amber-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Pintes du jour */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Pintes du jour</p>
        <p className="text-amber-400 text-xs mb-3">
          {dayStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} 12h →{' '}
          {dayEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} 12h
        </p>
        <div className="flex items-end gap-3">
          <span className="text-5xl font-black text-white">{stats.todayCount}</span>
          <span className="text-gray-500 text-lg mb-1">pinte{stats.todayCount > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Temps moyen entre 2 pintes */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-4">⏱ Temps moyen entre 2 pintes</p>

        {filter === 'all' ? (
          <div className="space-y-3">
            {Object.entries(stats.avgTimeBetween)
              .filter(([, v]) => v !== null)
              .sort(([, a], [, b]) => (a as number) - (b as number))
              .map(([pseudo, avg]) => (
                <div key={pseudo} className="flex items-center gap-3">
                  <span className="text-amber-400 font-bold w-20 shrink-0 text-sm">{pseudo}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, ((avg as number) / 10080) * 100)}%`,
                        background: 'linear-gradient(90deg, #d97706, #f59e0b)',
                      }}
                    />
                  </div>
                  <span className="text-white text-sm font-bold w-16 text-right shrink-0">
                    {formatDuration(avg)}
                  </span>
                </div>
              ))}
            {Object.values(stats.avgTimeBetween).every(v => v === null) && (
              <p className="text-gray-600 text-sm">Pas encore assez de données.</p>
            )}
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <span className="text-5xl font-black text-white">
              {formatDuration(stats.avgTimeBetween[filter] ?? null)}
            </span>
          </div>
        )}
      </div>

      {/* Distribution horaire */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider">🕐 Distribution horaire</p>
          <span className="text-amber-400 text-sm font-bold">
            Pic : {formatHour(stats.peakHour)}
          </span>
        </div>

        {stats.totalPosts === 0 ? (
          <p className="text-gray-600 text-sm">Pas encore de données.</p>
        ) : (
          <div className="flex items-end gap-0.5 h-24">
            {hours.map(h => {
              const count = stats.hourlyDistribution[h] || 0
              const heightPct = maxHourCount > 0 ? (count / maxHourCount) * 100 : 0
              const isPeak = h === stats.peakHour && count > 0
              return (
                <div key={h} className="flex-1 flex flex-col items-center gap-0.5" title={`${formatHour(h)} : ${count} pinte${count > 1 ? 's' : ''}`}>
                  <div className="w-full flex items-end" style={{ height: '80px' }}>
                    <div
                      className="w-full rounded-sm transition-all"
                      style={{
                        height: `${Math.max(heightPct, count > 0 ? 4 : 0)}%`,
                        background: isPeak
                          ? 'linear-gradient(to top, #d97706, #fbbf24)'
                          : count > 0
                          ? '#374151'
                          : 'transparent',
                      }}
                    />
                  </div>
                  {(h % 3 === 0) && (
                    <span className="text-gray-600 text-[9px]">{formatHour(h)}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Total */}
      <p className="text-center text-gray-600 text-xs">
        {stats.totalPosts} pinte{stats.totalPosts > 1 ? 's' : ''} au total
        {filter !== 'all' ? ` pour ${filter}` : ' dans le groupe'}
      </p>
    </div>
  )
}