'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'

interface Comment {
  id: string
  pseudo: string
  content: string
  created_at: string
}

interface CommentsProps {
  postId: string
  pseudo: string
}

export default function Comments({ postId, pseudo }: CommentsProps) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loaded, setLoaded] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  async function load() {
    if (loaded) return
    const res = await fetch(`/api/comments?post_id=${postId}`)
    const data = await res.json()
    setComments(data.comments || [])
    setLoaded(true)
  }

  function toggle() {
    if (!open) load()
    setOpen(o => !o)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, content: input.trim() }),
    })
    const data = await res.json()
    setSending(false)

    if (res.ok) {
      setComments(prev => [...prev, data.comment])
      setInput('')
    }
  }

  return (
    <div className="border-t border-gray-800">
      {/* Toggle */}
      <button
        onClick={toggle}
        className="w-full px-4 py-2 text-left text-gray-500 text-sm hover:text-gray-300 transition-colors flex items-center gap-2"
      >
        <span>💬</span>
        <span>
          {comments.length > 0 || loaded
            ? `${comments.length} commentaire${comments.length > 1 ? 's' : ''}`
            : 'Commenter'}
        </span>
        <span className="ml-auto">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Liste des commentaires */}
          {comments.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <span className="text-amber-400 font-bold text-sm shrink-0">{c.pseudo}</span>
                  <span className="text-gray-300 text-sm break-words">{c.content}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">Aucun commentaire. Sois le premier !</p>
          )}

          {/* Formulaire */}
          <form onSubmit={submit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ton commentaire..."
              maxLength={300}
              className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-amber-500 focus:outline-none placeholder-gray-600"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="px-3 py-2 rounded-lg text-black font-bold text-sm disabled:opacity-40"
              style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }}
            >
              {sending ? '...' : '→'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}