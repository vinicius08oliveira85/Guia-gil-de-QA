export interface QualityMetrics {
    coverage: number;
    passRate: number;
    defectRate: number;
    reopeningRate: number;
}

/**
 * Calcula o Score Geral de Qualidade (0-100) baseado em múltiplos KPIs.
 * Pesos:
 * - Cobertura: 30%
 * - Taxa de Aprovação: 30%
 * - Taxa de Defeitos: 20% (Penaliza)
 * - Taxa de Reabertura: 20% (Penaliza)
 */
export const calculateQualityScore = (metrics: QualityMetrics): number => {
    const { coverage, passRate, defectRate, reopeningRate } = metrics;

    // Pesos para cada KPI (Total = 1.0)
    const weights = {
        coverage: 0.3,
        passRate: 0.3,
        defectRate: 0.2,
        reopeningRate: 0.2
    };

    // Normalização das métricas para escala 0-100
    // Cobertura e Pass Rate já são "quanto maior melhor"
    const scoreCoverage = Math.min(100, Math.max(0, coverage));
    const scorePassRate = Math.min(100, Math.max(0, passRate));

    // Defect Rate e Reopening Rate são "quanto menor melhor"
    // Consideramos que 0% = 100 pontos, e 10% ou mais = 0 pontos (penalidade severa)
    const scoreDefect = Math.max(0, 100 - (defectRate * 10));
    const scoreReopen = Math.max(0, 100 - (reopeningRate * 10));

    const finalScore = (
        (scoreCoverage * weights.coverage) +
        (scorePassRate * weights.passRate) +
        (scoreDefect * weights.defectRate) +
        (scoreReopen * weights.reopeningRate)
    );

    return Math.round(finalScore);
};

/**
 * Gera alertas baseados nos limiares definidos.
 */
export const getQualityAlerts = (metrics: QualityMetrics): string[] => {
    const alerts: string[] = [];

    if (metrics.reopeningRate > 10) {
        alerts.push("Taxa de Reabertura Crítica (>10%). Foco na estabilização sugerido.");
    }

    if (metrics.coverage < 80) {
        alerts.push(`Cobertura de Testes Abaixo do Limiar (80%). Atual: ${metrics.coverage}%`);
    }

    if (metrics.defectRate > 5) {
        alerts.push(`Taxa de Defeitos Elevada (${metrics.defectRate}%). Verifique a qualidade do código.`);
    }

    return alerts;
};