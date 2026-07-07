import React, { useState } from 'react';
import { BddScenario } from '../../../types';
import { cn } from '../../../utils/cn';
import { Spinner } from '../../common/Spinner';
import { BddScenarioForm, BddScenarioItem } from '../BddScenario';
import { BddScenarioActionBar } from '../BddScenarioActionBar';
import {
  leveTaskModalMutedClass,
  leveTaskModalPageTitleClass,
  leveTaskModalTabBadgeIdleClass,
} from '../../common/projectCardUi';
import { taskDetailsModalSectionClass } from '../taskDetailsNeuUi';
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
    <div className="space-y-4">
      <header className={cn(taskDetailsModalSectionClass, 'mb-4 space-y-1 p-4')}>
        <h2 className={leveTaskModalPageTitleClass}>Cenários de Teste BDD</h2>
        <p className={cn(leveTaskModalMutedClass, 'mt-1 text-sm')}>
          Gerencie e visualize seus critérios de aceite em formato Gherkin.
        </p>
        <span className={cn(leveTaskModalTabBadgeIdleClass, 'mt-2 inline-flex px-2.5 py-1')}>
          {bddCount} cenário(s)
        </span>
      </header>

      <div className="space-y-4">
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
