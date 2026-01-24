import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: './',
    emptyOutDir: false, // Don't delete code.js when building UI
    minify: 'esbuild', // Use esbuild for faster, more compatible minification
    rollupOptions: {
      input: resolve(__dirname, './src/ui/index.tsx'),
      output: {
        entryFileNames: 'ui.js',
        format: 'iife',
        inlineDynamicImports: true,
        name: 'MascotUI',
        generatedCode: {
          constBindings: true,
        },
        // Ensure the IIFE executes immediately
        intro: 'console.log("[Mascot] ui.js bundle starting...");',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  publicDir: false, // Don't copy public files
});
