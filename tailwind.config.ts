import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/popup/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          green: '#25D366',
          dark: '#0a0e27',
          light: '#f0f2f5',
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};

export default config;
