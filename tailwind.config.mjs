/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  '#fffdf7',
          100: '#fff8e8',
          200: '#ffefc4',
          300: '#ffe49a',
          400: '#ffd166',
          500: '#ffbc42',
          600: '#f59e0b',
          700: '#d97706',
          800: '#92400e',
          900: '#78350f',
        },
        rose: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        mint: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        vanilla: '#f3e5c0',
        strawberry: '#e8688a',
        chocolate: '#5c3317',
        pistachio: '#93c572',
        bdteal: '#069494',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        script: ['"Dancing Script"', 'cursive'],
        body: ['"Lato"', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'fade-up': 'fadeUp 0.7s ease-out forwards',
        'scoop-in': 'scoopIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scoopIn: {
          '0%': { opacity: '0', transform: 'scale(0.5) translateY(20px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      backgroundImage: {
        'waffle-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d97706' fill-opacity='0.08'%3E%3Cpath d='M0 0h20v20H0zm20 20h20v20H20z'/%3E%3C/g%3E%3C/svg%3E\")",
        'sprinkle-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cellipse cx='10' cy='8' rx='3' ry='1.2' fill='%23f43f5e' opacity='0.3' transform='rotate(30 10 8)'/%3E%3Cellipse cx='35' cy='15' rx='3' ry='1.2' fill='%2322c55e' opacity='0.3' transform='rotate(-20 35 15)'/%3E%3Cellipse cx='52' cy='5' rx='3' ry='1.2' fill='%23f59e0b' opacity='0.3' transform='rotate(50 52 5)'/%3E%3Cellipse cx='20' cy='40' rx='3' ry='1.2' fill='%238b5cf6' opacity='0.3' transform='rotate(-40 20 40)'/%3E%3Cellipse cx='45' cy='38' rx='3' ry='1.2' fill='%23f43f5e' opacity='0.3' transform='rotate(15 45 38)'/%3E%3Cellipse cx='8' cy='52' rx='3' ry='1.2' fill='%23f59e0b' opacity='0.3' transform='rotate(60 8 52)'/%3E%3Cellipse cx='55' cy='50' rx='3' ry='1.2' fill='%2322c55e' opacity='0.3' transform='rotate(-30 55 50)'/%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
