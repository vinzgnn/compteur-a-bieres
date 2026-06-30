'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

interface PostFormProps {
  pseudo: string
  onSuccess: () => void
}

function normalizeLocation(input: string): string {
  return input.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function useAutocomplete(type: 'bar' | 'city') {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [show, setShow] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 1) { setSuggestions([]); setShow(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/locations?q=${encodeURIComponent(q)}&type=${type}`)
        const data = await res.json()
        const list = data.locations || []
        setSuggestions(list)
        setShow(list.length > 0)
      } catch { setSuggestions([]) }
    }, 300)
  }, [type])

  const hide = () => setShow(false)

  return { suggestions, show, search, hide, setShow }
}

export default function PostForm({ pseudo, onSuccess }: PostFormProps) {
  const [open, setOpen] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [barName, setBarName] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const bar = useAutocomplete('bar')
  const cityAc = useAutocomplete('city')

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  function handleClose() {
    setOpen(false)
    setPhoto(null)
    setPreview(null)
    setBarName('')
    setCity('')
    setError('')
    bar.hide()
    cityAc.hide()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!photo || !barName.trim() || !city.trim()) {
      setError('Photo, nom du bar et ville requis')
      return
    }
    setLoading(true)
    setError('')

    const normalizedBar = normalizeLocation(barName)
    const normalizedCity = normalizeLocation(city)
    const location = `${normalizedBar}, ${normalizedCity}`

    const formData = new FormData()
    formData.append('photo', photo)
    formData.append('location', location)
    formData.append('bar_name', normalizedBar)
    formData.append('city', normalizedCity)

    try {
      const res = await fetch('/api/posts', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erreur'); return }
      handleClose()
      onSuccess()
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-amber-600 text-amber-400 font-bold text-lg active:bg-amber-900/20 hover:bg-amber-900/20 transition-colors flex items-center justify-center gap-2"
      >
        <span>🍺</span> Poster une pinte
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

          <div
            className="relative w-full sm:max-w-md bg-gray-900 rounded-t-3xl sm:rounded-2xl border border-gray-800 border-b-0 sm:border-b"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-700 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="text-white font-bold text-lg">Nouvelle pinte 🍺</h2>
              <button onClick={handleClose} className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
              {/* Photo */}
              {preview ? (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                  <Image src={preview} alt="Aperçu" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPreview(null) }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
                  >✕</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => cameraRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-gray-800 border border-gray-700 active:bg-gray-700 transition-colors">
                    <span className="text-3xl">📷</span>
                    <span className="text-sm text-gray-300 font-medium">Prendre une photo</span>
                  </button>
                  <button type="button" onClick={() => galleryRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-gray-800 border border-gray-700 active:bg-gray-700 transition-colors">
                    <span className="text-3xl">🖼️</span>
                    <span className="text-sm text-gray-300 font-medium">Galerie</span>
                  </button>
                </div>
              )}

              <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
              <input ref={galleryRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />

              {/* Nom du bar */}
              <div className="relative">
                <input
                  type="text"
                  value={barName}
                  onChange={e => { setBarName(e.target.value); bar.search(e.target.value) }}
                  onBlur={() => setTimeout(() => bar.hide(), 150)}
                  placeholder="🍺 Nom du bar (ex: Bar le RDV)"
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-amber-500 focus:outline-none placeholder-gray-500"
                  autoComplete="off"
                  required
                />
                {bar.show && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-10 shadow-xl">
                    {bar.suggestions.map((s, i) => (
                      <button key={i} type="button"
                        onMouseDown={() => { setBarName(s); bar.hide() }}
                        onTouchStart={() => { setBarName(s); bar.hide() }}
                        className="w-full text-left px-4 py-3 text-white text-sm hover:bg-gray-700 active:bg-gray-600 flex items-center gap-2 border-b border-gray-700/50 last:border-0">
                        <span className="text-gray-400">🍺</span>{s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Ville */}
              <div className="relative">
                <input
                  type="text"
                  value={city}
                  onChange={e => { setCity(e.target.value); cityAc.search(e.target.value) }}
                  onBlur={() => setTimeout(() => cityAc.hide(), 150)}
                  placeholder="📍 Ville (ex: Versailles)"
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-amber-500 focus:outline-none placeholder-gray-500"
                  autoComplete="off"
                  required
                />
                {cityAc.show && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-10 shadow-xl">
                    {cityAc.suggestions.map((s, i) => (
                      <button key={i} type="button"
                        onMouseDown={() => { setCity(s); cityAc.hide() }}
                        onTouchStart={() => { setCity(s); cityAc.hide() }}
                        className="w-full text-left px-4 py-3 text-white text-sm hover:bg-gray-700 active:bg-gray-600 flex items-center gap-2 border-b border-gray-700/50 last:border-0">
                        <span className="text-gray-400">📍</span>{s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || !photo || !barName.trim() || !city.trim()}
                className="w-full py-4 rounded-xl font-bold text-black text-base disabled:opacity-40"
                style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }}
              >
                {loading ? 'Envoi en cours...' : '🍺 Poster la pinte'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}