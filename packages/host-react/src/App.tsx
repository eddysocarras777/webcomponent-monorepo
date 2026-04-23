import React from 'react';
import { WebComponentWrapper } from '../../fb-ui-library/src/loadRemoteWebComponent';

export default function App() {
  const remoteButtonUrl =
    (import.meta as any).env?.VITE_REMOTE_BUTTON_URL ||
    'http://localhost:5175/dist/remote-button.es.js';

  const handleRemoteClick = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    alert('Remote clicked at ' + detail.time);
  };
  return (
    <div style={{ padding: 20 }}>
      <h1>Host React App</h1>
      <p>Below we load a remote Web Component by URL.</p>
      <WebComponentWrapper
        tag="remote-button"
        url={remoteButtonUrl}
        props={{ label: 'Hola desde Host', color: '#e91e63' }}
        on={{ 'remote-click': handleRemoteClick }}
        fallback={<div>Loading remote web component...</div>}
      />
    </div>
  );
}
