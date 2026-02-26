import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F5C518',
          50: '#FEF9E7',
          100: '#FDF3CF',
          200: '#FBE79F',
          300: '#F9DB6F',
          400: '#F7CF3F',
          500: '#F5C518',
          600: '#C49E13',
          700: '#93770E',
          800: '#625009',
          900: '#312805'
        },
        black: '#0A0A0A',
        white: '#FFFFFF'
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace']
      },
      boxShadow: {
        'offset': '4px 4px 0px 0px rgba(10, 10, 10, 1)',
        'offset-lg': '8px 8px 0px 0px rgba(10, 10, 10, 1)'
      }
    }
  },
  plugins: []
} satisfies Config
