import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  root: '.',
  // ВАЖНО: укажите полный путь к вашей папке dist
  base: '/Apps/otchet_tasks_manager/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets'
  },
  server: {
    host: true
  }
});