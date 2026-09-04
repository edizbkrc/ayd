import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "var(--brand-50,  #eef1f7)",
          100: "var(--brand-100, #d5ddef)",
          200: "var(--brand-200, #adbade)",
          300: "var(--brand-300, #7a93c8)",
          400: "var(--brand-400, #4f6fb0)",
          500: "var(--brand-500, #2d5096)",
          600: "var(--brand-600, #1e3a7a)",
          700: "var(--brand-700, #122660)",
          800: "var(--brand-800, #0b1845)",
          900: "var(--brand-900, #070f2e)",
          950: "var(--brand-950, #040920)",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.08)",
        lift: "0 12px 32px -12px rgba(15, 23, 42, 0.18)",
        glow: "0 8px 24px -8px rgba(18, 38, 96, 0.55)",
      },
      borderRadius: {
        "2.5xl": "1.25rem",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.45s ease-out both",
        float: "float 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
