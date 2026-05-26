import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Em dev, o browser fala com o Vite (ex.: :5173) em /api; este proxy encaminha para a API real.
 * Defina em frontend/.env: DEV_API_PROXY_TARGET=http://localhost:PORTA_DO_BACKEND
 *
 * Acesso pelo celular via cloudflared: defina DEV_TUNNEL_HOST=somente-o-hostname (sem https://).
 * Sem isso, o Vite injeta localhost nos módulos/HMR e o celular tenta falar com o localhost dele → ERR_EMPTY_RESPONSE.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.DEV_API_PROXY_TARGET || 'http://localhost:4000';

  const tunnelHost = env.DEV_TUNNEL_HOST?.replace(/^https?:\/\//i, '').split('/')[0]?.trim();

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: true,
      ...(tunnelHost
        ? {
            /** URLs de módulos (@vite/client, /src/...) passam a usar o host público */
            origin: `https://${tunnelHost}`,
            allowedHosts: true,
            hmr: {
              protocol: 'wss' as const,
              host: tunnelHost,
              clientPort: 443,
            },
          }
        : {}),
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
