'use client'

import { useState, useEffect } from 'react'

const EMOJIS = ['🍺', '👏', '🔥']

interface Reaction {
  emoji: string
  pseudo: string
}

interface ReactionBarProps {
  postId: string
  pseudo: string
}

export default function ReactionBar({ postId, pseudo }: ReactionBarProps) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/reactions?post_id=${postId}`)
      .then(r => r.json())
      .then(d => setReactions(d.reactions || []))
      .catch(() => {})
  }, [postId])

  async function toggle(emoji: string) {
    if (loading) return
    setLoading(emoji)

    // Optimistic update
    const hasReacted = reactions.some(r => r.pseudo === pseudo && r.emoji === emoji)
    if (hasReacted) {
      setReactions(prev => prev.filter(r => !(r.pseudo === pseudo && r.emoji === emoji)))
    } else {
      setReactions(prev => [...prev, { emoji, pseudo }])
    }

    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, emoji }),
      })
    } catch {
      // Rollback en cas d'erreur
      if (hasReacted) {
        setReactions(prev => [...prev, { emoji, pseudo }])
      } else {
        setReactions(prev => prev.filter(r => !(r.pseudo === pseudo && r.emoji === emoji)))
      }
    } finally {
      setLoading(null)
    }
  }

  function getCount(emoji: string) {
    return reactions.filter(r => r.emoji === emoji).length
  }

  function hasReacted(emoji: string) {
    return reactions.some(r => r.pseudo === pseudo && r.emoji === emoji)
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-800">
      {EMOJIS.map(emoji => {
        const count = getCount(emoji)
        const reacted = hasReacted(emoji)
        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            disabled={loading === emoji}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
              reacted
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="font-bold">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}