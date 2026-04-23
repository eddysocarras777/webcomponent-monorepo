import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    lib: {
      entry: 'src/remote-entry.ts',
      name: 'remote_webcomponent',
      formats: ['es'],
      fileName: () => 'remote-button.es.js',
    },
  },
  server: { port: 5175 },
});
