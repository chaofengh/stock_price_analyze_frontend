import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const clientEnv = loadEnv(mode, process.cwd(), 'REACT_APP_');

  return {
    plugins: [react()],
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.js$/,
      exclude: [],
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
    },
    build: {
      outDir: 'build',
      emptyOutDir: true,
    },
    define:
      mode === 'test'
        ? undefined
        : {
            'process.env': {
              ...clientEnv,
              NODE_ENV: mode,
            },
          },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.js'],
      globals: true,
      clearMocks: true,
      restoreMocks: true,
    },
  };
});
