import React, { useEffect, useRef } from 'react';

type WebComponentWrapperProps = Readonly<{
  tag: string;
  url: string;
  props?: Record<string, any>;
  on?: Record<string, (e: Event) => void>;
  fallback?: React.ReactNode;
}>;

/**
 * @name injectModuleScript
 * @description Inserta un script ESM remoto en el documento para registrar el Web Component antes de renderizarlo.
 * @param {string} url URL absoluta del módulo remoto que se debe cargar.
 * @returns {Promise<void>} Promesa que se resuelve cuando el script termina de cargar.
 * @throws {Error} Lanza un error si el navegador no puede cargar el módulo remoto.
 */
function injectModuleScript(url: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[type="module"][src="\${url}"]`)) return resolve();
    const script = document.createElement('script');
    script.type = 'module';
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load remote module ' + url));
    document.head.appendChild(script);
  });
}

/**
 * @name WebComponentWrapper
 * @description Renderiza un custom element dentro de React, cargando primero su módulo remoto y sincronizando props y eventos.
 * @param {WebComponentWrapperProps} props Propiedades necesarias para identificar el tag, la URL del módulo, atributos y listeners.
 * @returns {React.ReactElement | null} El Web Component renderizado, un fallback temporal o un mensaje de error.
 * @remarks Este wrapper asigna propiedades directamente al elemento cuando es posible y usa atributos como fallback.
 */
export function WebComponentWrapper({
  tag,
  url,
  props = {},
  on = {},
  fallback = null,
}: WebComponentWrapperProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  useEffect(() => {
    let mounted = true;
    injectModuleScript(url)
      .then(() => {
        if (mounted) setLoaded(true);
      })
      .catch((err) => {
        if (mounted) setError(err);
      });
    return () => {
      mounted = false;
    };
  }, [url]);
  useEffect(() => {
    if (!loaded || !ref.current) return;
    const el = ref.current;
    Object.entries(props).forEach(([k, v]) => {
      try {
        (el as any)[k] = v;
      } catch {
        if (v === true) el.setAttribute(k, '');
        else if (v === false) el.removeAttribute(k);
        else if (v != null) el.setAttribute(k, String(v));
      }
    });
    const listeners: Array<() => void> = [];
    Object.entries(on).forEach(([evt, handler]) => {
      const h = (e: Event) => handler(e);
      el.addEventListener(evt, h as EventListener);
      listeners.push(() => el.removeEventListener(evt, h as EventListener));
    });
    return () => listeners.forEach((fn) => fn());
  }, [loaded, props, on]);
  if (error) return <div style={{ color: 'red' }}>Failed to load remote component</div>;
  if (!loaded) return <>{fallback}</>;
  return React.createElement(tag, { ref });
}
