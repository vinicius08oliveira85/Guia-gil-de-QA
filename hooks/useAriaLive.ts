import { useEffect, useRef } from 'react';

export const useAriaLive = () => {
  const regionRef = useRef<HTMLDivElement>(null);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const region = document.getElementById('aria-live-region');
    if (region) {
      region.setAttribute('aria-live', priority);
      region.textContent = message;
      // Limpar após anunciar
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  };

  return { announce };
};