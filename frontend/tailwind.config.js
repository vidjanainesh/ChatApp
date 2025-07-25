/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // All your source files
  ],
  theme: {
    extend: {},
  },
  plugins: [require("tailwind-scrollbar")],
}