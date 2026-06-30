'use client'

import Image from 'next/image'
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
}

export default function PostCard({ post, pseudo }: PostCardProps) {
  const isMilestone = post.is_milestone

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