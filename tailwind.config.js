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
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'neu-flat': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'neu-flat-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'neu-flat-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        'neu-pressed': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'neu-pressed-sm': 'inset 0 1px 1px 0 rgba(0, 0, 0, 0.04)',
        'neu-glass': '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
        'neu-glow-blue': '0 0 15px rgba(14, 165, 233, 0.15)',
        'neu-glow-violet': '0 0 15px rgba(139, 92, 246, 0.15)',
      },
      fontFamily: {
        sans: ['"Times New Roman"', 'Times', 'serif'],
        serif: ['"Times New Roman"', 'Times', 'serif'],
        mono: ['"Times New Roman"', 'Times', 'serif'],
      },
    },
  },
  plugins: [],
}
