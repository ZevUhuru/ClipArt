/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        futura: ["futura-pt", "sans-serif"],
        "futura-bold": ["futura-pt-bold", "sans-serif"],
        body: [
          "Inter",
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        sans: [
          "Inter",
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#fef2f8",
          100: "#fde6f2",
          200: "#ffc9e0",
          300: "#ff8ac2",
          400: "#FF6B9D",
          500: "#ff4d88",
          600: "#e63370",
          700: "#c2245c",
          800: "#991b49",
          900: "#751438",
        },
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #FF6B9D 0%, #FF8A65 50%, #4ADE80 100%)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};
