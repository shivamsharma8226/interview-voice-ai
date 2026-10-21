import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#060913",
          900: "#0b1120",
          850: "#0f172a",
          800: "#17233f",
          700: "#22335c",
        },
        surface: {
          dark: "#0b1120",
          card: "#0f172a",
          cardBorder: "#1e293b",
          hover: "#1e293b",
        },
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        violet: {
          glow: "rgba(139, 92, 246, 0.15)",
        }
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "waveform": "waveform 1.2s ease-in-out infinite alternate",
        "fade-in": "fadeIn 0.3s ease-out forwards",
      },
      keyframes: {
        waveform: {
          "0%": { height: "4px" },
          "100%": { height: "28px" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        }
      }
    },
  },
  plugins: [],
};
export default config;
