/** @type {import('tailwindcss').Config} */
export default {
  content: ['./node_modules/flowbite/**/*.js','./node_modules/flowbite-react/lib/esm/**/*.js', './src/**/*.jsx', './index.html',
],
  theme: {
    extend: {},
  },
  plugins: [        require('flowbite/plugin')
],
}

