import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initializePWA } from './utils/pwa';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

function showBootstrapError(message: string, err: unknown) {
  rootElement!.setAttribute('aria-busy', 'false');
  rootElement!.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 2rem; background: #f5f5f5 !important; color: #333 !important;">
      <p style="font-size: 1.125rem; font-weight: 500;">Erro ao carregar o aplicativo</p>
      <p style="font-size: 0.875rem; opacity: 0.85; font-family: monospace; max-width: 32rem; word-break: break-all;">${message}</p>
      <button type="button" onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #0E6DFD; color: #fff; border: none; border-radius: 0.5rem; cursor: pointer;">Recarregar</button>
    </div>
  `;
  console.error('Bootstrap error:', err);
}

try {
  initializePWA();
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  showBootstrapError(message, err);
}
