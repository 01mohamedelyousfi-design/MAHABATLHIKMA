/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./examples/aflatoon-freedom-programming/index.html'],
  theme: {
    extend: {
      colors: {
        cream: '#F5F1E8',
        ink: '#1F1F1F',
        teal: '#0F4C5C',
        amber: '#E36414',
        border: '#D4CFC4',
        claim: '#E53935',
        premise: '#1E88E5',
        evidence: '#43A047',
        warrant: '#B7791F',
      },
      fontFamily: {
        sans: ['Cairo', 'system-ui', 'sans-serif'],
        serif: ['Amiri', 'serif'],
      },
    },
  },
  plugins: [],
}
