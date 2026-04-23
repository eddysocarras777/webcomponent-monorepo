import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { LitElement, html, css } from 'lit';
import { RemoteButtonReact } from './remote-button-react';

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
    }
  `;

  static readonly properties = {
    label: { type: String },
    color: { type: String },
  };

  label = 'Remote Button Lit';
  color = '#1976d2';

  private reactRoot: Root | null = null;

  /**
   * @name dispatchRemoteClick
   * @description Emite un evento personalizado con la fecha y el origen del clic dentro del Web Component.
   * @param {'lit' | 'react'} source Origen del clic que disparó el evento.
   * @returns {void} No retorna ningún valor.
   * @remarks El evento se publica con `bubbles` y `composed` para que el host pueda escucharlo fuera del shadow DOM.
   */
  private dispatchRemoteClick(source: 'lit' | 'react') {
    this.dispatchEvent(
      new CustomEvent('remote-click', {
        detail: { time: formatDateTime(new Date()), source },
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
        ${this.label}
      </button>
      <div data-react-button-root></div>
    `;
  }
}
customElements.define('remote-button', RemoteButton);
