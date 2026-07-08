import { cn } from '../../utils/cn';
import { neuBrandTextMutedClass, neuBrandTextStrongClass } from './neuUi';

/** Texto secundário dentro de modais neumórficos claros. */
export const modalNeuMutedTextClass = neuBrandTextMutedClass;

/** Texto principal dentro de modais neumórficos claros. */
export const modalNeuStrongTextClass = neuBrandTextStrongClass;

/** Container rebaixado para listas no corpo do modal. */
export const modalNeuListClass = cn(
  'modal-neu-list custom-scrollbar max-h-[min(50vh,24rem)] space-y-2 overflow-y-auto overscroll-contain'
);

/** Linha clicável elevada (atalhos, busca, histórico). */
export const modalNeuListRowClass = cn(
  'modal-neu-list-row group w-full text-left',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  'motion-reduce:transform-none'
);

/** Tecla de atalho (kbd) no estilo neumórfico. */
export const modalNeuKbdClass = 'modal-neu-kbd';

/** Caixa de dica dentro do modal. */
export const modalNeuTipClass = cn('modal-neu-tip text-sm', modalNeuMutedTextClass);

/** Estado vazio centralizado no modal. */
export const modalNeuEmptyClass = cn(
  'modal-neu-empty py-8 text-center text-sm font-medium',
  modalNeuMutedTextClass
);

/** Campo de busca padrão em modais. */
export const modalNeuSearchInputClass = cn(
  'modal-neu-search-input input input-bordered w-full rounded-box'
);

/** Badge de tipo compacto em linhas de resultado. */
export const modalNeuTypeBadgeClass = 'modal-neu-type-badge';

/** Tile de estatística rápida (grid no modal). */
export const modalNeuStatTileClass = 'modal-neu-stat-tile';
