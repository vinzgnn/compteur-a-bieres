'use client'

import { useState, useEffect } from 'react'

const BADGE_DEFINITIONS: Record<string, { label: string; emoji: string; desc: string }> = {
  premier_post: { label: "Premier post",  emoji: "🥇", desc: "Premier à avoir posté une pinte" },
  centenaire:   { label: "Centenaire",    emoji: "💯", desc: "A posté la 100ème pinte du groupe" },
  explorateur:  { label: "Explorateur",   emoji: "📍", desc: "Posté depuis 5 bars différents" },
  vendredi:     { label: "Vendredi",      emoji: "📅", desc: "A posté un vendredi" },
  assidu:       { label: "Assidu",        emoji: "🔥", desc: "A posté 3 semaines de suite" },
}

interface BadgeListProps {
  pseudo: string
  inline?: boolean
}

export default function BadgeList({ pseudo, inline = false }: BadgeListProps) {
  const [badges, setBadges] = useState<string[]>([])

  useEffect(() => {
    fetch(`/api/badges?pseudo=${encodeURIComponent(pseudo)}`)
      .then(r => r.json())
      .then(d => setBadges(d.badges || []))
  }, [pseudo])

  if (badges.length === 0) return null

  if (inline) {
    return (
      <span className="flex gap-1 flex-wrap">
        {badges.map(b => (
          <span key={b} title={BADGE_DEFINITIONS[b]?.desc} className="text-base cursor-default">
            {BADGE_DEFINITIONS[b]?.emoji}
          </span>
        ))}
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map(b => {
        const def = BADGE_DEFINITIONS[b]
        if (!def) return null
        return (
          <div key={b} className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2">
            <span className="text-xl">{def.emoji}</span>
            <div>
              <p className="text-white text-sm font-bold leading-none">{def.label}</p>
              <p className="text-gray-500 text-xs mt-0.5">{def.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}