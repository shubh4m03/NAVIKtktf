/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic Dynamic Design Tokens
        background: 'var(--bg-base)',
        'background-raised': 'var(--bg-raised)',
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
          sunken: 'var(--surface-sunken, var(--bg-base))',
        },
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        brand: {
          primary: 'var(--brand-primary)',
          deep: 'var(--brand-deep)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
        },
        ink: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        status: {
          success: 'var(--success)',
          warning: 'var(--warning)',
          danger: 'var(--danger)',
          info: 'var(--info)',
        },
        chart: {
          1: 'var(--chart-series-1)',
          2: 'var(--chart-series-2)',
          3: 'var(--chart-series-3)',
          4: 'var(--chart-series-4)',
          5: 'var(--chart-series-5)',
        },
        category: {
          freight: 'var(--category-freight)',
          risk: 'var(--category-risk)',
          demand: 'var(--category-demand)',
          simulation: 'var(--category-simulation)',
          recommend: 'var(--category-recommend)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        xs:    ['0.75rem', { lineHeight: '1rem' }],
        sm:    ['0.875rem', { lineHeight: '1.25rem' }],
        base:  ['0.9375rem', { lineHeight: '1.5rem' }],
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0, 0, 0, 0.08)',
        panel: '0 2px 6px rgba(0, 0, 0, 0.12)',
        card: '0 2px 8px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
};
