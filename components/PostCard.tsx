'use client'

import Image from 'next/image'
import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import ReactionBar from '@/components/ReactionBar'
import Comments from '@/components/Comments'

interface Post {
  id: string
  pseudo: string
  bar_name: string
  city: string
  photo_url: string
  pint_number: number
  created_at: string
  is_milestone: boolean
}

interface PostCardProps {
  post: Post
  pseudo: string
  onDelete?: (id: string) => void
}

export default function PostCard({ post, pseudo, onDelete }: PostCardProps) {
  const isMilestone = post.is_milestone
  const isOwner = post.pseudo === pseudo
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      if (res.ok) onDelete?.(post.id)
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className={`rounded-2xl overflow-hidden transition-colors ${
      isMilestone
        ? 'border-2 border-amber-500 shadow-lg shadow-amber-500/20'
        : 'border border-gray-800 hover:border-amber-800/50 bg-gray-900'
    }`}
      style={isMilestone ? { background: 'linear-gradient(135deg, #1c1008, #111827)' } : {}}
    >
      {/* Badge milestone */}
      {isMilestone && (
        <div className="px-4 py-2 text-center"
          style={{ background: 'linear-gradient(90deg, #92400e, #d97706)' }}>
          <span className="text-white font-black text-sm tracking-wider">🎉 PALIER #{post.pint_number} ATTEINT !</span>
        </div>
      )}

      {/* Photo */}
      <div className="relative aspect-square">
        <Image
          src={post.photo_url}
          alt={`Pinte #${post.pint_number} par ${post.pseudo}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 672px"
        />
        <div className={`absolute top-3 left-3 text-black text-xs font-black px-2 py-1 rounded-full ${
          isMilestone ? 'bg-amber-400' : 'bg-amber-500'
        }`}>
          #{post.pint_number}
        </div>

        {/* Bouton supprimer — visible uniquement pour le propriétaire */}
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              confirmDelete
                ? 'bg-red-600 text-white'
                : 'bg-black/60 text-gray-300 hover:bg-red-600 hover:text-white'
            }`}
          >
            {deleting ? '...' : confirmDelete ? 'Confirmer ?' : '🗑️'}
          </button>
        )}
      </div>

      {/* Infos */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-white">{post.pseudo}</span>
          <span className="text-amber-400 text-sm">🍺 Pinte #{post.pint_number}</span>
        </div>
        <div className="flex items-center gap-2 text-sm mb-1">
          <span className="text-white font-medium">🍺 {post.bar_name}</span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-400">📍 {post.city}</span>
        </div>
        <p className="text-gray-600 text-xs">{formatDate(post.created_at)}</p>
      </div>

      {/* Réactions */}
      <ReactionBar postId={post.id} pseudo={pseudo} />

      {/* Commentaires */}
      <Comments postId={post.id} pseudo={pseudo} />
    </div>
  )
}