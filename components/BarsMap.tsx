'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'

interface Bar {
  bar_name: string
  city: string
  count: number
}

// Regroupement par ville
interface CityGroup {
  city: string
  bars: { bar_name: string; count: number }[]
  totalCount: number
}

interface GeoResult {
  lat: number
  lon: number
}

// Cache géocodage ville (clé = nom de ville)
const GEO_CACHE_KEY = 'biere_geocache_city_v1'

function getGeoCache(): Record<string, GeoResult | null> {
  try { return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || '{}') } catch { return {} }
}

function setGeoCache(cache: Record<string, GeoResult | null>) {
  try { localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache)) } catch {}
}

// Géocode une ville uniquement — fiable et sans ambiguïté
async function geocodeCity(city: string): Promise<GeoResult | null> {
  const cache = getGeoCache()
  if (city in cache) return cache[city]

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', France')}&format=json&limit=1&featuretype=city`,
      { headers: { 'User-Agent': 'BiereCounter/1.0' } }
    )
    const data = await res.json()
    const result: GeoResult | null = data.length > 0
      ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
      : null
    cache[city] = result
    setGeoCache(cache)
    await new Promise(r => setTimeout(r, 1100)) // politesse Nominatim
    return result
  } catch {
    return null
  }
}

function groupByCity(bars: Bar[]): CityGroup[] {
  const map: Record<string, CityGroup> = {}
  for (const bar of bars) {
    if (!map[bar.city]) map[bar.city] = { city: bar.city, bars: [], totalCount: 0 }
    map[bar.city].bars.push({ bar_name: bar.bar_name, count: bar.count })
    map[bar.city].totalCount += bar.count
  }
  return Object.values(map).sort((a, b) => b.totalCount - a.totalCount)
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

      // Fix icônes Leaflet
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

      const cities = groupByCity(bars)
      const bounds: [number, number][] = []
      let done = 0

      for (const cityGroup of cities) {
        if (cancelled) break
        const geo = await geocodeCity(cityGroup.city)
        done++
        setGeocoded(done)

        if (geo && !cancelled) {
          bounds.push([geo.lat, geo.lon])

          // Taille proportionnelle au total de pintes dans la ville
          const radius = Math.max(10, Math.min(35, 8 + cityGroup.totalCount * 2))

          const marker = L.circleMarker([geo.lat, geo.lon], {
            radius,
            fillColor: '#f59e0b',
            color: '#92400e',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85,
          })

          // Popup : ville + liste des bars
          const barsHtml = cityGroup.bars
            .map(b => `<div style="font-size:12px;color:#374151;padding:2px 0">🍺 ${b.bar_name} <span style="color:#d97706;font-weight:700">(${b.count})</span></div>`)
            .join('')

          marker.bindPopup(`
            <div style="font-family:system-ui,sans-serif;min-width:140px">
              <div style="font-weight:900;font-size:15px;margin-bottom:4px">📍 ${cityGroup.city}</div>
              <div style="margin-bottom:6px">${barsHtml}</div>
              <div style="border-top:1px solid #e5e7eb;padding-top:6px;text-align:center">
                <span style="font-size:22px;font-weight:900;color:#d97706">${cityGroup.totalCount}</span>
                <span style="color:#9ca3af;font-size:11px"> pinte${cityGroup.totalCount > 1 ? 's' : ''}</span>
              </div>
            </div>
          `, { maxWidth: 200 })

          marker.addTo(map)
        }
      }

      if (!cancelled) {
        if (bounds.length > 1) map.fitBounds(bounds as any, { padding: [40, 40] })
        else if (bounds.length === 1) map.setView(bounds[0], 13)
        setGeocoding(false)
      }
    }

    initMap()
    return () => { cancelled = true }
  }, [bars])

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

  const cityCount = groupByCity(bars).length

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
          🗺️ Carte des bars visités
        </p>
        {geocoding ? (
          <span className="text-gray-600 text-xs">Localisation {geocoded}/{cityCount}...</span>
        ) : (
          <span className="text-gray-600 text-xs">
            {bars.length} bar{bars.length > 1 ? 's' : ''} · {cityCount} ville{cityCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div ref={mapRef} style={{ height: '320px', width: '100%' }} />

      <p className="text-center text-gray-700 text-[11px] py-2">
        Pin par ville · taille proportionnelle au nombre de pintes · © OpenStreetMap
      </p>
    </div>
  )
}