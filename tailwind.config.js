/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tu paleta premium para GBA ID y VISTA
        'gba-ink': '#1d1d1f',      // El negro sutil de Apple
        'gba-gray': '#86868b',     // Gris de subtítulos
        'gba-line': '#d2d2d7',     // Líneas divisorias finas
        'gba-blue': '#0066FF',     // Azul Alliance
      },
      fontFamily: {
        // Configuración para los títulos elegantes de VISTA
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}