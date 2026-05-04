import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { TaskWithChildren } from './JiraTaskItem';
import { ESTIMATE_TASK_ROOT_ROW_PX, TASK_LIST_VIRTUAL_OVERSCAN } from './tasksViewHelpers';

export { shouldVirtualizeTaskRoots, TASK_ROOT_VIRTUALIZE_MIN } from './tasksViewHelpers';

export interface VirtualizedTaskRootListProps {
  roots: TaskWithChildren[];
  listAriaLabel: string;
  /** Uma linha = uma tarefa raiz (inclui subárvore dentro de JiraTaskItem). */
  renderRootNode: (task: TaskWithChildren) => React.ReactNode;
  className?: string;
}

/**
 * Lista rolável com janela virtual para muitas raízes de tarefa.
 * Alturas dinâmicas (expandir detalhes) via measureElement do TanStack Virtual.
 */
export const VirtualizedTaskRootList: React.FC<VirtualizedTaskRootListProps> = ({
  roots,
  listAriaLabel,
  renderRootNode,
  className,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: roots.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index: number) => {
      const t = roots[index];
      if (!t) return ESTIMATE_TASK_ROOT_ROW_PX;
      const childN = t.children?.length ?? 0;
      const depthBonus = Math.min(childN * 24, 96);
      return ESTIMATE_TASK_ROOT_ROW_PX + depthBonus;
    },
    overscan: TASK_LIST_VIRTUAL_OVERSCAN,
    useAnimationFrameWithResizeObserver: true,
    measureElement:
      typeof window !== 'undefined' ? el => el.getBoundingClientRect().height : undefined,
  });

  return (
    <div
      ref={parentRef}
      className={
        className ??
        'max-h-[min(72vh,880px)] overflow-y-auto overflow-x-hidden rounded-lg border border-base-200/50 custom-scrollbar'
      }
      role="list"
      aria-label={listAriaLabel}
    >
      <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(vi => {
          const task = roots[vi.index];
          if (!task) return null;
          return (
            <div
              key={task.id}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full min-w-0"
              style={{ transform: `translateY(${vi.start}px)` }}
            >
              {renderRootNode(task)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
