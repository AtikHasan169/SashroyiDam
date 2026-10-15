import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-hind-siliguri)", "var(--font-inter)", "sans-serif"],
        bengali: ["var(--font-hind-siliguri)", "sans-serif"],
        english: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        background: "#FAF9F6",
        foreground: "#111827",
        brand: {
          DEFAULT: "#0D5C46", // Deep trustworthy emerald-teal
          dark: "#083D2E",
          light: "#E6F4F0",
          accent: "#D94E28", // Warm terracotta orange for genuine price drops
        },
        border: "#E5E7EB",
        muted: {
          DEFAULT: "#F3F4F6",
          foreground: "#4B5563",
        },
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
