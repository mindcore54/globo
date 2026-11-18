/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'shake-hard': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '15%': { transform: 'translate(-4px, 3px) rotate(-2deg)' },
          '30%': { transform: 'translate(4px, -3px) rotate(2deg)' },
          '45%': { transform: 'translate(-5px, -2px) rotate(-1.5deg)' },
          '60%': { transform: 'translate(5px, 2px) rotate(1.5deg)' },
          '75%': { transform: 'translate(-3px, 4px) rotate(-1deg)' },
          '90%': { transform: 'translate(3px, -2px) rotate(1deg)' },
        },
        'explosion-pop': {
          '0%': { transform: 'scale(0.5)', opacity: '1' },
          '50%': { transform: 'scale(1.6)', opacity: '1' },
          '100%': { transform: 'scale(2.1)', opacity: '0' },
        },
      },
      animation: {
        'shake-hard': 'shake-hard 0.25s infinite linear',
        'explosion-pop': 'explosion-pop 0.8s ease-out forwards',
      },
    },
  },
  plugins: [],
};
