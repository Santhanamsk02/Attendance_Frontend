/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        neu: {
          bg: '#eef3f9',
          surface: '#f4f8fc',
          card: '#ffffff',
          dark: '#1e293b',
          muted: '#64748b',
          border: '#e2e8f0',
        },
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        violet: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      boxShadow: {
        'neu-flat': '6px 6px 18px rgba(166, 185, 215, 0.4), -6px -6px 18px rgba(255, 255, 255, 0.95)',
        'neu-flat-sm': '3px 3px 8px rgba(166, 185, 215, 0.35), -3px -3px 8px rgba(255, 255, 255, 0.9)',
        'neu-flat-lg': '10px 10px 28px rgba(166, 185, 215, 0.45), -10px -10px 28px rgba(255, 255, 255, 1)',
        'neu-pressed': 'inset 3px 3px 6px rgba(166, 185, 215, 0.35), inset -3px -3px 6px rgba(255, 255, 255, 0.95)',
        'neu-pressed-sm': 'inset 2px 2px 4px rgba(166, 185, 215, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.95)',
        'neu-glass': '6px 6px 20px rgba(175, 195, 225, 0.35), -6px -6px 20px rgba(255, 255, 255, 0.9)',
        'neu-glow-blue': '0 4px 16px rgba(14, 165, 233, 0.35)',
        'neu-glow-violet': '0 4px 16px rgba(139, 92, 246, 0.35)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
