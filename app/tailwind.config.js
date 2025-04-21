/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {
        animation: {
          'pulse-slow': 'pulse-slow 7s infinite',
          'ping-slow': 'ping-slow 10s infinite',
          'bounce-slow': 'bounce-slow 12s infinite',
        },
        keyframes: {
          'pulse-slow': {
            '0%, 100%': { opacity: '0.2' },
            '50%': { opacity: '0.7' },
          },
          'ping-slow': {
            '0%': { transform: 'scale(1)', opacity: '0.2' },
            '50%': { transform: 'scale(1.5)', opacity: '0.5' },
            '100%': { transform: 'scale(1)', opacity: '0.2' },
          },
          'bounce-slow': {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-15px)' },
          },
        },
        fontFamily: {
          sans: ['VT323', 'monospace'],
          mono: ['VT323', 'monospace'],
        },
      },
    },
  }