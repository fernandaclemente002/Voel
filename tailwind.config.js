/** @type {import('tailwindcss').Config} */
//: Quais cores e fontes a VOEL vai usar.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'voel-beige': '#F9F7F2',
        'voel-gold': '#D2B48C',
        'voel-charcoal': '#1A1A1A',
      },
    },
  },
  plugins: [],
}