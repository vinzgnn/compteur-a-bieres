'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation({ pseudo }: { pseudo: string }) {
  const pathname = usePathname()

  const links = [
    { href: '/',           label: '🍺',  text: 'Feed' },
    { href: '/classement', label: '🏆',  text: 'Classement' },
    { href: '/stats',      label: '📊',  text: 'Stats' },
  ]

  return (
    <>
      {/* Mobile : barre fixe en bas */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur border-t border-gray-800 nav-safe sm:hidden">
        <div className="flex justify-around px-2 pt-2">
          {links.map(link => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors min-w-[64px] ${
                  active ? 'text-amber-400' : 'text-gray-500'
                }`}
              >
                <span className="text-2xl leading-none">{link.label}</span>
                <span className={`text-[10px] font-semibold ${active ? 'text-amber-400' : 'text-gray-600'}`}>
                  {link.text}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop : barre en haut */}
      <nav className="hidden sm:block border-b border-gray-800 bg-gray-950">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-black text-amber-400 text-lg">Road to 🍺</span>
          <div className="flex gap-2">
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
                {link.label} {link.text}
              </Link>
            ))}
          </div>
          <span className="text-gray-500 text-sm">👤 {pseudo}</span>
        </div>
      </nav>
    </>
  )
}