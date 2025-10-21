module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#2F2F2F",
        panel: "#3B3B3B",
        accentTeal: "#00CFC1",
        accentRed: "#FF4B5C",
        textPrimary: "#EAEAEA",
        textSecondary: "#A0A0A0"
      },
      boxShadow: {
        neon: "0 6px 18px rgba(0,207,193,0.08)"
      }
    }
  },
  plugins: []
};
