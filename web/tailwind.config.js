/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts}', // Include design-tokens
  ],
  // Safelist dynamic colors used in design-tokens.ts and ExplorePanel
  safelist: [
    // Pillar colors
    'text-sky-400', 'text-amber-400', 'text-emerald-400',
    'from-sky-500', 'to-sky-400',
    'from-amber-500', 'to-amber-400',
    'from-emerald-500', 'to-emerald-400',
    // Confidence tier colors
    'bg-emerald-400', 'bg-amber-400', 'bg-slate-400',
  ],
  theme: {
    extend: {
      colors: {
        // Deep editorial palette
        slate: {
          950: '#020617',
        },
        // Warm amber accent for urgency/warning
        amber: {
          450: '#f59e0b',
        },
        // Pillar colors (referencing CSS custom properties)
        pillar: {
          interpersonal: 'var(--color-pillar-interpersonal)',
          institutional: 'var(--color-pillar-institutional)',
          governance: 'var(--color-pillar-governance)',
        },
        // Brand colors
        trust: {
          revolution: 'var(--color-trust-revolution)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Playfair Display', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Source Sans 3', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
