/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF6F0",
        ink: "#161311",       // near-black for headings/body
        charcoal: "#141414",   // black section backgrounds
        gold: {
          400: "#C9A96B",
          500: "#B08D4F",
          600: "#96773E",
        },
        line: "#E7E0D6",
        muted: "#6B6259",
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.18em",
      },
    },
  },
  plugins: [],
};
