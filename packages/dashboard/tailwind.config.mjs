/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#4f46e5",
          600: "#4338ca"
        }
      }
    }
  },
  plugins: []
};

export default config;
