import { useCallback } from 'react';

const DEFAULT_REGION_ID = 'aria-live-region';

/**
 * Anuncia mensagens para leitores de tela na região `#aria-live-region` (defina no layout raiz).
 */
export function useAriaLive(regionId: string = DEFAULT_REGION_ID) {
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const region = document.getElementById(regionId);
      if (!region) return;
      region.setAttribute('aria-live', priority);
      region.setAttribute('aria-atomic', 'true');
      region.textContent = message;
      window.setTimeout(() => {
        region.textContent = '';
      }, 1200);
    },
    [regionId]
  );

  return { announce, regionId: DEFAULT_REGION_ID };
}
