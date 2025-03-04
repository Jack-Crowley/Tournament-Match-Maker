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
        background: '#160A3A',
        primary: '#9c7bff',
        secondary: '#604BAC',
        accent: '#4F33B3',
        highlight: '#7458da',
        soft: '#7864c0',
        dark: '#160A3A',
        deep: '#31216b',
        player_text: "#DDBBEF",
        winner_text: "#F4F4D9",
        loser_text: "#89799E",
      },
    },
  },
  plugins: [],
} satisfies Config;
