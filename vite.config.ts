import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves project sites below /<repository>/ while local Vite
  // keeps assets rooted at /. The workflow sets GITHUB_ACTIONS automatically.
  base: process.env.GITHUB_ACTIONS ? '/parallel-planets/' : '/',
  test: {
    environment: 'node',
    globals: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
