// C:\Users\hemant\Downloads\synapse\tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Make sure this covers components in src
  ],
  darkMode: 'class', // Enable dark mode based on class
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        primary: { // Example primary color definition
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Add other custom colors if needed
      },
      // Add animation keyframes if needed
      keyframes: {
         fadeInUp: {
           'from': { opacity: '0', transform: 'translateY(1rem)' },
           'to': { opacity: '1', transform: 'translateY(0)' },
         },
         // Add other keyframes used in index.css or components
      },
      animation: {
         fadeInUp: 'fadeInUp 0.4s ease-out forwards',
         // Add other animations
      }
    },
  },
  plugins: [],
}