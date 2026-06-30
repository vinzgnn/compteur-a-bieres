'use client'

import Image from 'next/image'
import { formatDate } from '@/lib/utils'
import ReactionBar from '@/components/ReactionBar'
import Comments from '@/components/Comments'

interface Post {
  id: string
  pseudo: string
  location: string
  photo_url: string
  pint_number: number
  is_milestone: boolean
  created_at: string
}

interface PostCardProps {
  post: Post
  pseudo: string
}

const MILESTONE_LABELS: Record<number, string> = {
  50:   "50 pintes 🚀",
  100:  "Le centenaire 🍺",
  250:  "Le quart 💪",
  500:  "La moitié 🏅",
  1000: "4 chiffres 🔥",
  2000: "Les légendes 🏆",
  5000: "OBJECTIF ! 🎉",
}

export default function PostCard({ post, pseudo }: PostCardProps) {
  if (post.is_milestone) {
    return (
      <div className="col-span-1 sm:col-span-2 rounded-2xl overflow-hidden border-2 border-amber-400"
        style={{ background: 'linear-gradient(135deg, #78350f, #1c1c2e)' }}>
        {/* Badge palier */}
        <div className="text-center py-3"
          style={{ background: 'linear-gradient(90deg, #92400e, #d97706, #92400e)' }}>
          <span className="text-white font-black text-sm tracking-widest uppercase">
            🎉 Palier #{post.pint_number} — {MILESTONE_LABELS[post.pint_number] || `#${post.pint_number}`}
          </span>
        </div>

        {/* Photo */}
        <div className="relative aspect-video">
          <Image
            src={post.photo_url}
            alt={`Palier #${post.pint_number}`}
            fill
            className="object-cover opacity-80"
            sizes="(max-width: 640px) 100vw, 66vw"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-amber-400 font-black text-2xl">#{post.pint_number}</p>
            <p className="text-white font-bold text-lg">{post.pseudo}</p>
            <p className="text-gray-300 text-sm">📍 {post.location}</p>
            <p className="text-gray-500 text-xs mt-1">{formatDate(post.created_at)}</p>
          </div>
        </div>

        <ReactionBar postId={post.id} pseudo={pseudo} />
        <Comments postId={post.id} pseudo={pseudo} />
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-amber-800/50 transition-colors">
      {/* Photo */}
      <div className="relative aspect-square">
        <Image
          src={post.photo_url}
          alt={`Pinte #${post.pint_number} par ${post.pseudo}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3 bg-amber-500 text-black text-xs font-black px-2 py-1 rounded-full">
          #{post.pint_number}
        </div>
      </div>

      {/* Infos */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-white">{post.pseudo}</span>
          <span className="text-amber-400 text-sm">🍺 Pinte #{post.pint_number}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400 text-sm mb-1">
          <span>📍</span>
          <span>{post.location}</span>
        </div>
        <p className="text-gray-600 text-xs">{formatDate(post.created_at)}</p>
      </div>

      <ReactionBar postId={post.id} pseudo={pseudo} />
      <Comments postId={post.id} pseudo={pseudo} />
    </div>
  )
}