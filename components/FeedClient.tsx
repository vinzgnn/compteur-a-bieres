'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PostCard from '@/components/PostCard'
import PostForm from '@/components/PostForm'
import Counter from '@/components/Counter'

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

interface FeedClientProps {
  pseudo: string
  initialPosts: Post[]
  initialTotal: number
}

export default function FeedClient({ pseudo, initialPosts, initialTotal }: FeedClientProps) {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [total, setTotal] = useState(initialTotal)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(initialPosts.length === 20)

  const refreshFeed = useCallback(async () => {
    const res = await fetch('/api/posts?page=0')
    const data = await res.json()
    setPosts(data.posts || [])
    setTotal(data.total || 0)
    setPage(0)
    setHasMore((data.posts || []).length === 20)
    router.refresh()
  }, [router])

  const loadMore = useCallback(async () => {
    if (loadingMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    const res = await fetch(`/api/posts?page=${nextPage}`)
    const data = await res.json()
    const newPosts = data.posts || []
    setPosts(prev => [...prev, ...newPosts])
    setPage(nextPage)
    setHasMore(newPosts.length === 20)
    setLoadingMore(false)
  }, [page, loadingMore])

  return (
    <>
      <PostForm pseudo={pseudo} onSuccess={refreshFeed} />

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🍺</div>
            <p className="text-gray-500">Soyez les premiers à poster une pinte !</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {posts.map(post => (
                <PostCard key={post.id} post={post} pseudo={pseudo} />
              ))}
            </div>

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm disabled:opacity-50"
              >
                {loadingMore ? 'Chargement...' : 'Charger plus'}
              </button>
            )}
          </>
        )}
      </div>
    </>
  )
}