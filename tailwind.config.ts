import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        mono: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0fdf7',
          100: '#dcfced',
          500: '#0F6E56',
          600: '#0B5A47',
          700: '#084336',
          900: '#032219',
        },
        surface: {
          0:   '#FAFAF7',
          50:  '#F4F3EE',
          100: '#ECEAE3',
          200: '#D8D5CB',
          800: '#2A2A27',
          900: '#1A1A17',
          950: '#0F0F0D',
        }
      },
      borderRadius: {
        'sm': '6px',
        DEFAULT: '10px',
        'lg': '16px',
        'xl': '24px',
      },
      boxShadow: {
        'sm':  '0 1px 2px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
        DEFAULT: '0 1px 2px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)',
        'lg':  '0 2px 4px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [],
}
export default config
