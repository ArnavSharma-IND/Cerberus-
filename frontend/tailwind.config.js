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
        lavender: {
          50: '#F5F3FF',   // Base background
          100: '#EDE9FE',  // Subtle border / light surface
          200: '#DDD6FE',  // Hover borders
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#6654E8',  // Royal purple brand
          700: '#5543D6',
          800: '#3E319E',
          900: '#171638',  // Text primary
          brand: '#6654E8',
          bg: '#F5F3FF',
          card: '#FFFFFF',
          border: '#EDE9FE',
          'border-strong': '#DDD6FE',
          'text-primary': '#171638',
          'text-secondary': '#5B5882',
          'text-muted': '#8E8AA7'
        },
        // Backward-compatible SOC palette & high-contrast terminal styling
        soc: {
          bg: '#05070B',
          panel: '#0A0E17',
          surface: '#0F1624',
          border: '#1E293B',
          accent: '#00F0FF',
          taint: '#8B5CF6',
          canary: '#EC4899',
          shield: '#0284C7',
          dlp: '#F97316',
          challenge: '#F59E0B',
          danger: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          quarantine: '#E11D48'
        }
      },
      boxShadow: {
        'lavender-sm': '0 2px 8px -1px rgba(102, 84, 232, 0.06), 0 1px 3px -1px rgba(23, 22, 56, 0.04)',
        'lavender': '0 4px 20px -2px rgba(102, 84, 232, 0.08), 0 2px 6px -1px rgba(23, 22, 56, 0.04)',
        'lavender-md': '0 8px 30px -4px rgba(102, 84, 232, 0.12), 0 4px 12px -2px rgba(23, 22, 56, 0.06)',
        'lavender-lg': '0 16px 40px -8px rgba(102, 84, 232, 0.16), 0 8px 20px -4px rgba(23, 22, 56, 0.08)',
        'lavender-glow': '0 0 24px 2px rgba(102, 84, 232, 0.22)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Plus Jakarta Sans', 'Inter', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
