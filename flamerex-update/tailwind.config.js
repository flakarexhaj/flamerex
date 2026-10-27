import colors from "tailwindcss/colors";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
      colors: {
        // The default blue-gray "slate" is replaced by dark purple tones,
        // so every existing component (cards, table, drawer) matches the new theme.
        slate: {
          50: "#f6f3fb", 100: "#ece7f6", 200: "#d9d1ea", 300: "#bdb2d6", 400: "#9a8db8",
          500: "#766a96", 600: "#5a4f78", 700: "#3f3557", 800: "#2a2140", 900: "#170f29", 950: "#07040d",
        },
        // Older components use "teal" for focus and selected states. It now points to violet.
        teal: colors.violet,
      },
    },
  },
  plugins: [],
};
