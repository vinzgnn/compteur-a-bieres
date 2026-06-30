'use client'

import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface Post {
  id: string
  pseudo: string
  location: string
  photo_url: string
  pint_number: number
  created_at: string
}

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
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
        {/* Badge numéro de pinte */}
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
    </div>
  )
}
