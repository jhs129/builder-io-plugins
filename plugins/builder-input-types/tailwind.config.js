/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    // point at the component package source so JIT sees the classes
    "../../packages/builder-plugins/src/**/*.{ts,tsx,js,jsx}"
  ],
  theme: { extend: {} },
  plugins: [],
};
