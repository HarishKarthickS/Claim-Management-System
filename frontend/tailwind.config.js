/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        primary: "#4B56D2",
        secondary: "#82C3EC",
        accent: "#F1B4BB",
        background: "#F5F5F5",
        success: "#4CAF50",
        warning: "#FFC107",
        danger: "#F44336",
        info: "#2196F3",
      },
      boxShadow: {
        card: "0 4px 6px rgba(0, 0, 0, 0.1)",
        hover: "0 10px 15px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
} 