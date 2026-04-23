# Web Component Monorepo Example

Contiene tres paquetes:

- packages/remote-webcomponent: Web Component (Lit) que builda a dist/remote-button.es.js
- packages/fb-ui-library: wrapper React para cargar Web Components dinámicamente
- packages/host-react: app React que consume el Web Component por URL

## Uso local con pnpm

1. Instalar pnpm y dependencias:
   pnpm install
2. Ejecutar en dev:
   pnpm --filter remote-webcomponent dev
   pnpm --filter host-react dev
3. Build del remote:
   pnpm --filter remote-webcomponent build
   El artefacto estará en packages/remote-webcomponent/dist/remote-button.es.js
4. Subir el archivo dist a un CDN y usar la URL en host-react/src/App.tsx (prop url).

## Notas

- El wrapper en fb-ui-library inyecta el script ESM y mapea props y eventos.
- Para Storybook o desarrollo offline, copia el archivo dist localmente y apunta la URL a http://localhost:5175/dist/remote-button.es.js
