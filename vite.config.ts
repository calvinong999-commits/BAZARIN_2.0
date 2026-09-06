import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  // loadEnv dengan prefix '' = load SEMUA env vars termasuk VITE_* dan non-VITE_*
  const env = loadEnv(mode, process.cwd(), '');

  // Baca dari VITE_MIDTRANS_SERVER_KEY (sesuai .env user)
  const SERVER_KEY = (
    env.VITE_MIDTRANS_SERVER_KEY ||
    env.MIDTRANS_SERVER_KEY ||
    ''
  ).trim();

  if (!SERVER_KEY) {
    console.error('[Vite Config] ⚠ VITE_MIDTRANS_SERVER_KEY tidak ditemukan di .env!');
  } else {
    console.log('[Vite Config] ✓ Midtrans Server Key:', SERVER_KEY.slice(0, 20) + '...');
  }

  // Format Basic Auth: Base64("ServerKey:")
  const encodedKey = Buffer.from(`${SERVER_KEY}:`).toString('base64');

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },

    server: {
      host: true,
      port: 5173,
      proxy: {
        // /midtrans-api/* → https://api.sandbox.midtrans.com/*
        // Vite Node.js server yang kirim request ke Midtrans (tidak ada CORS)
        '/midtrans-api': {
          target: 'https://api.sandbox.midtrans.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/midtrans-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              // Inject Authorization header di sisi server — tidak bocor ke browser
              proxyReq.setHeader('Authorization', `Basic ${encodedKey}`);
              proxyReq.setHeader('Accept', 'application/json');
              console.log(`[Midtrans Proxy] ${req.method} ${req.url}`);
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log(`[Midtrans Proxy] ← ${proxyRes.statusCode} ${req.url}`);
            });
            proxy.on('error', (err) => {
              console.error('[Midtrans Proxy] Error:', err.message);
            });
          },
        },
        '/midtrans-snap': {
          target: 'https://app.sandbox.midtrans.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/midtrans-snap/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              proxyReq.setHeader('Authorization', `Basic ${encodedKey}`);
              proxyReq.setHeader('Accept', 'application/json');
              console.log(`[Midtrans Snap Proxy] ${req.method} ${req.url}`);
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log(`[Midtrans Snap Proxy] ← ${proxyRes.statusCode} ${req.url}`);
            });
            proxy.on('error', (err) => {
              console.error('[Midtrans Snap Proxy] Error:', err.message);
            });
          },
        },
      },
    },

    preview: {
      host: true,
      port: 4173,
    },

    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});