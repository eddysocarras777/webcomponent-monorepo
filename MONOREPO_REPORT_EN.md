# Monorepo Report

## 1. General overview

This monorepo is organized with `pnpm workspaces` and groups three packages that collaborate with each other:

- `packages/remote-webcomponent`: publishes a remote ESM module that registers a Web Component.
- `packages/fb-ui-library`: exposes a reusable React wrapper for loading remote Web Components by URL.
- `packages/host-react`: a consumer React application that uses the wrapper to load the remote component from a public URL.

The core idea is to separate the remote component from the host application. The host does not import the Web Component directly at build time. Instead, it receives a URL, loads the remote script at runtime, and then renders the corresponding custom element.

## 2. How the monorepo works

The root workspace defines scripts for development, build, and formatting. `pnpm-workspace.yaml` groups all packages under `packages/*`, which makes it possible to install dependencies and resolve internal references from a single root.

The current functional flow is:

1. `remote-webcomponent` builds a `remote-button.es.js` file with Vite in library mode.
2. That remote file registers the `remote-button` custom element.
3. `host-react` obtains the remote URL from `VITE_REMOTE_BUTTON_URL` or from a public fallback URL.
4. `fb-ui-library` injects the remote ESM script into the browser.
5. Once the module is loaded, `fb-ui-library` dynamically creates the `<remote-button>` element.
6. The host passes props and listeners to the Web Component.
7. The Web Component emits the `remote-click` event with a payload that currently includes a formatted date and the click source.

## 3. What each project does

### 3.1 `packages/remote-webcomponent`

This package is the publishable remote. Its responsibility is to generate the bundle that can later be served from a public URL.

At the moment, the remote bundle registers a single custom element, `remote-button`, and that custom element renders two buttons:

- a button implemented with Lit
- a button implemented with React inside the Web Component shadow DOM

Both buttons dispatch the same `remote-click` event, while indicating in `detail.source` whether the click came from `lit` or from `react`.

### 3.2 `packages/fb-ui-library`

This package acts as an adapter between React and remote Web Components. It does not know the concrete implementation of the remote component. It only knows:

- which URL to load
- which HTML tag to render
- which props to map
- which events to listen to

Its main utility is to hide the manual work of injecting scripts and handling custom elements from a React application.

### 3.3 `packages/host-react`

This package is the consumer application. It is the place where the final result is shown on screen.

Its role is to:

- decide which remote URL to use
- render the `WebComponentWrapper`
- pass properties to the remote component
- react to the `remote-click` event

## 4. Technical flow across packages

### 4.1 Remote loading

`host-react` passes a URL to `WebComponentWrapper`. That wrapper creates a `<script type="module">` pointing to the remote bundle. When the script finishes loading, the browser already knows about the `remote-button` custom element.

### 4.2 Custom element rendering

Once the remote module is loaded, the wrapper creates the element using `React.createElement(tag, { ref })`. The `ref` is then used to write properties and register native listeners.

### 4.3 Prop passing

Props are assigned first as JavaScript properties on the element. If that fails, the wrapper falls back to HTML attributes. This makes it possible to work with Web Components that accept both properties and attributes.

### 4.4 Events

The remote emits `remote-click`. The host registers that event using the `'remote-click'` name and, when it receives it, shows an `alert` with the date contained in `detail.time`.

## 5. File-by-file explanation (`.ts` and `.tsx`)

### 5.1 `packages/remote-webcomponent/vite.config.ts`

Main responsibility: configure the remote package build.

Important points:

- Uses Vite's `defineConfig`.
- Defines `process.env.NODE_ENV` as `production` to avoid React bundle errors in the browser.
- Builds in library mode.
- Uses `src/remote-entry.ts` as the bundle entry.
- Emits the output file as `remote-button.es.js`.
- Uses port `5175` in development.

This file is key because it controls how the remote is transformed into a publishable artifact.

### 5.2 `packages/remote-webcomponent/src/remote-entry.ts`

Main responsibility: public entry point of the remote.

What it does:

- Imports `./remote-button` to force custom element registration when the module loads.
- Declares an extension of the `window` object.
- Exposes `window.RemoteWebComponent = { tag: 'remote-button' }` as an optional global helper.

This is the file actually bundled as the remote entry. Without it, the bundle would not know what to register when loaded.

### 5.3 `packages/remote-webcomponent/src/remote-button.ts`

Main responsibility: implement the remote Web Component.

What it does:

- Defines a `formatDateTime` function in plain JavaScript to produce dates in `dd/mm/yyyy hh:mm:ss` format.
- Declares the `RemoteButton` class extending `LitElement`.
- Defines host and button styles.
- Declares reactive `label` and `color` properties.
- Uses `label = 'Remote Button Lit'` and `color = '#1976d2'` as default values.
- Keeps a `reactRoot` instance to mount React inside the shadow DOM.
- Emits the `remote-click` event with formatted `detail.time` and a `detail.source` indicating whether the click came from Lit or React.
- Renders the Lit button directly with a Lit template.
- Reserves a `<div data-react-button-root></div>` container to mount the React button.
- In `firstUpdated` and `updated`, renders the React button using `createRoot`.
- In `disconnectedCallback`, properly unmounts the React tree.

This file is the heart of the remote. Lit and React coexist here inside the same custom element.

### 5.4 `packages/remote-webcomponent/src/remote-button-react.tsx`

Main responsibility: define the React version of the button mounted inside the Web Component.

What it does:

- Imports `React` so the TSX compiles correctly with the runtime used by this package.
- Declares the `RemoteButtonReactProps` type as `Readonly`.
- Accepts `label`, `color`, and `onClick`.
- Uses `Remote Button ReactJs` as the default label.
- Uses `#1976d2` as the default color.
- Returns a React `<button>` styled inline.

This file is not exposed directly to the host. It is used by `remote-button.ts` as part of the internal Web Component implementation.

### 5.5 `packages/host-react/vite.config.ts`

Main responsibility: configure the host React application in development.

What it does:

- Enables Vite's React plugin.
- Configures the dev server on port `5173`.

This is a minimal configuration because the host does not require a complex build. Its actual logic lives in `src`.

### 5.6 `packages/host-react/src/main.tsx`

Main responsibility: bootstrap the host React application.

What it does:

- Imports `createRoot` from `react-dom/client`.
- Imports the `App` component.
- Mounts React onto the `#root` HTML node.

This is the classic entry point of a React 18 application.

### 5.7 `packages/host-react/src/App.tsx`

Main responsibility: compose the host UI and consume the remote.

What it does:

- Reads environment variables from `import.meta.env`.
- Obtains the remote URL from `VITE_REMOTE_BUTTON_URL` or from the GitHub Pages public URL.
- Defines `handleRemoteClick`, which takes `detail.time` from the event and shows it in an `alert`.
- Renders `WebComponentWrapper` with:
  - `tag="remote-button"`
  - `url={remoteButtonUrl}`
  - `props={{ color: '#e91e63' }}` to override only the Lit button color
  - the `remote-click` listener
  - a loading fallback

This file demonstrates the full use case: a React application consuming a remote Web Component by URL.

### 5.8 `packages/fb-ui-library/vite.config.ts`

Main responsibility: configure the wrapper library build.

What it does:

- Uses the React plugin.
- Builds the library with `src/index.ts` as the entry.
- Defines the output name as `fb-ui-library`.
- Uses port `5176` for development.

This package behaves as a shared library within the monorepo.

### 5.9 `packages/fb-ui-library/src/loadRemoteWebComponent.tsx`

Main responsibility: adapt React to a remote Web Component loaded dynamically.

What it does:

- Defines the `WebComponentWrapperProps` type.
- Implements `injectModuleScript(url)` to insert a `script type="module"` into `document.head`.
- Avoids injecting the same script twice if one with that URL already exists.
- In `WebComponentWrapper`, uses `useRef` to keep a reference to the custom element.
- Uses `loaded` state to track whether the remote script has already loaded.
- Uses `error` state to handle loading failures.
- In one `useEffect`, loads the remote script.
- In another `useEffect`, assigns props to the custom element and registers listeners.
- Returns a fallback while the remote is still loading.
- Returns an error message if loading fails.
- When everything is ready, creates the custom element with `React.createElement(tag, { ref })`.

This file is the most important integration piece in the monorepo because it decouples the host from the remote loading mechanism.

### 5.10 `packages/fb-ui-library/src/index.ts`

Main responsibility: public entry point of the wrapper library.

What it does:

- Re-exports everything from `./loadRemoteWebComponent`.

This is a small file, but it is important because it encapsulates the public API of the library.

## 6. Important relationships between files

- `packages/remote-webcomponent/vite.config.ts` builds the bundle whose entry is `packages/remote-webcomponent/src/remote-entry.ts`.
- `packages/remote-webcomponent/src/remote-entry.ts` registers the custom element defined in `packages/remote-webcomponent/src/remote-button.ts`.
- `packages/remote-webcomponent/src/remote-button.ts` internally uses `packages/remote-webcomponent/src/remote-button-react.tsx`.
- `packages/host-react/src/App.tsx` consumes the remote using `packages/fb-ui-library/src/loadRemoteWebComponent.tsx`.
- `packages/fb-ui-library/src/index.ts` exposes the API used by the host.

## 7. Current functional state

With the current code, the intended behavior of the system is the following:

- the remote public URL should load a Web Component called `remote-button`
- that Web Component should render two buttons inside its shadow DOM
- both buttons should emit `remote-click`
- `detail.time` should already come formatted as `dd/mm/yyyy hh:mm:ss`
- the host should only consume the event and display it

If the public URL shows a different version, the problem is not necessarily in these source files. It may simply mean that the published remote artifact has not been updated yet.

## 8. Conclusion

This monorepo implements a lightweight microfrontend-style architecture based on remote Web Components loaded by URL. `remote-webcomponent` publishes the remote artifact, `fb-ui-library` provides the integration layer for React, and `host-react` demonstrates the final consumption.

The separation is well defined:

- the remote encapsulates the publishable UI
- the shared library encapsulates dynamic loading and the bridge between React and custom elements
- the host encapsulates the final user experience and the remote URL configuration

The end result is a system where the remote component can evolve and be deployed independently, while the host consumes it at runtime.
