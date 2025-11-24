/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'faata-red': '#39512a',
        'faata-primary': '#39512a',
        'faata-secondary': '#2f2e2e',
      },
    },
  },
  plugins: [],
}

