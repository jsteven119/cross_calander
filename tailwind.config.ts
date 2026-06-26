import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // 동적으로 조합되는 색상 클래스 (객체 매핑에서 사용)
    { pattern: /^bg-(pink|amber|purple|teal|blue|gray|green|red|slate|yellow|orange|slate)-(50|100|200|300|400|500)$/ },
    { pattern: /^text-(pink|amber|purple|teal|blue|gray|green|red|slate|yellow|orange)-(400|500|600|700|800)$/ },
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
        },
      },
      fontSize: {
        '2xs': '0.65rem',
      },
    },
  },
  plugins: [],
}
export default config
