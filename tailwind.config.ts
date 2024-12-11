import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'base-dark-purple': '#160A3A',
        'nav-bar-purple': "#604BAC",
        "dark-purple-1": "#4F33B3"
      },
    },
  },
  plugins: [],
} satisfies Config;
