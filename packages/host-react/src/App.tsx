import React from 'react';
import { WebComponentWrapper } from 'fb-ui-library';

/**
 * @name App
 * @description Renderiza la aplicación host de React y carga el Web Component remoto mediante la librería compartida.
 * @returns {React.ReactElement} La interfaz principal del host con el wrapper del componente remoto.
 * @remarks La URL del Web Component queda fija para consumir el artefacto publicado en GitHub Pages.
 */
export default function App() {
  const remoteButtonUrl =
    'https://eddysocarras777.github.io/webcomponent-monorepo/remote-button.es.js';

  /**
   * @name handleRemoteClick
   * @description Atiende el evento personalizado emitido por el Web Component remoto y muestra la hora del clic.
   * @param {Event} e Evento recibido desde el custom element.
   * @returns {void} No retorna ningún valor.
   * @remarks Se espera que el evento sea un `CustomEvent` con un `detail.time` serializable.
   */
  const handleRemoteClick = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    alert('Remote clicked at ' + detail.time);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        textAlign: 'center',
        gap: 12,
        fontFamily: 'ui-sans-serif system-ui, Arial, sans-serif',
      }}
    >
      <h1>Host React App</h1>
      <p>Below we load a remote Web Component by URL.</p>
      <WebComponentWrapper
        tag="remote-button"
        url={remoteButtonUrl}
        props={{ color: '#e91e63' }}
        on={{ 'remote-click': handleRemoteClick }}
        fallback={<div>Loading remote web component...</div>}
      />
    </div>
  );
}
