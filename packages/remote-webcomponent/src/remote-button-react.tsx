import React from 'react';

type RemoteButtonReactProps = Readonly<{
  label?: string;
  color?: string;
  onClick?: () => void;
}>;

/**
 * @name RemoteButtonReact
 * @description Renderiza la variante React del botón remoto que se incrusta dentro del Web Component principal.
 * @param {RemoteButtonReactProps} props Propiedades visuales y callback de clic del botón.
 * @returns {React.ReactElement} Un botón estilizado listo para renderizarse dentro de React.
 * @remarks Este componente es intencionalmente simple para demostrar la convivencia entre Lit y React.
 */
export function RemoteButtonReact({
  label = 'Remote Button ReactJs',
  color = '#1976d2',
  onClick,
}: RemoteButtonReactProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: color,
        color: 'white',
        padding: '8px 12px',
        fontSize: 14,
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
