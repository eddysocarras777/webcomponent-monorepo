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
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        lineHeight: 1,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flex: '0 0 auto', display: 'block' }}
      >
        <circle cx="12" cy="12" r="2.1" fill="currentColor" />
        <ellipse cx="12" cy="12" rx="9" ry="3.8" stroke="currentColor" strokeWidth="1.6" />
        <ellipse
          cx="12"
          cy="12"
          rx="9"
          ry="3.8"
          stroke="currentColor"
          strokeWidth="1.6"
          transform="rotate(60 12 12)"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="9"
          ry="3.8"
          stroke="currentColor"
          strokeWidth="1.6"
          transform="rotate(120 12 12)"
        />
      </svg>
      {label}
    </button>
  );
}
