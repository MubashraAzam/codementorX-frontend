/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#F49B00",      // Brand Orange (landing --orange)
        primaryHover: "#E08E00", // Hover Orange
        primaryDeep: "#CC8100",  // Orange for pressed/offset shadows (--orange-deep)
        accent: "#14325D",       // Deep Navy — primary text/headings (--navy-1)
        accentSoft: "#25367C",   // Secondary Navy (--navy-2)
        background: "#FFFDFA",   // Warm Cream (--cream)
        success: "#2E9D62",      // Green (--success)
        warning: "#F5B301",      // Gold (stars / streaks)
        danger: "#E0473A",       // Red (--red)
        info: "#3B82F6",         // Blue accent
      },
      fontFamily: {
        heading: ["'Sora'", "'Inter'", "sans-serif"],
        body: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        // Premium, navy-tinted elevation (matches landing --shadow-sm/md)
        'gamified': '0 12px 34px rgba(20,50,93,0.10)',
        'gamified-hover': '0 18px 44px rgba(20,50,93,0.14)',
        'gamified-active': '0 6px 18px rgba(20,50,93,0.08)',
        'soft': '0 8px 24px rgba(20,50,93,0.05)',
      }
    },
  },
  plugins: [],
}
