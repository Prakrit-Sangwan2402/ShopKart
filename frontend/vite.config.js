import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/products': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/wishlist': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/cart': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/orders': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
