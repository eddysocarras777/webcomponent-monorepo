import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { LitElement, html, css } from 'lit';
import { RemoteButtonReact } from './remote-button-react';

type RemoteClickSource = 'lit' | 'react';

type RemoteClickDetail = {
  time: string;
  source: RemoteClickSource;
};

/**
 * @name formatDateTime
 * @description Convierte una fecha en una cadena legible con formato `dd/mm/yyyy hh:mm:ss`.
 * @param {Date} date Fecha que se desea serializar.
 * @returns {string} Fecha y hora formateadas para enviarlas en eventos del componente remoto.
 * @remarks El formato es local y está pensado para mostrar información humana, no para persistencia.
 */
function formatDateTime(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Web component remoto que expone un boton Lit y un boton React para integraciones host.
 *
 * @summary Registra el tag `remote-button` y emite un evento con la fecha y el origen del clic.
 * @tag remote-button
 * @attr {string} label Texto del boton Lit que se renderiza en el shadow DOM.
 * @attr {string} color Color principal usado en el titulo y en el boton Lit.
 * @fires remote-click - Se emite cuando cualquiera de los dos botones es presionado.
 */
export class RemoteButton extends LitElement {
  static readonly styles = css`
    :host {
      display: inline-flex;
      flex-direction: column;
      gap: 12px;
      font-family: system-ui, Arial;
    }
    button {
      padding: 8px 12px;
      font-size: 14px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      line-height: 1;
    }

    .button-icon {
      width: 14px;
      height: 14px;
      flex: 0 0 auto;
      display: block;
    }

    h3 {
      margin: 0;
      text-align: center;
    }
  `;

  static readonly properties = {
    label: { type: String },
    color: { type: String },
  };

  /** Texto visible del boton Lit renderizado por el componente. */
  label = 'Remote Button Lit';

  /** Color principal aplicado al titulo y al boton Lit. */
  color = '#f82727';

  private reactRoot: Root | null = null;

  /**
   * @name dispatchRemoteClick
   * @description Emite un evento personalizado con la fecha y el origen del clic dentro del Web Component.
   * @param {RemoteClickSource} source Origen del clic que disparó el evento.
   * @returns {void} No retorna ningún valor.
   * @remarks El evento se publica con `bubbles` y `composed` para que el host pueda escucharlo fuera del shadow DOM.
   */
  private dispatchRemoteClick(source: RemoteClickSource) {
    const detail: RemoteClickDetail = {
      time: formatDateTime(new Date()),
      source,
    };

    this.dispatchEvent(
      new CustomEvent<RemoteClickDetail>('remote-click', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * @name onLitClick
   * @description Maneja el clic del botón renderizado con Lit y delega la emisión del evento remoto.
   * @returns {void} No retorna ningún valor.
   * @remarks Se expone como propiedad para reutilizar la misma referencia entre renders.
   */
  private readonly onLitClick = () => {
    this.dispatchRemoteClick('lit');
  };

  /**
   * @name onReactClick
   * @description Maneja el clic del botón renderizado con React y delega la emisión del evento remoto.
   * @returns {void} No retorna ningún valor.
   * @remarks Se mantiene estable para pasarlo al subárbol de React sin recrear listeners manualmente.
   */
  private readonly onReactClick = () => {
    this.dispatchRemoteClick('react');
  };

  /**
   * @name renderReactButton
   * @description Inicializa y actualiza el botón React embebido dentro del shadow DOM del componente Lit.
   * @returns {void} No retorna ningún valor.
   * @remarks Crea el `root` de React una sola vez y luego vuelve a renderizar el componente cuando es necesario.
   */
  private renderReactButton() {
    const container = this.renderRoot.querySelector('[data-react-button-root]');
    if (!(container instanceof HTMLElement)) return;

    if (!this.reactRoot) {
      this.reactRoot = createRoot(container);
    }

    this.reactRoot.render(
      createElement(RemoteButtonReact, {
        label: 'Remote Button ReactJs',
        color: '#1976d2',
        onClick: this.onReactClick,
      }),
    );
  }

  /**
   * @name firstUpdated
   * @description Hook del ciclo de vida de Lit que monta el botón React después del primer render.
   * @returns {void} No retorna ningún valor.
   * @remarks Se ejecuta una vez cuando el shadow DOM ya está disponible.
   */
  firstUpdated() {
    this.renderReactButton();
  }

  /**
   * @name updated
   * @description Hook del ciclo de vida de Lit que sincroniza el botón React tras cada actualización del componente.
   * @returns {void} No retorna ningún valor.
   * @remarks Garantiza que el subárbol React reciba el estado visual más reciente.
   */
  updated() {
    this.renderReactButton();
  }

  /**
   * @name disconnectedCallback
   * @description Libera el root de React cuando el Web Component se desmonta del DOM.
   * @returns {void} No retorna ningún valor.
   * @remarks También delega la limpieza al ciclo de vida original de `LitElement`.
   */
  disconnectedCallback() {
    this.reactRoot?.unmount();
    this.reactRoot = null;
    super.disconnectedCallback();
  }

  /**
   * @name render
   * @description Define el template del Web Component, incluyendo el botón Lit y el contenedor del botón React.
   * @returns {import('lit').TemplateResult} Template de Lit que se renderiza dentro del shadow DOM.
   * @remarks El color del botón Lit se controla con la propiedad `color` expuesta por el componente.
   */
  render() {
    return html`
      <h3 style="color:${this.color};">Web Component</h3>
      <button style="background:${this.color}; color: white;" @click=${this.onLitClick}>
        <svg
          class="button-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.441 2L5.19 12.147h4.295L8.854 22 16.81 10.706h-4.387L12.441 2Z"
            fill="currentColor"
          />
        </svg>
        ${this.label}
      </button>
      <div data-react-button-root></div>
    `;
  }
}
customElements.define('remote-button', RemoteButton);
