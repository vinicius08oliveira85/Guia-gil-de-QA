import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

export interface KeepAlivePanelProps {
  /** id do painel (tabpanel). */
  id: string;
  /** Painel visível no momento. */
  active: boolean;
  children: React.ReactNode;
  className?: string;
  /** id do botão da aba (aria-labelledby). */
  labelledBy?: string;
  /**
   * Se true, só monta na primeira vez que `active` fica true.
   * Depois permanece montado (estado preservado ao alternar abas).
   */
  lazy?: boolean;
}

/**
 * Mantém o conteúdo montado ao trocar de aba, ocultando painéis inativos
 * em vez de desmontá-los (preserva filtros, scroll, formulários, etc.).
 */
export const KeepAlivePanel: React.FC<KeepAlivePanelProps> = ({
  id,
  active,
  children,
  className,
  labelledBy,
  lazy = true,
}) => {
  const [hasBeenActive, setHasBeenActive] = useState(!lazy || active);

  useEffect(() => {
    if (active) {
      setHasBeenActive(true);
    }
  }, [active]);

  if (!hasBeenActive) {
    return null;
  }

  return (
    <section
      id={id}
      role="tabpanel"
      aria-labelledby={labelledBy}
      hidden={!active}
      aria-hidden={!active}
      className={cn(!active && 'hidden', className)}
    >
      {children}
    </section>
  );
};

KeepAlivePanel.displayName = 'KeepAlivePanel';
