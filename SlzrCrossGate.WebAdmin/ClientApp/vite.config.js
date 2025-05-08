import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://localhost:7296',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: '../wwwroot',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== 'production'
  }
});
