/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ki: {
          orange: '#ff8a00',
          gold: '#f6c453',
          blue: '#1e3a8a',
          deep: '#06111f',
        },
      },
    },
  },
  plugins: [],
};