import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'fb_ui_library',
      fileName: 'fb-ui-library',
    },
  },
  server: { port: 5176 },
});
