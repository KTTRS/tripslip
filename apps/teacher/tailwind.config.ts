import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/auth/src/**/*.{js,ts,jsx,tsx}'
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
      },
      borderWidth: {
        '3': '3px'
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'bounce-slow': 'bounce-slow 3s ease-in-out infinite',
        'fade-in': 'fadeIn 1s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'wiggle': 'wiggle 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(2deg)' },
          '66%': { transform: 'translateY(-5px) rotate(-1deg)' }
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(245, 197, 24, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(245, 197, 24, 0.6)' }
        }
      }
    }
  },
  plugins: []
} satisfies Config
