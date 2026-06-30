import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Road to 5000 Pintes 🍺',
  description: 'Le compteur officiel du groupe',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Road to 5000',
  },
}

export const viewport: Viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,   // empêche le zoom iOS sur les inputs
  viewportFit: 'cover', // utilise tout l'écran y compris derrière le notch
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
        {children}
      </body>
    </html>
  )
}