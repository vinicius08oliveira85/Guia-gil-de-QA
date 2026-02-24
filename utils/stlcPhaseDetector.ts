import { Project, STLCPhaseName } from '../types';

/**
 * Detecta a fase atual do STLC baseado nas métricas do projeto
 *
 * @param project - Projeto a ser analisado
 * @returns Fase atual do STLC
 */
export function detectCurrentSTLCPhase(project: Project): STLCPhaseName {
  const tasks = project.tasks || [];
  const documents = project.documents || [];
  const allTestCases = tasks.flatMap(t => t.testCases || []);
  const totalTestCases = allTestCases.length;
  const executedTestCases = allTestCases.filter(tc => tc.status !== 'Not Run').length;
  const passedTestCases = allTestCases.filter(tc => tc.status === 'Passed').length;

  // Fase 1: Análise de Requisitos
  // Se não há tarefas ou documentos, ainda está na análise
  if (tasks.length === 0 && documents.length === 0) {
    return 'Análise de Requisitos';
  }

  // Fase 2: Planejamento de Testes
  // Se há documentos/tarefas mas não há casos de teste criados
  if (totalTestCases === 0) {
    return 'Planejamento de Testes';
  }

  // Fase 3: Desenvolvimento de Casos de Teste
  // Se há casos de teste mas nenhum foi executado ainda
  if (executedTestCases === 0) {
    return 'Desenvolvimento de Casos de Teste';
  }

  // Fase 4: Execução de Testes
  // Se há casos executados mas nem todos foram executados ou aprovados
  if (executedTestCases < totalTestCases || passedTestCases < executedTestCases) {
    return 'Execução de Testes';
  }

  // Fase 5: Encerramento do Teste
  // Se todos os casos foram executados e aprovados
  if (
    executedTestCases === totalTestCases &&
    passedTestCases === executedTestCases &&
    totalTestCases > 0
  ) {
    return 'Encerramento do Teste';
  }

  // Fallback: se há tarefas mas não há casos de teste, ainda está no planejamento
  if (tasks.length > 0 && totalTestCases === 0) {
    return 'Planejamento de Testes';
  }

  // Default: Análise de Requisitos
  return 'Análise de Requisitos';
}

/**
 * Obtém a ordem numérica de uma fase STLC
 *
 * @param phase - Fase do STLC
 * @returns Ordem numérica (1-5)
 */
export function getSTLCPhaseOrder(phase: STLCPhaseName): number {
  const order: Record<STLCPhaseName, number> = {
    'Análise de Requisitos': 1,
    'Planejamento de Testes': 2,
    'Desenvolvimento de Casos de Teste': 3,
    'Execução de Testes': 4,
    'Encerramento do Teste': 5,
  };
  return order[phase];
}

/**
 * Compara duas fases STLC
 *
 * @param phase1 - Primeira fase
 * @param phase2 - Segunda fase
 * @returns true se phase1 é anterior a phase2
 */
export function isSTLCPhaseBefore(phase1: STLCPhaseName, phase2: STLCPhaseName): boolean {
  return getSTLCPhaseOrder(phase1) < getSTLCPhaseOrder(phase2);
}

/**
 * Compara duas fases STLC
 *
 * @param phase1 - Primeira fase
 * @param phase2 - Segunda fase
 * @returns true se phase1 é posterior a phase2
 */
export function isSTLCPhaseAfter(phase1: STLCPhaseName, phase2: STLCPhaseName): boolean {
  return getSTLCPhaseOrder(phase1) > getSTLCPhaseOrder(phase2);
}
