import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.BACKEND_URL || env.VITE_API_URL || 'http://localhost:3000';

  return {
    plugins: [react()],
    resolve: {
      // 🎯 FORCE VITE TO DEDUPLICATE THE COMPILER: Prevents dual-instance context creation
      dedupe: ['react-router'],
    },
    optimizeDeps: {
      // Pre-bundle react-router instantly into a single global memory layer
      include: ['react-router'],
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.js',
      css: true,

      /* 🌟 THE AUTOMATED ISOLATION LAYER FOR FULL-SUITE PASSES: */
      mockReset: true,      // Automatically clears implementation code changes between every single row test
      restoreMocks: true,   // Automatically restores spy hooks back to their native, unpolluted states
      clearMocks: true,     // Trashes call history counters between test passes completely

      // Stops parallel execution pipelines from stepping on shared customFetch intercept references
      sequence: {
        shuffle: false,
        concurrent: false
      },
      
      /* 🚀 VITEST v4 MODERN SINGLE-THREAD LOCK:
         Hoisted directly to the top layer to prevent deprecation alerts */
      pool: 'threads',
      singleThread: true
    },
  };
});
