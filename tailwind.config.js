/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          100: 'rgba(255, 255, 255, 0.4)',
          200: 'rgba(255, 255, 255, 0.6)',
          300: 'rgba(255, 255, 255, 0.8)',
          border: 'rgba(0, 0, 0, 0.05)',
          surface: 'rgba(255, 255, 255, 0.7)',
          highlight: 'rgba(255, 255, 255, 0.5)',
        }
      },
      backdropBlur: {
        xs: '2px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'gradient-xy': 'gradient 15s ease infinite',
      }
    },
  },
  plugins: [],
}