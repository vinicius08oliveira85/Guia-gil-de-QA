import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializePWA } from './utils/pwa';

// Inicializar PWA
initializePWA();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

function renderApp() {
  const root = ReactDOM.createRoot(rootElement!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

try {
  renderApp();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  rootElement.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-base-100 text-base-content">
      <p class="text-lg font-medium">Erro ao carregar o aplicativo</p>
      <p class="text-sm opacity-80 font-mono max-w-md break-all">${message}</p>
      <button type="button" onclick="window.location.reload()" class="btn btn-primary">Recarregar</button>
    </div>
  `;
  console.error('Bootstrap error:', err);
}
