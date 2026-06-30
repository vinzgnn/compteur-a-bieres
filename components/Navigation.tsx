'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Navigation({ pseudo }: { pseudo: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [showLogout, setShowLogout] = useState(false)

  const links = [
    { href: '/',           label: '🍺', text: 'Feed' },
    { href: '/classement', label: '🏆', text: 'Classement' },
    { href: '/stats',      label: '📊', text: 'Stats' },
  ]

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile : barre fixe en bas */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur border-t border-gray-800 sm:hidden">
        <div className="flex justify-around px-2 pt-2">
          {links.map(link => {
            const active = pathname === link.href
            return (
              <Link key={link.href} href={link.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors min-w-[56px] ${
                  active ? 'text-amber-400' : 'text-gray-500'
                }`}>
                <span className="text-2xl leading-none">{link.label}</span>
                <span className={`text-[10px] font-semibold ${active ? 'text-amber-400' : 'text-gray-600'}`}>
                  {link.text}
                </span>
              </Link>
            )
          })}

          <div className="relative">
            <button
              onClick={() => setShowLogout(o => !o)}
              className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors min-w-[56px] text-gray-500"
            >
              <span className="text-2xl leading-none">👤</span>
              <span className="text-[10px] font-semibold text-gray-600 max-w-[52px] truncate">{pseudo}</span>
            </button>

            {showLogout && (
              <div className="absolute bottom-full mb-2 right-0 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
                <div className="px-4 py-2 border-b border-gray-700">
                  <p className="text-white font-bold text-sm">{pseudo}</p>
                </div>
                <Link
                  href={`/profil/${encodeURIComponent(pseudo)}`}
                  onClick={() => setShowLogout(false)}
                  className="w-full px-4 py-3 text-gray-300 text-sm font-medium hover:bg-gray-700 text-left flex items-center gap-2"
                >
                  👤 Mon profil
                </Link>
                <button
                  onClick={logout}
                  className="w-full px-4 py-3 text-red-400 text-sm font-medium hover:bg-gray-700 text-left"
                >
                  🚪 Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Desktop : barre en haut */}
      <nav className="hidden sm:block border-b border-gray-800 bg-gray-950">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-black text-amber-400 text-lg">Road to 🍺</span>

          <div className="flex gap-2">
            {links.map(link => (
              <Link key={link.href} href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-amber-500 text-black'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
                {link.label} {link.text}
              </Link>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowLogout(o => !o)}
              className="text-gray-400 text-sm hover:text-white flex items-center gap-1"
            >
              👤 {pseudo} <span className="text-gray-600">▾</span>
            </button>

            {showLogout && (
              <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl min-w-[140px]">
                <Link
                  href={`/profil/${encodeURIComponent(pseudo)}`}
                  onClick={() => setShowLogout(false)}
                  className="w-full px-4 py-3 text-gray-300 text-sm font-medium hover:bg-gray-700 text-left flex items-center gap-2"
                >
                  👤 Mon profil
                </Link>
                <button
                  onClick={logout}
                  className="w-full px-4 py-3 text-red-400 text-sm font-medium hover:bg-gray-700 text-left"
                >
                  🚪 Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}