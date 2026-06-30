'use client'
 
import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
 
interface Bar {
  bar_name: string
  city: string
  count: number
}
 
interface GeoResult {
  lat: number
  lon: number
}
 
const GEO_CACHE_KEY = 'biere_geocache_v1'
 
function getGeoCache(): Record<string, GeoResult | null> {
  try { return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || '{}') } catch { return {} }
}
 
function setGeoCache(cache: Record<string, GeoResult | null>) {
  try { localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache)) } catch {}
}
 
// Géocode un bar via Nominatim (OpenStreetMap, gratuit, sans clé API)
// Essaie "bar + city", puis fallback sur "city" seul
async function geocode(bar_name: string, city: string): Promise<GeoResult | null> {
  const key = `${bar_name}|${city}`
  const cache = getGeoCache()
  if (key in cache) return cache[key]
 
  const tryFetch = async (q: string): Promise<GeoResult | null> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'BiereCounter/1.0 contact@example.com' } }
      )
      const data = await res.json()
      if (data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    } catch {}
    return null
  }
 
  let result = await tryFetch(`${bar_name}, ${city}, France`)
  // Délai de politesse Nominatim (max 1 req/s)
  await new Promise(r => setTimeout(r, 1100))
 
  if (!result) {
    result = await tryFetch(`${city}, France`)
    await new Promise(r => setTimeout(r, 1100))
  }
 
  cache[key] = result
  setGeoCache(cache)
  return result
}
 
export default function BarsMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(true)
  const [geocoding, setGeocoding] = useState(false)
  const [geocoded, setGeocoded] = useState(0)
 
  useEffect(() => {
    fetch('/api/bars')
      .then(r => r.json())
      .then(d => { setBars(d.bars || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])
 
  useEffect(() => {
    if (!mapRef.current || bars.length === 0 || mapInstance.current) return
 
    let cancelled = false
 
    async function initMap() {
      setGeocoding(true)
      const L = (await import('leaflet')).default
 
      // Fix icônes Leaflet (problème connu avec les bundlers)
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
 
      if (cancelled || !mapRef.current) return
 
      const map = L.map(mapRef.current, { zoomControl: true }).setView([46.5, 2.3], 5)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)
      mapInstance.current = map
 
      const bounds: [number, number][] = []
      let done = 0
 
      for (const bar of bars) {
        if (cancelled) break
        const geo = await geocode(bar.bar_name, bar.city)
        done++
        setGeocoded(done)
 
        if (geo && !cancelled) {
          bounds.push([geo.lat, geo.lon])
 
          // Taille du cercle proportionnelle au nombre de pintes
          const radius = Math.max(10, Math.min(30, 8 + bar.count * 2))
 
          const marker = L.circleMarker([geo.lat, geo.lon], {
            radius,
            fillColor: '#f59e0b',
            color: '#92400e',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85,
          })
 
          marker.bindPopup(`
            <div style="text-align:center;font-family:system-ui,sans-serif;min-width:120px">
              <div style="font-weight:900;font-size:15px;margin-bottom:2px">🍺 ${bar.bar_name}</div>
              <div style="color:#6b7280;font-size:12px;margin-bottom:6px">📍 ${bar.city}</div>
              <div style="font-size:26px;font-weight:900;color:#d97706;line-height:1">${bar.count}</div>
              <div style="color:#9ca3af;font-size:11px">pinte${bar.count > 1 ? 's' : ''}</div>
            </div>
          `, { maxWidth: 180 })
 
          marker.addTo(map)
        }
      }
 
      if (!cancelled) {
        if (bounds.length > 1) map.fitBounds(bounds as any, { padding: [40, 40] })
        else if (bounds.length === 1) map.setView(bounds[0], 14)
        setGeocoding(false)
      }
    }
 
    initMap()
 
    return () => { cancelled = true }
  }, [bars])
 
  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])
 
  if (loading) {
    return <div className="bg-gray-900 rounded-2xl h-64 animate-pulse border border-gray-800" />
  }
 
  if (bars.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
        <div className="text-4xl mb-3">🗺️</div>
        <p className="text-gray-500">Aucun bar encore visité</p>
      </div>
    )
  }
 
  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
          🗺️ Carte des bars visités
        </p>
        {geocoding ? (
          <span className="text-gray-600 text-xs">
            Localisation {geocoded}/{bars.length}...
          </span>
        ) : (
          <span className="text-gray-600 text-xs">{bars.length} bar{bars.length > 1 ? 's' : ''}</span>
        )}
      </div>
 
      <div ref={mapRef} style={{ height: '320px', width: '100%' }} />
 
      <p className="text-center text-gray-700 text-[11px] py-2">
        Taille des cercles proportionnelle au nombre de pintes · © OpenStreetMap
      </p>
    </div>
  )
}