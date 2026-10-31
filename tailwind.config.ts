import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060B1A',
          900: '#0A1128',
          800: '#101C42',
          700: '#1A2B5F',
        },
        royal: {
          600: '#1D4ED8',
          500: '#2563EB',
          400: '#3B82F6',
        },
        cyan: {
          400: '#22D3EE',
          300: '#67E8F9',
        },
        violet: {
          500: '#6366F1',
          400: '#818CF8',
        },
      },
      backgroundImage: {
        'brand-radial': 'radial-gradient(ellipse at top, #101C42 0%, #0A1128 60%, #060B1A 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'blue-gradient': 'linear-gradient(135deg, #1D4ED8 0%, #22D3EE 100%)',
        'accent-gradient': 'linear-gradient(135deg, #6366F1 0%, #22D3EE 100%)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(29, 78, 216, 0.35)',
        'glow-cyan': '0 0 25px -5px rgba(34, 211, 238, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
};

export default config;
