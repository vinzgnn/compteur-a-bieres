'use client'
 
import { useState, useRef } from 'react'
import Image from 'next/image'
 
interface PostFormProps {
  pseudo: string
  onSuccess: () => void
}
 
export default function PostForm({ pseudo, onSuccess }: PostFormProps) {
  const [open, setOpen] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
 
  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }
 
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!photo || !location.trim()) {
      setError('Photo et lieu requis')
      return
    }
    setLoading(true)
    setError('')
 
    const formData = new FormData()
    formData.append('photo', photo)
    formData.append('location', location)
 
    const res = await fetch('/api/posts', { method: 'POST', body: formData })
    const json = await res.json()
 
    setLoading(false)
    if (!res.ok) {
      setError(json.error || 'Erreur')
      return
    }
    setPhoto(null)
    setPreview(null)
    setLocation('')
    setOpen(false)
    onSuccess()
  }
 
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-amber-600 text-amber-400 font-bold text-lg hover:bg-amber-900/20 transition-colors flex items-center justify-center gap-2"
      >
        <span>🍺</span> Poster une pinte
      </button>
    )
  }
 
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-amber-800/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">Nouvelle pinte, {pseudo} 🍺</h2>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">✕</button>
      </div>
 
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Inputs cachés */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
        <input ref={galleryRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
 
        {/* Zone photo */}
        {preview ? (
          <div
            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
            onClick={() => cameraRef.current?.click()}
          >
            <Image src={preview} alt="Aperçu" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <p className="text-white text-sm font-medium">Changer la photo</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="w-full py-5 rounded-xl font-bold text-black text-lg flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }}
            >
              📷 Prendre une photo
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="w-full py-4 rounded-xl font-bold text-white text-base bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              🖼️ Choisir depuis la galerie
            </button>
          </div>
        )}
 
        {/* Lieu */}
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="📍 Où es-tu ? (ex: Bar le RDV, Versailles)"
          className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-amber-500 focus:outline-none placeholder-gray-500"
          required
        />
 
        {error && <p className="text-red-400 text-sm">{error}</p>}
 
        <button
          type="submit"
          disabled={loading || !photo || !location.trim()}
          className="w-full py-3 rounded-xl font-bold text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }}
        >
          {loading ? 'Envoi...' : '🍺 Poster la pinte'}
        </button>
      </form>
    </div>
  )
}