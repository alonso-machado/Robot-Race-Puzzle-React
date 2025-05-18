/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Add any custom colors here
      },
    },
  },
  corePlugins: {
    // Enable all v4 core plugins
    preflight: true,
  },
  future: {
    // Enable future CSS features
    hoverOnlyWhenSupported: true,
  },
  plugins: [
    // Add any additional plugins here
  ],
};
