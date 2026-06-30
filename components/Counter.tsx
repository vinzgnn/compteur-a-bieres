'use client'

import { useEffect, useRef } from 'react'

interface CounterProps {
  total: number
  goal: number
}

export default function Counter({ total, goal }: CounterProps) {
  const progressPct = Math.min(100, (total / goal) * 100)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (barRef.current) {
      setTimeout(() => {
        if (barRef.current) barRef.current.style.width = `${progressPct}%`
      }, 100)
    }
  }, [progressPct])

  return (
    <div className="bg-gray-900 rounded-2xl p-8 text-center border border-amber-900/30">
      <p className="text-gray-500 text-sm uppercase tracking-widest mb-3">Compteur général</p>
      <div className="flex items-end justify-center gap-3 mb-6">
        <span className="text-7xl font-black text-amber-400">{total.toLocaleString('fr-FR')}</span>
        <span className="text-3xl text-gray-500 mb-3">/ {goal.toLocaleString('fr-FR')} 🍺</span>
      </div>
      {/* Barre de progression */}
      <div className="relative bg-gray-800 rounded-full h-5 overflow-hidden mb-3">
        <div
          ref={barRef}
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: '0%',
            background: 'linear-gradient(90deg, #92400e, #f59e0b)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow">
            {progressPct.toFixed(1)}%
          </span>
        </div>
      </div>
      <p className="text-gray-500 text-sm">
        {goal - total > 0
          ? `Plus que ${(goal - total).toLocaleString('fr-FR')} pintes pour atteindre l'objectif !`
          : '🎉 Objectif atteint ! Santé !'}
      </p>
    </div>
  )
}
