import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Wayco internal-tool palette: calm slate + a single accent.
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          500: "#3b6fed",
          600: "#2f59c7",
          700: "#264aa3",
        },
      },
    },
  },
  plugins: [],
};

export default config;
