import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // IBM Carbon-inspired palette
        "ibm-blue": "#0f62fe",
        "ibm-blue-hover": "#0043ce",
        "ibm-gray-10": "#f4f4f4",
        "ibm-gray-20": "#e0e0e0",
        "ibm-gray-80": "#393939",
        "ibm-gray-100": "#161616",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
