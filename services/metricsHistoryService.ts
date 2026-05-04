import { Project, MetricsSnapshot } from '../types';

/**
 * Salva um snapshot das métricas atuais no histórico do projeto
 */
export const saveMetricsSnapshot = (project: Project, snapshot: MetricsSnapshot): Project => {
  const history = project.metricsHistory || [];

  // Verificar se já existe snapshot para o mesmo dia (usar apenas data, sem hora)
  const snapshotDate = new Date(snapshot.date).toISOString().split('T')[0];
  const existingIndex = history.findIndex(
    s => new Date(s.date).toISOString().split('T')[0] === snapshotDate
  );

  const updatedHistory =
    existingIndex >= 0
      ? history.map((s, idx) => (idx === existingIndex ? snapshot : s))
      : [...history, snapshot];

  // Manter apenas últimos 90 dias de histórico
  const sortedHistory = updatedHistory
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 90);

  return {
    ...project,
    metricsHistory: sortedHistory,
  };
};

/**
 * Obtém snapshots de um período específico
 */
export const getMetricsForPeriod = (
  project: Project,
  period: 'week' | 'month' | 'all' = 'week'
): MetricsSnapshot[] => {
  const history = project.metricsHistory || [];
  if (history.length === 0) return [];

  const now = new Date();
  const cutoffDate = new Date();

  switch (period) {
    case 'week':
      cutoffDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      cutoffDate.setMonth(now.getMonth() - 1);
      break;
    case 'all':
      return history;
  }

  return history.filter(snapshot => new Date(snapshot.date) >= cutoffDate);
};

/**
 * Compara métricas atuais com período anterior (tendências por métrica para cada card)
 */
export const compareMetricsPeriods = (
  currentMetrics: MetricsSnapshot,
  previousMetrics: MetricsSnapshot
): {
  passRate: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
  totalBugs: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
  executedTests: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
  totalTasks: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
  totalTestCases: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
  totalStrategies: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
  activePhases: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
} => {
  const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  const currTasks = currentMetrics.totalTasks ?? 0;
  const prevTasks = previousMetrics.totalTasks ?? 0;
  const currStrategies = currentMetrics.totalStrategies ?? 0;
  const prevStrategies = previousMetrics.totalStrategies ?? 0;
  const currPhases = currentMetrics.activePhasesCount ?? 0;
  const prevPhases = previousMetrics.activePhasesCount ?? 0;

  return {
    passRate: {
      current: currentMetrics.testPassRate,
      previous: previousMetrics.testPassRate,
      trend: calculateTrend(currentMetrics.testPassRate, previousMetrics.testPassRate),
    },
    totalBugs: {
      current: currentMetrics.totalBugs,
      previous: previousMetrics.totalBugs,
      trend: calculateTrend(previousMetrics.totalBugs, currentMetrics.totalBugs), // Invertido: menos bugs é melhor
    },
    executedTests: {
      current: currentMetrics.executedTestCases,
      previous: previousMetrics.executedTestCases,
      trend: calculateTrend(currentMetrics.executedTestCases, previousMetrics.executedTestCases),
    },
    totalTasks: {
      current: currTasks,
      previous: prevTasks,
      trend: calculateTrend(currTasks, prevTasks),
    },
    totalTestCases: {
      current: currentMetrics.totalTestCases,
      previous: previousMetrics.totalTestCases,
      trend: calculateTrend(currentMetrics.totalTestCases, previousMetrics.totalTestCases),
    },
    totalStrategies: {
      current: currStrategies,
      previous: prevStrategies,
      trend: calculateTrend(currStrategies, prevStrategies),
    },
    activePhases: {
      current: currPhases,
      previous: prevPhases,
      trend: calculateTrend(currPhases, prevPhases),
    },
  };
};

/**
 * Obtém métricas do período atual e anterior para comparação
 */
export const getCurrentAndPreviousPeriodMetrics = (
  project: Project,
  period: 'week' | 'month' = 'week'
): {
  current?: MetricsSnapshot;
  previous?: MetricsSnapshot;
} => {
  const history = project.metricsHistory || [];
  if (history.length === 0) return {};

  const now = new Date();
  const currentPeriodStart = new Date();
  const previousPeriodStart = new Date();
  const previousPeriodEnd = new Date();

  if (period === 'week') {
    // Semana atual: últimos 7 dias
    currentPeriodStart.setDate(now.getDate() - 7);
    // Semana anterior: 7 dias antes disso
    previousPeriodStart.setDate(now.getDate() - 14);
    previousPeriodEnd.setDate(now.getDate() - 7);
  } else {
    // Mês atual: últimos 30 dias
    currentPeriodStart.setDate(now.getDate() - 30);
    // Mês anterior: 30 dias antes disso
    previousPeriodStart.setDate(now.getDate() - 60);
    previousPeriodEnd.setDate(now.getDate() - 30);
  }

  const currentPeriodSnapshots = history.filter(s => new Date(s.date) >= currentPeriodStart);
  const previousPeriodSnapshots = history.filter(
    s => new Date(s.date) >= previousPeriodStart && new Date(s.date) < previousPeriodEnd
  );

  // Pegar o snapshot mais recente de cada período
  const current =
    currentPeriodSnapshots.length > 0
      ? currentPeriodSnapshots.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]
      : undefined;

  const previous =
    previousPeriodSnapshots.length > 0
      ? previousPeriodSnapshots.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]
      : undefined;

  return { current, previous };
};

/**
 * Cria um snapshot das métricas atuais
 */
export const createMetricsSnapshot = (
  totalTestCases: number,
  passedTestCases: number,
  failedTestCases: number,
  blockedTestCases: number,
  notRunTestCases: number,
  totalBugs: number,
  bugsBySeverity: Record<string, number>,
  executedTestCases: number,
  testPassRate: number,
  automationRatio: number,
  totalTasks?: number,
  totalStrategies?: number,
  activePhasesCount?: number
): MetricsSnapshot => {
  return {
    date: new Date().toISOString(),
    totalTestCases,
    passedTestCases,
    failedTestCases,
    blockedTestCases,
    notRunTestCases,
    totalBugs,
    bugsBySeverity: bugsBySeverity as Record<'Crítico' | 'Alto' | 'Médio' | 'Baixo', number>,
    executedTestCases,
    testPassRate,
    automationRatio,
    totalTasks,
    totalStrategies,
    activePhasesCount,
  };
};
