/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        '869-blue': '#00AEEF',
        '869-orange': '#FF8C00',
        '869-dark': '#1A1A1A',
      },
    },
  },
  plugins: [],
}
