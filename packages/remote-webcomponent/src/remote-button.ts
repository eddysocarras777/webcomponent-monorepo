import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { LitElement, html, css } from 'lit';
import { RemoteButtonReact } from './remote-button-react';

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

  private dispatchRemoteClick(source: 'lit' | 'react') {
    this.dispatchEvent(
      new CustomEvent('remote-click', {
        detail: { time: formatDateTime(new Date()), source },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private readonly onLitClick = () => {
    this.dispatchRemoteClick('lit');
  };

  private readonly onReactClick = () => {
    this.dispatchRemoteClick('react');
  };

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

  firstUpdated() {
    this.renderReactButton();
  }

  updated() {
    this.renderReactButton();
  }

  disconnectedCallback() {
    this.reactRoot?.unmount();
    this.reactRoot = null;
    super.disconnectedCallback();
  }

  render() {
    return html`
      <button style="background:${this.color}; color: white;" @click=${this.onLitClick}>
        ${this.label}
      </button>
      <div data-react-button-root></div>
    `;
  }
}
customElements.define('remote-button', RemoteButton);
