// Import to register the custom element when the module is loaded
import './remote-button';
// Optional global helper
declare global {
  interface Window {
    RemoteWebComponent?: any;
  }
}
window.RemoteWebComponent = { tag: 'remote-button' };
