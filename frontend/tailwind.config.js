/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          canvas: 'var(--bg-canvas)',
          surface: 'var(--bg-surface)',
          muted: 'var(--bg-muted)',
          card: 'var(--bg-card)',
        },
        ink: {
          primary: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          tertiary: 'var(--ink-tertiary)',
          faint: 'var(--ink-faint)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        vermilion: {
          DEFAULT: 'var(--vermilion)',
          hover: 'var(--vermilion-hover)',
          subtle: 'var(--vermilion-subtle)',
        },
        gold: {
          DEFAULT: 'var(--gold)',
          subtle: 'var(--gold-subtle)',
        },
        sage: {
          DEFAULT: 'var(--sage)',
          subtle: 'var(--sage-subtle)',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        'serif-tamil': ['"Noto Serif Tamil"', 'serif'],
        'sans-tamil': ['"Noto Sans Tamil"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'paper-sm': '0 1px 3px rgba(20, 17, 15, 0.04), 0 1px 2px rgba(20, 17, 15, 0.02)',
        'paper': '0 4px 16px rgba(20, 17, 15, 0.06)',
        'paper-lg': '0 10px 30px rgba(20, 17, 15, 0.08)',
      }
    },
  },
  plugins: [],
}
