import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  base: isGitHubPages ? '/RegionalAnesthesiaTrainer/' : './',
  plugins: [react()],
  server: { fs: { allow: ['../..'] } },
  build: { target: 'es2022' }
});
