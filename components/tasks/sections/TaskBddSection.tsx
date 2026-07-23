import React, { useState } from 'react';
import { BddScenario } from '../../../types';
import { cn } from '../../../utils/cn';
import { Spinner } from '../../common/Spinner';
import { BddScenarioForm, BddScenarioItem } from '../BddScenario';
import { BddScenarioActionBar } from '../BddScenarioActionBar';
import {
  leveTaskModalMutedClass,
  leveTaskModalStrongClass,
  leveTaskModalTabBadgeIdleClass,
} from '../../common/projectCardUi';
import { taskDetailsModalSectionHeaderClass } from '../taskDetailsNeuUi';
import { useTaskDetail } from './TaskDetailContext';

/** Aba «Cenários BDD» do detalhe da tarefa. */
export const TaskBddSection: React.FC = () => {
  const { task, isGeneratingBdd, onSaveBddScenario, onDeleteBddScenario, onGenerateBddScenarios } =
    useTaskDetail();
  const [editingBddScenario, setEditingBddScenario] = useState<BddScenario | null>(null);
  const [isCreatingBdd, setIsCreatingBdd] = useState(false);

  if (task.type !== 'Tarefa' && task.type !== 'Bug') {
    return null;
  }

  const bddCount = task.bddScenarios?.length || 0;
  const actionsDisabled = isGeneratingBdd || isCreatingBdd || !!editingBddScenario;

  const handleSaveScenario = (scenario: Omit<BddScenario, 'id'>) => {
    onSaveBddScenario(task.id, scenario, editingBddScenario?.id);
    setEditingBddScenario(null);
    setIsCreatingBdd(false);
  };

  const handleCancelForm = () => {
    setEditingBddScenario(null);
    setIsCreatingBdd(false);
  };

  return (
    <div className="space-y-2.5">
      <header className={taskDetailsModalSectionHeaderClass}>
        <h2 className={cn('text-base font-bold', leveTaskModalStrongClass)}>Cenários BDD</h2>
        <span className={cn(leveTaskModalTabBadgeIdleClass, 'px-2 py-0.5 normal-case')}>
          {bddCount} cenário(s)
        </span>
        <p className={cn(leveTaskModalMutedClass, 'basis-full text-xs leading-snug')}>
          Critérios de aceite em formato Gherkin.
        </p>
      </header>

      <div className="space-y-2.5">
        {(task.bddScenarios || []).map(sc =>
          editingBddScenario?.id === sc.id ? (
            <BddScenarioForm
              key={sc.id}
              existingScenario={sc}
              onSave={handleSaveScenario}
              onCancel={handleCancelForm}
            />
          ) : (
            <BddScenarioItem
              key={sc.id}
              scenario={sc}
              onEdit={() => setEditingBddScenario(sc)}
              onDelete={() => onDeleteBddScenario(task.id, sc.id)}
            />
          )
        )}
      </div>
      {isCreatingBdd && !editingBddScenario && (
        <BddScenarioForm onSave={handleSaveScenario} onCancel={handleCancelForm} />
      )}
      {isGeneratingBdd && (
        <div className="flex justify-center py-2">
          <Spinner small />
        </div>
      )}

      <BddScenarioActionBar
        onGenerate={() => onGenerateBddScenarios(task.id)}
        onAddManual={() => setIsCreatingBdd(true)}
        disabled={actionsDisabled}
        className="mx-auto w-full max-w-2xl"
      />
    </div>
  );
};

TaskBddSection.displayName = 'TaskBddSection';
