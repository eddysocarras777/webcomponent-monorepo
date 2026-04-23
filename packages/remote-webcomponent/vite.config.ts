import { defineConfig } from 'vite';
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: 'src/remote-entry.ts',
      name: 'remote_webcomponent',
      formats: ['es'],
      fileName: () => 'remote-button.es.js',
    },
  },
  server: {
    cors: true,
    port: 5175,
  },
});
