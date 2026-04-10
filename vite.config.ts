import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: 'localhost', // FSEC-7: restrict to localhost; set '0.0.0.0' only for LAN demos
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        }
      },
    },
    plugins: [react()],

    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;
            if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
            if (id.includes('react-helmet-async')) return 'vendor-react';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('framer-motion')) return 'vendor-motion';
            // PERF-F4: Explicit chunks for heavy, route-specific libraries
            if (id.includes('ethers')) return 'vendor-ethers';
            if (id.includes('prismjs')) return 'vendor-prism';
            if (id.includes('dompurify')) return 'vendor-dompurify';
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
