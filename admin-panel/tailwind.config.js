/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#1C1622",
          900: "#241B2E",
          800: "#362A44",
        },
        plum: {
          50: "#F7F2FA",
          100: "#EFE4F4",
          200: "#DCC3E8",
          400: "#9F5FBF",
          600: "#6B2E8C",
          700: "#582475",
          800: "#451C5C",
        },
        gold: {
          400: "#D4AF6A",
          500: "#C39A4E",
          600: "#A67F3A",
        },
        canvas: "#FBF9F6",
        surface: "#FFFFFF",
        line: "#E8E2EC",
        success: "#2E7D5B",
        danger: "#B3432D",
        warn: "#B98420",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,22,34,0.06), 0 1px 12px rgba(28,22,34,0.04)",
      },
      borderRadius: {
        xl2: "14px",
      },
    },
  },
  plugins: [],
};
