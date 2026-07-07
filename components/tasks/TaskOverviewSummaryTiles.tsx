import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  overviewStatTileClass,
  overviewStatTileEmphasisClass,
  overviewStatTileIconWrapClass,
  overviewStatTileLabelClass,
  overviewStatTileValueClass,
  overviewTileToneColor,
  type OverviewTileTone,
} from './taskDetailsNeuUi';

export interface OverviewStatTileProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  tone?: OverviewTileTone;
  /** Realce (ex.: Próximo passo) — borda de accent e valor com 2 linhas. */
  emphasis?: boolean;
  title?: string;
}

/**
 * Tile de indicador do Resumo da tarefa: ícone (em aro neumórfico) + rótulo
 * discreto + valor forte. Mantém a identidade neumórfica escura/quente do modal.
 */
export const OverviewStatTile: React.FC<OverviewStatTileProps> = ({
  icon: Icon,
  label,
  value,
  tone = 'accent',
  emphasis = false,
  title,
}) => {
  const toneColor = overviewTileToneColor[tone];
  return (
    <div className={emphasis ? overviewStatTileEmphasisClass : overviewStatTileClass} title={title}>
      <span className={overviewStatTileIconWrapClass} aria-hidden>
        <Icon className="h-4 w-4" strokeWidth={2} style={{ color: toneColor }} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={overviewStatTileLabelClass}>{label}</span>
        <span
          className={cn(overviewStatTileValueClass, emphasis && 'whitespace-normal line-clamp-2')}
          style={tone !== 'neutral' && tone !== 'accent' ? { color: toneColor } : undefined}
        >
          {value}
        </span>
      </span>
    </div>
  );
};

OverviewStatTile.displayName = 'OverviewStatTile';

/** Mapeia rótulo de prioridade para tom semântico. */
export function priorityTone(priorityLabel?: string): OverviewTileTone {
  const p = (priorityLabel ?? '').toLowerCase();
  if (p.includes('urgent') || p.includes('highest') || p.includes('crít') || p.includes('crit')) {
    return 'error';
  }
  if (p.includes('alta') || p.includes('high')) return 'warning';
  if (p.includes('baixa') || p.includes('low')) return 'success';
  return 'info';
}

/** Mapeia severidade para tom semântico. */
export function severityTone(severity?: string): OverviewTileTone {
  const s = (severity ?? '').toLowerCase();
  if (s.includes('crít') || s.includes('crit')) return 'error';
  if (s.includes('alto') || s.includes('alta') || s.includes('high')) return 'warning';
  if (s.includes('baixo') || s.includes('baixa') || s.includes('low')) return 'success';
  return 'info';
}
