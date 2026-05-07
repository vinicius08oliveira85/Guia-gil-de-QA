import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { JiraTask } from '../../types';
import { isTestCasesOutdated } from '../../services/ai/testCaseGenerationService';
import { cn } from '../../utils/cn';
import { Badge } from '../common/Badge';

interface TestCasesFreshnessIndicatorProps {
  task: JiraTask;
  /** Quando true, oculta o indicador (a operação em curso já comunica o estado). */
  isGenerating?: boolean;
  /** `compact` = ícones na lista; `full` = badges e texto (modal / detalhe). */
  variant?: 'full' | 'compact';
  className?: string;
}

/**
 * Indicador de "frescor" dos casos de teste em relação ao snapshot atual da tarefa.
 *
 * Mostra:
 * - Badge "Casos de teste desatualizados" quando o conteúdo da tarefa diverge da última geração.
 * - Badge "Casos de teste atualizados" quando coincide com o último snapshot conhecido.
 * - Texto auxiliar com data relativa (`task.testCasesGeneratedAt`) quando disponível.
 *
 * Não renderiza nada quando não há dados suficientes para inferir o estado
 * (ex.: testes legados sem `testCasesSnapshotHash` e sem cache em memória —
 * `isTestCasesOutdated` retornaria `true` mas sem informação útil para o usuário).
 */
export const TestCasesFreshnessIndicator = React.memo<TestCasesFreshnessIndicatorProps>(
  ({ task, isGenerating = false, variant = 'full', className }) => {
    const outdated = useMemo(() => isTestCasesOutdated(task), [task]);

    const generatedAtRelative = useMemo(() => {
      if (!task.testCasesGeneratedAt) return null;
      const parsed = new Date(task.testCasesGeneratedAt);
      if (Number.isNaN(parsed.getTime())) return null;
      return formatDistanceToNow(parsed, { addSuffix: true, locale: ptBR });
    }, [task.testCasesGeneratedAt]);

    if (isGenerating) return null;

    const hasTrackedGeneration = Boolean(task.testCasesSnapshotHash);
    if (!hasTrackedGeneration) return null;

    if (variant === 'compact') {
      return (
        <span
          className={className}
          role="status"
          aria-live="polite"
          title={
            outdated
              ? 'Casos de teste desatualizados em relação ao conteúdo da tarefa'
              : 'Casos de teste alinhados com o conteúdo atual da tarefa'
          }
        >
          {outdated ? (
            <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" aria-hidden />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-success/80 shrink-0" aria-hidden />
          )}
        </span>
      );
    }

    return (
      <div
        className={cn('flex flex-col gap-1.5', className)}
        role="status"
        aria-live="polite"
        aria-label={
          outdated
            ? 'Casos de teste desatualizados em relação ao conteúdo atual da tarefa'
            : 'Casos de teste alinhados com o conteúdo atual da tarefa'
        }
      >
        {outdated ? (
          <Badge
            variant="warning"
            size="sm"
            appearance="pill"
            className="self-start gap-1.5"
          >
            <AlertTriangle className="w-3 h-3" aria-hidden />
            Casos de teste desatualizados
          </Badge>
        ) : (
          <Badge
            variant="success"
            size="sm"
            appearance="pill"
            className="self-start gap-1.5"
          >
            <CheckCircle2 className="w-3 h-3" aria-hidden />
            Casos de teste atualizados
          </Badge>
        )}
        {generatedAtRelative && (
          <span className="text-xs text-base-content/60" title={task.testCasesGeneratedAt}>
            Última geração {generatedAtRelative}
          </span>
        )}
        {outdated && (
          <span className="text-xs text-base-content/60">
            O conteúdo da tarefa mudou desde a última geração — considere regerar com IA.
          </span>
        )}
      </div>
    );
  }
);

TestCasesFreshnessIndicator.displayName = 'TestCasesFreshnessIndicator';
