import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import type { JiraQueue } from '../../services/jira/types';
import { buildJiraQueueTree } from '../../utils/jiraQueueTree';
import { cn } from '../../utils/cn';
import {
  jiraFilasQueueTreeGroupClass,
  jiraFilasQueueTreeItemClass,
  jiraFilasQueueTreeItemSelectedClass,
  jiraFilasQueueTreePanelClass,
  jiraFilasQueueTreeTitleClass,
} from './jiraSolusNeuUi';

export interface JiraFilasQueueTreeProps {
  queues: JiraQueue[];
  selectedQueueIds: string[];
  onChange: (queueIds: string[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const JiraFilasQueueTree: React.FC<JiraFilasQueueTreeProps> = ({
  queues,
  selectedQueueIds,
  onChange,
  disabled = false,
  isLoading = false,
}) => {
  const tree = useMemo(() => buildJiraQueueTree(queues), [queues]);
  const selectedSet = useMemo(() => new Set(selectedQueueIds), [selectedQueueIds]);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setExpandedGroups(new Set(tree.map(group => group.id)));
  }, [tree]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const toggleQueue = useCallback(
    (queueId: string) => {
      if (disabled) return;
      const next = new Set(selectedQueueIds);
      if (next.has(queueId)) next.delete(queueId);
      else next.add(queueId);
      onChange(Array.from(next));
    },
    [disabled, onChange, selectedQueueIds]
  );

  const toggleGroupSelection = useCallback(
    (groupId: string) => {
      if (disabled) return;
      const group = tree.find(entry => entry.id === groupId);
      if (!group) return;

      const groupQueueIds = group.items.map(item => item.queue.id);
      const allSelected = groupQueueIds.every(id => selectedSet.has(id));
      const next = new Set(selectedQueueIds);

      if (allSelected) {
        groupQueueIds.forEach(id => next.delete(id));
      } else {
        groupQueueIds.forEach(id => next.add(id));
      }

      onChange(Array.from(next));
    },
    [disabled, onChange, selectedQueueIds, selectedSet, tree]
  );

  if (isLoading) {
    return (
      <div className={jiraFilasQueueTreePanelClass} aria-busy="true">
        <p className="px-3 py-2 font-sans text-sm text-[var(--brand-text-muted)]">
          Carregando filas…
        </p>
      </div>
    );
  }

  if (queues.length === 0) {
    return (
      <div className={jiraFilasQueueTreePanelClass}>
        <p className="px-3 py-2 font-sans text-sm text-[var(--brand-text-muted)]">
          Nenhuma fila encontrada para este projeto.
        </p>
      </div>
    );
  }

  return (
    <div className={jiraFilasQueueTreePanelClass} role="tree" aria-label="Filas do Jira Service Management">
      <div className={jiraFilasQueueTreeTitleClass}>
        <FileText className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        <span>Filas</span>
        {selectedQueueIds.length > 0 ? (
          <span className="ml-auto rounded-full bg-[var(--brand-chip)] px-2 py-0.5 text-[10px] font-semibold tabular-nums">
            {selectedQueueIds.length}
          </span>
        ) : null}
      </div>

      <div className="max-h-72 overflow-y-auto py-1 sm:max-h-80">
        {tree.map(group => {
          const isExpanded = expandedGroups.has(group.id);
          const groupQueueIds = group.items.map(item => item.queue.id);
          const selectedInGroup = groupQueueIds.filter(id => selectedSet.has(id)).length;
          const allSelected = selectedInGroup === groupQueueIds.length && groupQueueIds.length > 0;
          const partiallySelected = selectedInGroup > 0 && !allSelected;

          return (
            <GroupNode
              key={group.id}
              group={group}
              isExpanded={isExpanded}
              allSelected={allSelected}
              partiallySelected={partiallySelected}
              selectedSet={selectedSet}
              disabled={disabled}
              onToggleGroup={toggleGroup}
              onToggleGroupSelection={toggleGroupSelection}
              onToggleQueue={toggleQueue}
            />
          );
        })}
      </div>
    </div>
  );
};

interface GroupNodeProps {
  group: ReturnType<typeof buildJiraQueueTree>[number];
  isExpanded: boolean;
  allSelected: boolean;
  partiallySelected: boolean;
  selectedSet: Set<string>;
  disabled: boolean;
  onToggleGroup: (groupId: string) => void;
  onToggleGroupSelection: (groupId: string) => void;
  onToggleQueue: (queueId: string) => void;
}

const GroupNode: React.FC<GroupNodeProps> = ({
  group,
  isExpanded,
  allSelected,
  partiallySelected,
  selectedSet,
  disabled,
  onToggleGroup,
  onToggleGroupSelection,
  onToggleQueue,
}) => {
  const groupCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (groupCheckboxRef.current) {
      groupCheckboxRef.current.indeterminate = partiallySelected;
    }
  }, [partiallySelected]);

  return (
    <div role="group" aria-label={group.label}>
      <div className={jiraFilasQueueTreeGroupClass}>
        <button
          type="button"
          onClick={() => onToggleGroup(group.id)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Recolher' : 'Expandir'} categoria ${group.label}`}
          disabled={disabled}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          )}
          <span className="truncate font-semibold">{group.label}</span>
        </button>

        <input
          ref={groupCheckboxRef}
          type="checkbox"
          className="checkbox checkbox-xs checkbox-highlight shrink-0"
          checked={allSelected}
          onChange={() => onToggleGroupSelection(group.id)}
          disabled={disabled}
          aria-label={`Selecionar todas as filas de ${group.label}`}
        />
      </div>

      {isExpanded
        ? group.items.map(item => {
            const isSelected = selectedSet.has(item.queue.id);
            return (
              <label
                key={item.queue.id}
                className={cn(
                  jiraFilasQueueTreeItemClass,
                  isSelected && jiraFilasQueueTreeItemSelectedClass
                )}
                role="treeitem"
                aria-selected={isSelected}
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs checkbox-highlight shrink-0"
                  checked={isSelected}
                  onChange={() => onToggleQueue(item.queue.id)}
                  disabled={disabled}
                  aria-label={`Fila ${item.label}`}
                />
                <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                <span className="min-w-0 flex-1 truncate" title={item.queue.name}>
                  {item.label}
                </span>
              </label>
            );
          })
        : null}
    </div>
  );
};

JiraFilasQueueTree.displayName = 'JiraFilasQueueTree';
