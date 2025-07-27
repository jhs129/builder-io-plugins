/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "neutral-100": "var(--color-neutral-100)",
        "neutral-20": "var(--color-neutral-20)",
        primary: "var(--color-primary)",
      },
    },
  },
  plugins: [],
};
