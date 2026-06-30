'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

interface PostFormProps {
  pseudo: string
  onSuccess: (isMilestone: boolean) => void
}

function normalizeLocation(input: string): string {
  return input.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

// Compression image via Canvas (max 1200px, qualité 85%)
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const MAX_WIDTH = 1200
    const QUALITY = 0.85
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width)
        width = MAX_WIDTH
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          } else {
            resolve(file) // fallback sans compression
          }
        },
        'image/jpeg',
        QUALITY
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

interface LocationResult {
  locations: string[]
  cityByBar: Record<string, string>
}

export default function PostForm({ pseudo, onSuccess }: PostFormProps) {
  const [open, setOpen] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)
  const [originalSize, setOriginalSize] = useState<number | null>(null)
  const [compressedSize, setCompressedSize] = useState<number | null>(null)
  const [barName, setBarName] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [barSuggestions, setBarSuggestions] = useState<string[]>([])
  const [cityByBar, setCityByBar] = useState<Record<string, string>>({})
  const [showBarSuggestions, setShowBarSuggestions] = useState(false)
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)

  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const barDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cityDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function fetchLocations(q: string, type: 'bar' | 'city'): Promise<LocationResult> {
    const res = await fetch(`/api/locations?q=${encodeURIComponent(q)}&type=${type}`)
    return res.json()
  }

  function searchBars(q: string) {
    if (barDebounce.current) clearTimeout(barDebounce.current)
    barDebounce.current = setTimeout(async () => {
      try {
        const data = await fetchLocations(q, 'bar')
        setBarSuggestions(data.locations || [])
        setCityByBar(data.cityByBar || {})
        setShowBarSuggestions(true)
      } catch { setBarSuggestions([]) }
    }, q ? 300 : 0)
  }

  function searchCities(q: string) {
    if (cityDebounce.current) clearTimeout(cityDebounce.current)
    cityDebounce.current = setTimeout(async () => {
      try {
        const data = await fetchLocations(q, 'city')
        setCitySuggestions(data.locations || [])
        setShowCitySuggestions(true)
      } catch { setCitySuggestions([]) }
    }, q ? 300 : 0)
  }

  function selectBar(bar: string) {
    setBarName(bar)
    setShowBarSuggestions(false)
    const knownCity = cityByBar[bar]
    if (knownCity && !city) setCity(knownCity)
  }

  function isExactMatch(input: string, suggestions: string[]): boolean {
    return suggestions.some(s => s.toLowerCase() === input.toLowerCase().trim())
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setOriginalSize(file.size)
    setCompressing(true)
    setPreview(URL.createObjectURL(file))

    const compressed = await compressImage(file)
    setCompressedSize(compressed.size)
    setPhoto(compressed)
    setCompressing(false)
  }

  function handleClose() {
    setOpen(false)
    setPhoto(null)
    setPreview(null)
    setBarName('')
    setCity('')
    setError('')
    setOriginalSize(null)
    setCompressedSize(null)
    setShowBarSuggestions(false)
    setShowCitySuggestions(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!photo || !barName.trim() || !city.trim()) {
      setError('Photo, nom du bar et ville requis')
      return
    }
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('photo', photo)
    formData.append('bar_name', normalizeLocation(barName))
    formData.append('city', normalizeLocation(city))

    try {
      const res = await fetch('/api/posts', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erreur'); return }
      handleClose()
      onSuccess(json.isMilestone === true)
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  function formatSize(bytes: number) {
    return bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} Mo`
      : `${Math.round(bytes / 1024)} Ko`
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
                <div className="space-y-1">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                    <Image src={preview} alt="Aperçu" fill className="object-cover" />
                    {compressing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">Compression...</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => { setPhoto(null); setPreview(null); setOriginalSize(null); setCompressedSize(null) }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
                    >✕</button>
                  </div>
                  {/* Info compression */}
                  {originalSize && compressedSize && !compressing && (
                    <p className="text-gray-500 text-xs text-center">
                      {formatSize(originalSize)} → {formatSize(compressedSize)}
                      {compressedSize < originalSize && (
                        <span className="text-green-500 ml-1">
                          (-{Math.round((1 - compressedSize / originalSize) * 100)}%)
                        </span>
                      )}
                    </p>
                  )}
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

              {/* Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={barName}
                  onChange={e => { setBarName(e.target.value); searchBars(e.target.value) }}
                  onFocus={() => searchBars(barName)}
                  onBlur={() => setTimeout(() => setShowBarSuggestions(false), 150)}
                  placeholder="🍺 Nom du bar (ex: Bar le RDV)"
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-amber-500 focus:outline-none placeholder-gray-500"
                  autoComplete="off" required
                />
                {showBarSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-10 shadow-xl">
                    {barSuggestions.map((s, i) => (
                      <button key={i} type="button"
                        onMouseDown={() => selectBar(s)} onTouchStart={() => selectBar(s)}
                        className="w-full text-left px-4 py-3 text-white text-sm hover:bg-gray-700 flex items-center gap-2 border-b border-gray-700/50 last:border-0">
                        <span className="text-gray-400">🍺</span>
                        <span className="flex-1">{s}</span>
                        {cityByBar[s] && <span className="text-gray-500 text-xs">📍 {cityByBar[s]}</span>}
                      </button>
                    ))}
                    {barName.trim().length > 0 && !isExactMatch(barName, barSuggestions) && (
                      <button type="button"
                        onMouseDown={() => setShowBarSuggestions(false)} onTouchStart={() => setShowBarSuggestions(false)}
                        className="w-full text-left px-4 py-3 text-amber-400 text-sm hover:bg-gray-700 flex items-center gap-2 border-t border-gray-700">
                        <span>➕</span><span>Ajouter <strong>"{normalizeLocation(barName)}"</strong></span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Ville */}
              <div className="relative">
                <input
                  type="text"
                  value={city}
                  onChange={e => { setCity(e.target.value); searchCities(e.target.value) }}
                  onFocus={() => searchCities(city)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
                  placeholder="📍 Ville (ex: Versailles)"
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-amber-500 focus:outline-none placeholder-gray-500"
                  autoComplete="off" required
                />
                {showCitySuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-10 shadow-xl">
                    {citySuggestions.map((s, i) => (
                      <button key={i} type="button"
                        onMouseDown={() => { setCity(s); setShowCitySuggestions(false) }} onTouchStart={() => { setCity(s); setShowCitySuggestions(false) }}
                        className="w-full text-left px-4 py-3 text-white text-sm hover:bg-gray-700 flex items-center gap-2 border-b border-gray-700/50 last:border-0">
                        <span className="text-gray-400">📍</span>{s}
                      </button>
                    ))}
                    {city.trim().length > 0 && !isExactMatch(city, citySuggestions) && (
                      <button type="button"
                        onMouseDown={() => setShowCitySuggestions(false)} onTouchStart={() => setShowCitySuggestions(false)}
                        className="w-full text-left px-4 py-3 text-amber-400 text-sm hover:bg-gray-700 flex items-center gap-2 border-t border-gray-700">
                        <span>➕</span><span>Ajouter <strong>"{normalizeLocation(city)}"</strong></span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || compressing || !photo || !barName.trim() || !city.trim()}
                className="w-full py-4 rounded-xl font-bold text-black text-base disabled:opacity-40"
                style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }}
              >
                {loading ? 'Envoi en cours...' : compressing ? 'Compression...' : '🍺 Poster la pinte'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}