/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'poker-green': '#1a472a',
        'poker-felt': '#35654d',
        'poker-border': '#2d5a3c',
        'card-red': '#dc2626',
        'card-black': '#1f2937',
      },
      animation: {
        'deal': 'deal 0.3s ease-out',
        'chip': 'chip 0.5s ease-out',
      },
      keyframes: {
        deal: {
          '0%': { transform: 'translateY(-100px) rotate(-20deg)', opacity: '0' },
          '100%': { transform: 'translateY(0) rotate(0)', opacity: '1' },
        },
        chip: {
          '0%': { transform: 'translateY(50px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
