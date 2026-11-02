import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { ink: '#20302b', forest: '#1c3b32', olive: '#78836d', linen: '#f8f6f0', sand: '#e8dfcf', clay: '#b66a49' }, fontFamily: { serif: ['Georgia', 'serif'], sans: ['Arial', 'sans-serif'] }, boxShadow: { soft: '0 18px 50px rgba(28,59,50,.09)' } } }, plugins: [] };
export default config;
