import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        beer: {
          light: '#fef3c7',
          DEFAULT: '#f59e0b',
          dark: '#92400e',
          foam: '#fffbeb',
        },
      },
      animation: {
        'fill-progress': 'fillProgress 1.5s ease-out forwards',
        'count-up': 'countUp 0.5s ease-out',
      },
      keyframes: {
        fillProgress: {
          from: { width: '0%' },
          to: { width: 'var(--progress-width)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
