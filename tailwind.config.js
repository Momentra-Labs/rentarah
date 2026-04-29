/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Urbanist',
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      screens: {
        /** Narrow phones / short viewports — align auth & map overlays */
        xs: '380px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      },
      fontSize: {
        /** Fluid body + UI copy */
        fluid: ['clamp(0.8125rem, 0.35vw + 0.74rem, 0.9375rem)', { lineHeight: '1.45' }],
        'fluid-heading': ['clamp(1rem, 0.85vw + 0.82rem, 1.375rem)', { lineHeight: '1.25' }],
      },
      minHeight: {
        touch: '44px',
        'touch-safe': '2.75rem',
      },
      minWidth: {
        touch: '44px',
      },
      boxShadow: {
        search: '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
        modal: '0 8px 28px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
