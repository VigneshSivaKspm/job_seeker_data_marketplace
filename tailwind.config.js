/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgb(15 23 42 / .04), 0 8px 24px -10px rgb(15 23 42 / .10)',
        lift: '0 24px 48px -16px rgb(79 70 229 / .30)',
        card: '0 1px 2px rgb(15 23 42 / .05), 0 18px 40px -20px rgb(15 23 42 / .18)',
      },
      keyframes: {
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'none' } },
        'pop-in': { from: { opacity: '0', transform: 'scale(.96) translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        'float-rev': { '0%,100%': { transform: 'translateY(-8px)' }, '50%': { transform: 'translateY(6px)' } },
        shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
        'gradient-x': { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        confetti: {
          '0%': { transform: 'translateY(-10vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '.9' },
        },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'ping-slow': { '75%,100%': { transform: 'scale(2)', opacity: '0' } },
      },
      animation: {
        'sheet-up': 'sheet-up .3s cubic-bezier(.2,.8,.2,1)',
        'slide-in': 'slide-in .3s cubic-bezier(.2,.8,.2,1)',
        'fade-in': 'fade-in .2s ease-out',
        'fade-up': 'fade-up .6s cubic-bezier(.2,.8,.2,1) both',
        'pop-in': 'pop-in .22s ease-out',
        float: 'float 6s ease-in-out infinite',
        'float-rev': 'float-rev 7s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
        confetti: 'confetti 3.2s ease-in forwards',
        marquee: 'marquee 70s linear infinite',
        'ping-slow': 'ping-slow 2.4s cubic-bezier(0,0,.2,1) infinite',
      },
    },
  },
  plugins: [],
};