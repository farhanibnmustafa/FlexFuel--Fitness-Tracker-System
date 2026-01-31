/** @type {import('tailwindcss').Config} */
export default {
  content: ['./**/*.{html,js}', '!./node_modules/**'],
  theme: {
    extend: {
      colors: {
        bgdeep: '#0a2530',
        bgdeeper: '#071d26',
        accent: '#4cd964',
        brand: '#e4d6b2',
      },
    },
  },
  plugins: [],
};
