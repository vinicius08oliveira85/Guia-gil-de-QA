import { ChecklistItem, Phase, Project } from '../types';
import { PHASE_NAMES } from './constants';

export const DEFAULT_CHECKLISTS: Record<string, ChecklistItem[]> = {
  'Request': [
    { id: 'req-1', text: 'Requisito documentado e aprovado', checked: false, required: true },
    { id: 'req-2', text: 'Critérios de aceite definidos', checked: false, required: true },
    { id: 'req-3', text: 'Prioridade estabelecida', checked: false, required: true }
  ],
  'Analysis': [
    { id: 'ana-1', text: 'Análise de impacto realizada', checked: false, required: true },
    { id: 'ana-2', text: 'Riscos identificados', checked: false, required: true },
    { id: 'ana-3', text: 'Dependências mapeadas', checked: false, required: false }
  ],
  'Design': [
    { id: 'des-1', text: 'Design aprovado pelo time', checked: false, required: true },
    { id: 'des-2', text: 'Especificações técnicas documentadas', checked: false, required: true },
    { id: 'des-3', text: 'Estratégia de teste definida', checked: false, required: true }
  ],
  'Analysis and Code': [
    { id: 'code-1', text: 'Código revisado', checked: false, required: true },
    { id: 'code-2', text: 'Testes unitários escritos', checked: false, required: true },
    { id: 'code-3', text: 'Testes de integração passando', checked: false, required: false }
  ],
  'Build': [
    { id: 'build-1', text: 'Build bem-sucedido', checked: false, required: true },
    { id: 'build-2', text: 'Sem erros de compilação', checked: false, required: true },
    { id: 'build-3', text: 'Artefatos gerados', checked: false, required: true }
  ],
  'Test': [
    { id: 'test-1', text: 'Casos de teste executados', checked: false, required: true },
    { id: 'test-2', text: 'Todos os testes críticos passando', checked: false, required: true },
    { id: 'test-3', text: 'Bugs críticos resolvidos', checked: false, required: true },
    { id: 'test-4', text: 'Testes de regressão executados', checked: false, required: false }
  ],
  'Release': [
    { id: 'rel-1', text: 'Documentação atualizada', checked: false, required: true },
    { id: 'rel-2', text: 'Notas de release preparadas', checked: false, required: true },
    { id: 'rel-3', text: 'Aprovação para release obtida', checked: false, required: true }
  ],
  'Deploy': [
    { id: 'dep-1', text: 'Deploy em ambiente de staging', checked: false, required: true },
    { id: 'dep-2', text: 'Smoke tests passando', checked: false, required: true },
    { id: 'dep-3', text: 'Deploy em produção', checked: false, required: true }
  ],
  'Operate': [
    { id: 'op-1', text: 'Monitoramento configurado', checked: false, required: true },
    { id: 'op-2', text: 'Alertas configurados', checked: false, required: false },
    { id: 'op-3', text: 'Runbooks atualizados', checked: false, required: false }
  ],
  'Monitor': [
    { id: 'mon-1', text: 'Métricas coletadas', checked: false, required: true },
    { id: 'mon-2', text: 'Performance dentro do esperado', checked: false, required: false },
    { id: 'mon-3', text: 'Feedback coletado', checked: false, required: false }
  ]
};

export const getChecklistForPhase = (phaseName: string): ChecklistItem[] => {
  return DEFAULT_CHECKLISTS[phaseName] || [];
};

export const getChecklistProgress = (checklist: ChecklistItem[]): { completed: number; total: number; required: number; requiredCompleted: number } => {
  const total = checklist.length;
  const completed = checklist.filter(item => item.checked).length;
  const required = checklist.filter(item => item.required).length;
  const requiredCompleted = checklist.filter(item => item.required && item.checked).length;

  return { completed, total, required, requiredCompleted };
};

export const canMoveToNextPhase = (checklist: ChecklistItem[]): { canMove: boolean; missingRequired: string[] } => {
  const requiredItems = checklist.filter(item => item.required && !item.checked);
  return {
    canMove: requiredItems.length === 0,
    missingRequired: requiredItems.map(item => item.text)
  };
};

export const updateChecklistItem = (
  checklist: ChecklistItem[],
  itemId: string,
  updates: Partial<ChecklistItem>
): ChecklistItem[] => {
  return checklist.map(item =>
    item.id === itemId ? { ...item, ...updates } : item
  );
};

export const addChecklistItem = (
  checklist: ChecklistItem[],
  text: string,
  required: boolean = false
): ChecklistItem[] => {
  const newItem: ChecklistItem = {
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text,
    checked: false,
    required
  };
  return [...checklist, newItem];
};

export const removeChecklistItem = (
  checklist: ChecklistItem[],
  itemId: string
): ChecklistItem[] => {
  return checklist.filter(item => item.id !== itemId);
};

