import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        proxyTimeout: 300000,  // 5 min — allows long-running embed-all requests
        timeout: 300000,
      },
      '/socket.io': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            // Backend not running — return 503 instead of leaving http-proxy to send 500
            if (err.message.includes('ECONNREFUSED') || err.message.includes('ECONNABORTED')) {
              if ('writeHead' in res && typeof res.writeHead === 'function') {
                res.writeHead(503, { 'Content-Type': 'text/plain' });
                res.end('Backend unavailable');
              }
              return;
            }
            console.error('socket.io proxy error', err);
          });
        },
      },
    },
  },
})
