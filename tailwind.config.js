/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#F6C445",   // Warm Yellow
        primaryHover: "#E5B02E", // Darker Warm Yellow
        accent: "#2F3542",    // Charcoal Gray
        background: "#F8F9FC", // Very Light Gray
        success: "#4CAF50",
        warning: "#FFC107",
        danger: "#FF5252",
        info: "#3B82F6",
      },
      fontFamily: {
        heading: ["'Nunito'", "sans-serif"],
        body: ["'Quicksand'", "sans-serif"],
      },
      boxShadow: {
        'gamified': '0 8px 0 0 rgba(0,0,0,0.1)',
        'gamified-hover': '0 4px 0 0 rgba(0,0,0,0.1)',
        'gamified-active': '0 0 0 0 rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
}
