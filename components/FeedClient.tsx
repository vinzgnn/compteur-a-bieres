'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PostCard from '@/components/PostCard'
import PostForm from '@/components/PostForm'
import { supabaseClient } from '@/lib/supabase-client'

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

// Confetti dynamique (évite l'import SSR)
async function fireConfetti(milestone = false) {
  const { default: confetti } = await import('canvas-confetti')
  if (milestone) {
    // Explosion depuis les deux côtés
    confetti({ particleCount: 120, spread: 70, origin: { x: 0.2, y: 0.6 }, colors: ['#f59e0b', '#d97706', '#fbbf24', '#fff'] })
    confetti({ particleCount: 120, spread: 70, origin: { x: 0.8, y: 0.6 }, colors: ['#f59e0b', '#d97706', '#fbbf24', '#fff'] })
  } else {
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 }, colors: ['#f59e0b', '#d97706', '#fbbf24'] })
  }
}

export default function FeedClient({ pseudo, initialPosts, initialTotal }: FeedClientProps) {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [total, setTotal] = useState(initialTotal)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(initialPosts.length === 20)
  const [newPostBanner, setNewPostBanner] = useState(false)
  const pendingNewPosts = useRef<Post[]>([])

  // Realtime — écoute les nouveaux posts
  useEffect(() => {
    const channel = supabaseClient
      .channel('posts-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const newPost = payload.new as Post
          // Si le post est du même utilisateur connecté → rafraîchissement immédiat (déjà fait par PostForm)
          // Sinon → bannière "Nouveau post"
          if (newPost.pseudo !== pseudo) {
            pendingNewPosts.current = [newPost, ...pendingNewPosts.current]
            setNewPostBanner(true)
            if (newPost.is_milestone) fireConfetti(true)
          }
        }
      )
      .subscribe()

    return () => { supabaseClient.removeChannel(channel) }
  }, [pseudo])

  // Afficher les posts en attente quand l'utilisateur clique sur la bannière
  function loadNewPosts() {
    setPosts(prev => [...pendingNewPosts.current, ...prev])
    setTotal(t => t + pendingNewPosts.current.length)
    pendingNewPosts.current = []
    setNewPostBanner(false)
  }

  // Callback PostForm → rafraîchit le feed et déclenche confetti
  const handlePostSuccess = useCallback(async (isMilestone: boolean) => {
    const res = await fetch('/api/posts?page=0')
    const data = await res.json()
    setPosts(data.posts || [])
    setTotal(data.total || 0)
    setPage(0)
    setHasMore((data.posts || []).length === 20)
    router.refresh()
    fireConfetti(isMilestone)
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

  function handleDelete(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
    setTotal(t => t - 1)
  }

  return (
    <>
      <PostForm pseudo={pseudo} onSuccess={handlePostSuccess} />

      {/* Bannière nouveaux posts (real-time) */}
      {newPostBanner && (
        <button
          onClick={loadNewPosts}
          className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400 text-sm font-bold hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
        >
          🍺 Nouveaux posts — Afficher
        </button>
      )}

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
                <PostCard
                  key={post.id}
                  post={post}
                  pseudo={pseudo}
                  onDelete={handleDelete}
                />
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