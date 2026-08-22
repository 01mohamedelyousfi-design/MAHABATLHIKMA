/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './404.html',
    './lessons/*.html',
    './philomedia/index.html',
    './prompts/index.html',
    './skills/index.html',
    './games/index.html',
    './notebooklm/index.html',
    './booklet/index.html',
    './feedback/index.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tajawal', 'sans-serif'],
        serif: ['Amiri', 'serif'],
      },
      colors: {
        primary: { DEFAULT: '#0f766e', light: '#14b8a6', dark: '#0d5f58' },
        secondary: { DEFAULT: '#7c3aed', light: '#a78bfa', dark: '#5b21b6' },
        accent: { DEFAULT: '#d97706', light: '#fbbf24', dark: '#b45309' },
        surface: '#fcfbf7',
        paper: '#fffdf8',
      },
    },
  },
  plugins: [],
}
