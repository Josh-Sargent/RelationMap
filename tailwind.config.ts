import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10151e",
        paper: "#f6f4ef",
        accent: "#0d9488",
        panel: "#141a24",
      },
      fontFamily: {
        display: ["'Lora'", "Georgia", "serif"],
        mono: ["'DM Mono'", "ui-monospace", "monospace"],
        body: ["'Geist'", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

export default config;
