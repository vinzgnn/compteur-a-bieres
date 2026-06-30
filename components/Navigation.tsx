'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation({ pseudo }: { pseudo: string }) {
  const pathname = usePathname()

  const links = [
    { href: '/', label: '🍺 Feed' },
    { href: '/classement', label: '🏆 Classement' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur border-t border-gray-800 sm:relative sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo / titre */}
        <div className="hidden sm:block">
          <span className="font-black text-amber-400 text-lg">Road to 🍺</span>
        </div>

        {/* Liens */}
        <div className="flex gap-1 sm:gap-2 w-full sm:w-auto justify-around sm:justify-end">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-amber-500 text-black'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-gray-800">
            <span className="text-gray-400 text-sm">👤 {pseudo}</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
