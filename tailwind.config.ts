import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#161616",
        paper: "#fbfaf7",
        line: "#dedbd2",
        mint: "#2f8f68",
        amber: "#a16912",
        coral: "#c74332"
      },
      boxShadow: {
        soft: "0 12px 34px rgba(22, 22, 22, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
