import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#121212",
        paper: "#ffffff",
        muted: "#6d6a64",
        line: "#ded9cf",
        accent: "#d84f31",
        moss: "#55705a",
      },
      boxShadow: {
        soft: "0 16px 50px rgba(18, 18, 18, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
