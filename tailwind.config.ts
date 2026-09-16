import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-pretendard)"],
      },
      colors: {
        canvas: "#05080c",
        panel: "#0a1016",
        line: "rgb(255 255 255 / 0.12)",
        mint: {
          50: "#effdf5",
          200: "#b6f2d5",
          300: "#73e5aa",
          400: "#20d486",
          500: "#00c471",
          600: "#00a85f",
          700: "#008a4e",
          800: "#006d3e",
          900: "#005a34",
          950: "#00351e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
