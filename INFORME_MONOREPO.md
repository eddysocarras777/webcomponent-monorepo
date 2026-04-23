# Informe del Monorepo

## 1. Resumen general

Este monorepo está organizado con `pnpm workspaces` y agrupa tres paquetes que colaboran entre sí:

- `packages/remote-webcomponent`: publica un módulo ESM remoto que registra un Web Component.
- `packages/fb-ui-library`: expone un wrapper React reutilizable para cargar Web Components remotos por URL.
- `packages/host-react`: aplicación React consumidora que usa el wrapper para cargar el componente remoto desde una URL pública.

La idea central es separar el componente remoto de la aplicación host. El host no importa el Web Component directamente en build time, sino que recibe una URL, carga el script remoto en runtime y luego renderiza el custom element correspondiente.

## 2. Cómo funciona el monorepo

El workspace raíz define scripts para desarrollo, build y formato. `pnpm-workspace.yaml` agrupa todos los paquetes bajo `packages/*`, lo que permite instalar dependencias y resolver referencias internas desde una sola raíz.

El flujo funcional actual es este:

1. `remote-webcomponent` compila un archivo `remote-button.es.js` con Vite en modo librería.
2. Ese archivo remoto registra el custom element `remote-button`.
3. `host-react` obtiene la URL del remoto desde `VITE_REMOTE_BUTTON_URL` o desde un fallback público.
4. `fb-ui-library` inyecta el script ESM remoto en el navegador.
5. Una vez cargado el módulo, `fb-ui-library` crea dinámicamente el elemento `<remote-button>`.
6. El host le pasa props y listeners al Web Component.
7. El Web Component emite el evento `remote-click` con un detalle que hoy incluye fecha formateada y el origen del click.

## 3. Qué hace cada proyecto

### 3.1 `packages/remote-webcomponent`

Este paquete es el remoto publicable. Su responsabilidad es generar el bundle que luego se puede servir desde una URL pública.

Actualmente el bundle remoto registra un único custom element, `remote-button`, y ese custom element renderiza dos botones:

- un botón implementado con Lit
- un botón implementado con React dentro del shadow DOM del Web Component

Ambos disparan el mismo evento `remote-click`, pero indicando en `detail.source` si el click vino de `lit` o de `react`.

### 3.2 `packages/fb-ui-library`

Este paquete actúa como adaptador entre React y Web Components remotos. No conoce la implementación concreta del componente remoto, solo sabe:

- qué URL cargar
- qué tag HTML renderizar
- qué props mapear
- qué eventos escuchar

Su utilidad principal es ocultar la parte manual de inyectar scripts y manejar custom elements desde una app React.

### 3.3 `packages/host-react`

Este paquete es la aplicación consumidora. Es el punto donde se ve el resultado final en pantalla.

Su función es:

- decidir qué URL del remoto utilizar
- renderizar el wrapper `WebComponentWrapper`
- pasar propiedades al componente remoto
- reaccionar al evento `remote-click`

## 4. Flujo técnico entre paquetes

### 4.1 Carga del remoto

`host-react` le pasa una URL a `WebComponentWrapper`. Ese wrapper crea un `<script type="module">` apuntando al bundle remoto. Cuando el script termina de cargar, el navegador ya conoce el custom element `remote-button`.

### 4.2 Render del custom element

Una vez cargado el módulo remoto, el wrapper crea el elemento usando `React.createElement(tag, { ref })`. El `ref` se usa luego para escribir propiedades y registrar listeners nativos.

### 4.3 Paso de props

Las props se asignan primero como propiedades JavaScript del elemento. Si eso falla, el wrapper hace fallback a atributos HTML. Esto permite trabajar con Web Components que aceptan tanto properties como attributes.

### 4.4 Eventos

El remoto emite `remote-click`. El host registra ese evento con el nombre `'remote-click'` y, al recibirlo, muestra un `alert` con la fecha enviada en `detail.time`.

## 5. Archivo por archivo (`.ts` y `.tsx`)

### 5.1 `packages/remote-webcomponent/vite.config.ts`

Responsabilidad principal: configurar el build del paquete remoto.

Puntos importantes:

- Usa `defineConfig` de Vite.
- Define `process.env.NODE_ENV` como `production` para evitar errores del bundle de React en navegador.
- Compila en modo librería.
- El entry del bundle es `src/remote-entry.ts`.
- El nombre de salida del archivo es `remote-button.es.js`.
- En desarrollo usa el puerto `5175`.

Este archivo es clave porque controla cómo se transforma el remoto en un artefacto publicable por URL.

### 5.2 `packages/remote-webcomponent/src/remote-entry.ts`

Responsabilidad principal: punto de entrada público del remoto.

Qué hace:

- Importa `./remote-button` para forzar el registro del custom element cuando se carga el módulo.
- Declara una ampliación del objeto `window`.
- Expone `window.RemoteWebComponent = { tag: 'remote-button' }` como helper global opcional.

Es el archivo que realmente se empaqueta como entry del remoto. Sin él, el bundle no sabría qué registrar al cargarse.

### 5.3 `packages/remote-webcomponent/src/remote-button.ts`

Responsabilidad principal: implementar el Web Component remoto.

Qué hace:

- Define una función `formatDateTime` en JavaScript puro para producir fechas en formato `dd/mm/yyyy hh:mm:ss`.
- Declara la clase `RemoteButton` extendiendo `LitElement`.
- Define estilos del host y de los botones.
- Declara propiedades reactivas `label` y `color`.
- Usa `label = 'Remote Button Lit'` y `color = '#1976d2'` como valores por defecto.
- Mantiene una instancia `reactRoot` para montar React dentro del shadow DOM.
- Emite el evento `remote-click` con `detail.time` formateado y `detail.source` indicando si el click vino de Lit o React.
- Renderiza el botón Lit directamente con template de Lit.
- Reserva un contenedor `<div data-react-button-root></div>` para montar el botón React.
- En `firstUpdated` y `updated` renderiza el botón React usando `createRoot`.
- En `disconnectedCallback` desmonta correctamente el árbol React.

Este archivo es el corazón del remoto. Aquí conviven Lit y React dentro del mismo custom element.

### 5.4 `packages/remote-webcomponent/src/remote-button-react.tsx`

Responsabilidad principal: definir la versión React del botón que se monta dentro del Web Component.

Qué hace:

- Importa `React` para que el TSX compile correctamente al runtime usado en este paquete.
- Declara el tipo `RemoteButtonReactProps` como `Readonly`.
- Acepta `label`, `color` y `onClick`.
- Usa `Remote Button ReactJs` como label por defecto.
- Usa `#1976d2` como color por defecto.
- Devuelve un `<button>` React estilizado inline.

Este archivo no se expone directamente al host. Lo utiliza `remote-button.ts` como parte de la implementación interna del Web Component.

### 5.5 `packages/host-react/vite.config.ts`

Responsabilidad principal: configurar la aplicación host en desarrollo.

Qué hace:

- Activa el plugin React de Vite.
- Configura el servidor de desarrollo en el puerto `5173`.

Es una configuración mínima porque el host no necesita build compleja; su lógica real está en `src`.

### 5.6 `packages/host-react/src/main.tsx`

Responsabilidad principal: bootstrapping de la app React host.

Qué hace:

- Importa `createRoot` desde `react-dom/client`.
- Importa el componente `App`.
- Monta React sobre el nodo `#root` del HTML.

Es el punto de entrada clásico de una aplicación React con React 18.

### 5.7 `packages/host-react/src/App.tsx`

Responsabilidad principal: componer la UI host y consumir el remoto.

Qué hace:

- Lee variables de entorno desde `import.meta.env`.
- Obtiene la URL remota desde `VITE_REMOTE_BUTTON_URL` o desde la URL pública de GitHub Pages.
- Define `handleRemoteClick`, que toma `detail.time` del evento y lo muestra en un `alert`.
- Renderiza `WebComponentWrapper` con:
  - `tag="remote-button"`
  - `url={remoteButtonUrl}`
  - `props={{ color: '#e91e63' }}` para sobreescribir solo el color del botón Lit
  - el listener del evento `remote-click`
  - un fallback de carga

Este archivo demuestra el caso de uso completo: una app React consumiendo un Web Component remoto por URL.

### 5.8 `packages/fb-ui-library/vite.config.ts`

Responsabilidad principal: configurar el build de la librería wrapper.

Qué hace:

- Usa el plugin React.
- Compila la librería con entry `src/index.ts`.
- Define el nombre de salida como `fb-ui-library`.
- Usa el puerto `5176` para desarrollo.

Este paquete se comporta como librería compartida dentro del monorepo.

### 5.9 `packages/fb-ui-library/src/loadRemoteWebComponent.tsx`

Responsabilidad principal: adaptar React a un Web Component remoto cargado dinámicamente.

Qué hace:

- Define el tipo `WebComponentWrapperProps`.
- Implementa `injectModuleScript(url)` para insertar un `script type="module"` en `document.head`.
- Evita inyectar dos veces el mismo script si ya existe uno con esa URL.
- En `WebComponentWrapper`, usa `useRef` para guardar referencia al elemento custom.
- Usa estado `loaded` para saber si el script remoto ya cargó.
- Usa estado `error` para manejar errores de carga.
- En un `useEffect`, carga el script remoto.
- En otro `useEffect`, asigna props al custom element y registra listeners.
- Devuelve fallback mientras el remoto no carga.
- Devuelve mensaje de error si la carga falla.
- Cuando todo está listo, crea el custom element con `React.createElement(tag, { ref })`.

Este archivo es la pieza de integración más importante del monorepo porque desacopla el host del mecanismo de carga remota.

### 5.10 `packages/fb-ui-library/src/index.ts`

Responsabilidad principal: punto de entrada público de la librería wrapper.

Qué hace:

- Reexporta todo desde `./loadRemoteWebComponent`.

Es un archivo pequeño, pero importante para encapsular la API pública de la librería.

## 6. Relaciones importantes entre archivos

- `packages/remote-webcomponent/vite.config.ts` construye el bundle cuyo entry es `packages/remote-webcomponent/src/remote-entry.ts`.
- `packages/remote-webcomponent/src/remote-entry.ts` registra el custom element definido en `packages/remote-webcomponent/src/remote-button.ts`.
- `packages/remote-webcomponent/src/remote-button.ts` usa internamente `packages/remote-webcomponent/src/remote-button-react.tsx`.
- `packages/host-react/src/App.tsx` consume el remoto usando `packages/fb-ui-library/src/loadRemoteWebComponent.tsx`.
- `packages/fb-ui-library/src/index.ts` expone la API usada por el host.

## 7. Estado funcional actual

Con el código actual, la intención del sistema es la siguiente:

- la URL pública del remoto debe cargar un Web Component llamado `remote-button`
- ese Web Component debe mostrar dos botones dentro de su shadow DOM
- ambos botones deben emitir `remote-click`
- `detail.time` debe venir ya formateado como `dd/mm/yyyy hh:mm:ss`
- el host solo consume el evento y lo muestra

Si la URL pública muestra una versión distinta, el problema no está necesariamente en estos archivos fuente, sino en que el artefacto remoto publicado no se haya actualizado todavía.

## 8. Conclusión

Este monorepo implementa una arquitectura de microfrontend ligera basada en Web Components remotos cargados por URL. `remote-webcomponent` publica el artefacto remoto, `fb-ui-library` ofrece la capa de integración para React y `host-react` demuestra el consumo final.

La separación está bien definida:

- el remoto encapsula la UI publicable
- la librería compartida encapsula la carga dinámica y el bridging entre React y custom elements
- el host encapsula la experiencia de usuario final y la configuración de la URL remota

El resultado es un sistema donde el componente remoto puede evolucionar y desplegarse de forma independiente, mientras el host lo consume en tiempo de ejecución.
