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
          400: "#20d486",
          500: "#00c471",
          600: "#00a85f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
