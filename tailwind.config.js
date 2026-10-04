/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07070b',
          900: '#0c0c13',
          850: '#11111a',
          800: '#171722',
          700: '#22222f',
          600: '#2f2f40',
          500: '#4a4a60',
          400: '#8b8ba3',
          300: '#b4b4c8',
          200: '#d6d6e2',
          100: '#ececf4',
        },
        nova: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        pulse: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(139,92,246,.35), 0 10px 40px -10px rgba(139,92,246,.45)',
        'glow-cyan': '0 0 0 1px rgba(34,211,238,.35), 0 10px 40px -12px rgba(34,211,238,.4)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'slide-up': {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'slide-up': 'slide-up .25s ease-out',
        'fade-in': 'fade-in .2s ease-out',
      },
    },
  },
  plugins: [],
};
