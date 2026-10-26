/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF9F1",
        surface: "#FFFFFF",
        ink: "#24211E",
        muted: "#6B645D",
        tomato: { DEFAULT: "#C8472B", hover: "#A93A22", soft: "#FCE7DF" },
        saffron: "#F4B942",
        line: "#E9DED2",
        success: "#2F7D59",
        danger: "#B9382F",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        display: ['"Fraunces"', "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(36,33,30,0.04), 0 8px 24px -12px rgba(36,33,30,0.12)",
      },
    },
  },
  plugins: [],
};
