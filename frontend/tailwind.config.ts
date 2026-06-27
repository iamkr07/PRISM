import type { Config } from 'tailwindcss'

const colors = {
  inherit: 'inherit',
  current: 'currentColor',
  transparent: 'transparent',
  black: '#000',
  white: '#fff',
  background: 'oklch(0.16 0.012 260)',
  foreground: 'oklch(0.97 0.005 250)',
  surface: 'oklch(0.205 0.014 260)',
  'surface-elevated': 'oklch(0.235 0.016 260)',
  primary: 'oklch(0.62 0.21 268)',
  'accent-cyan': 'oklch(0.78 0.14 210)',
  emerald: 'oklch(0.74 0.16 162)',
  amber: 'oklch(0.82 0.16 78)',
  crimson: 'oklch(0.65 0.22 22)',
  border: 'oklch(1 0 0 / 8%)',
  muted: 'oklch(0.68 0.018 255)',
}

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors,
      fontFamily: {
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: '0.875rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'elegant': '0 4px 24px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(147, 112, 219, 0.3)',
      },
      backgroundColor: {
        glass: 'rgba(32, 33, 35, 0.7)',
      },
      backdropFilter: {
        'glass': 'blur(8px)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { opacity: '1', textShadow: '0 0 10px rgba(147, 112, 219, 0.5)' },
          '50%': { opacity: '0.8', textShadow: '0 0 20px rgba(147, 112, 219, 0.8)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.7)' },
          '50%': { boxShadow: '0 0 0 8px rgba(34, 197, 94, 0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
