/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        soc: {
          bg: '#05070B',
          panel: '#0A0E17',
          surface: '#0F1624',
          border: '#1E293B',
          accent: '#00F0FF',
          taint: '#A855F7',
          canary: '#F59E0B',
          shield: '#38BDF8',
          dlp: '#F97316',
          challenge: '#EAB308',
          danger: '#F43F5E',
          warning: '#F59E0B',
          success: '#10B981',
          quarantine: '#EC4899'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
