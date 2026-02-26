import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // TripSlip Brand Colors
        yellow: {
          DEFAULT: '#F5C518',
          50: '#FEF9E7',
          100: '#FDF3CF',
          200: '#FCE79F',
          300: '#FADB6F',
          400: '#F9CF3F',
          500: '#F5C518', // Primary brand color
          600: '#C49E13',
          700: '#93770E',
          800: '#624F0A',
          900: '#312805',
        },
        black: {
          DEFAULT: '#0A0A0A',
        },
        // Semantic Colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      fontSize: {
        hero: ['72px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        h1: ['48px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        h2: ['36px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        h3: ['24px', { lineHeight: '1.4' }],
        'body-lg': ['18px', { lineHeight: '1.6' }],
        body: ['16px', { lineHeight: '1.5' }],
        'body-sm': ['14px', { lineHeight: '1.5' }],
        caption: ['12px', { lineHeight: '1.4' }],
      },
      boxShadow: {
        'offset-sm': '2px 2px 0px 0px rgba(10, 10, 10, 1)',
        offset: '4px 4px 0px 0px rgba(10, 10, 10, 1)',
        'offset-lg': '8px 8px 0px 0px rgba(10, 10, 10, 1)',
        clay: '0 2px 0 rgba(0,0,0,0.1), 0 4px 0 rgba(0,0,0,0.08), 0 8px 0 rgba(0,0,0,0.06)',
      },
      transitionTimingFunction: {
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'bounce-in': 'bounce-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'bounce-in': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
