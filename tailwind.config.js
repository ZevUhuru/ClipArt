/** @type {import('tailwindcss').Config} */
module.exports = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  purge: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}',
  ],
  
  theme: {
    extend: {
      colors: {
        primary: {
          "50":"#eff6ff",
          "100":"#dbeafe",
          "200":"#bfdbfe",
          "300":"#93c5fd",
          "400":"#60a5fa",
          "500":"#3b82f6",
          "600":"#2563eb",
          "700":"#1d4ed8",
          "800":"#1e40af",
          "900":"#1e3a8a",
          "950":"#172554"
        },
      },
      fontFamily: {
        'futura': ['futura-pt', 'sans-serif'],
        'futura-bold': ['futura-pt-bold', 'sans-serif'], 
        'body': [
          'Inter', 
          'ui-sans-serif', 
          'system-ui', 
          '-apple-system', 
          'Segoe UI', 
          'Roboto', 
          'Helvetica Neue', 
          'Arial', 
          'Noto Sans', 
          'sans-serif', 
          'Apple Color Emoji', 
          'Segoe UI Emoji', 
          'Segoe UI Symbol', 
          'Noto Color Emoji'
        ],
        'sans': [
          'Inter', 
          'ui-sans-serif', 
          'system-ui', 
          '-apple-system', 
          'Segoe UI', 
          'Roboto', 
          'Helvetica Neue', 
          'Arial', 
          'Noto Sans', 
          'sans-serif', 
          'Apple Color Emoji', 
          'Segoe UI Emoji', 
          'Segoe UI Symbol', 
          'Noto Color Emoji'
        ]
      },
      fontWeight: {
        'light': 300,
        'book': 400,
        'medium': 500,
        'demi': 600,
        'bold': 700,
        'heavy': 800,
        'extrabold': 800,
      },
      boxShadow: {
        highlight: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
      },
      screens: {
        narrow: { raw: '(max-aspect-ratio: 3 / 2)' },
        wide: { raw: '(min-aspect-ratio: 3 / 2)' },
        'taller-than-854': { raw: '(min-height: 854px)' },
      },
      fontSize: {
        '23': '23px',
        '30': '30px',
        '33': '33px',
        '36': '36px',
      },
      spacing: {
        '50': '50px',
      },
      backgroundImage: {
        'footer-gradient': 'linear-gradient(#0d0f13, #222831, #37414f)',
      },
      backgroundColor: {
        'custom-gray': '#0d0f13',
      },
    },
  },
  plugins: [
    require('flowbite/plugin'),
  ],
}
