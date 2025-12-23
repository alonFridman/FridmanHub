/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#5A9CB5",
        highlight: "#FACE68",
        secondary: "#FAAC68",
        alert: "#FA6868"
      },
      fontSize: {
        display: "3rem",
        headline: "2.25rem",
        title: "1.75rem",
        body: "1.25rem"
      }
    }
  },
  plugins: []
};
