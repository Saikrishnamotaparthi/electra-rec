/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#080F11',
          900: '#0C1517',
          850: '#101C1F',
          800: '#152628',
          750: '#1A2E31',
          700: '#233639',
          600: '#2E4549',
          500: '#3D565B',
        },
        gold: {
          50: '#FFF8EC',
          100: '#FDECC8',
          200: '#FAD98F',
          300: '#F5C15C',
          400: '#EFAF3E',
          500: '#E9A134',
          600: '#D48A22',
          700: '#B06F1A',
          800: '#8E5918',
          900: '#6B4412',
        },
        mist: {
          50: '#F6F9F9',
          100: '#E8EEEF',
          200: '#D0DBDD',
          300: '#A8BBBE',
          400: '#7A9498',
          500: '#5A7478',
          600: '#465C60',
        },
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-sm': '0 0 0 1px rgba(233,161,52,0.25), 0 4px 16px -4px rgba(233,161,52,0.15)',
        'gold-md': '0 0 0 1px rgba(233,161,52,0.35), 0 12px 32px -8px rgba(233,161,52,0.22)',
        'card': '0 8px 32px -8px rgba(0,0,0,0.45)',
        'glow': '0 0 40px rgba(233,161,52,0.25)',
      },
      backgroundImage: {
        'gold-linear': 'linear-gradient(135deg, #E9A134 0%, #F5C15C 50%, #E9A134 100%)',
        'hero-radial': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(233,161,52,0.18), transparent 60%)',
        'card-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 40%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
        float: 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
