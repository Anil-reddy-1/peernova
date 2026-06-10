/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@peer-tutoring/config/tailwind/preset')],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};
