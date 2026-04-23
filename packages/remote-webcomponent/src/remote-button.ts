import { LitElement, html, css } from 'lit';
export class RemoteButton extends LitElement {
  static readonly styles = css`
    :host {
      display: inline-block;
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

  label = 'Remote Button';
  color = '#1976d2';
  private onClick() {
    this.dispatchEvent(
      new CustomEvent('remote-click', {
        detail: { time: Date.now() },
        bubbles: true,
        composed: true,
      }),
    );
  }
  render() {
    return html`
      <button style="background:${this.color}; color: white;" @click=${this.onClick}>
        ${this.label}
      </button>
    `;
  }
}
customElements.define('remote-button', RemoteButton);
