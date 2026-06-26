/** Reexporta utilitários neumórficos para telas de análise. */
export {
  dashboardHoverCardClass as analysisHoverCardClass,
  dashboardInsetTileClass as analysisTileClass,
  dashboardPanelClass as analysisPanelClass,
  dashboardSectionDividerClass as analysisSectionDividerClass,
} from '../dashboard/dashboardNeuUi';

export {
  neuDividerClass as analysisDividerClass,
  neuPillClass as analysisPillClass,
  neuSurfaceClass,
} from '../common/neuUi';

import { cn } from '../../utils/cn';
import { neuSurfaceClass } from '../common/neuUi';

/** Card de análise (tarefa/teste) — expandido ou compacto. */
export const analysisCardShellClass = (expanded: boolean, stale?: boolean) =>
  cn(
    neuSurfaceClass,
    'rounded-xl border-0 p-5 transition-all',
    expanded && 'shadow-[var(--leve-neu-hover)] ring-1 ring-primary/30',
    stale && 'bg-warning/5 ring-warning/30'
  );
