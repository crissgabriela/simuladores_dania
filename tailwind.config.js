/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        physics: {
          dark: '#0f172a',
          card: '#1e293b',
          accent: '#38bdf8',
          beam: '#94a3b8',
          mass: '#f59e0b',
          base: '#64748b'
        }
      }
    },
  },
  plugins: [],
}
