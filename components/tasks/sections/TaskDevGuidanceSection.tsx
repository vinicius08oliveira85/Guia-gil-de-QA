import React, { useMemo, useCallback } from 'react';
import type { CursorAgentAction, JiraTask, Project } from '../../../types';
import { devGuidanceToMarkdown } from '../../../utils/devGuidanceExport';
import { isDevGuidanceOutdated } from '../../../services/ai/devGuidanceGenerationService';
import { cn } from '../../../utils/cn';
import {
  CURSOR_AGENT_ACTION_BADGE_CLASS,
  CURSOR_AGENT_ACTION_LABELS,
  CURSOR_IMPLEMENTATION_TOOL_LABEL,
} from '../../../utils/cursorAgentUi';
import { Sparkles, Copy, Download, AlertTriangle, Bot, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { dashboardPanelClass } from '../../dashboard/dashboardNeuUi';
import { useTaskDetail } from './TaskDetailContext';

export interface TaskDevGuidanceSectionProps {
  task: JiraTask;
  project?: Project;
  onGenerate: () => void | Promise<void>;
  isGenerating: boolean;
}

async function copyText(label: string, text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência.`);
  } catch {
    toast.error('Não foi possível copiar.');
  }
}

const CursorPromptPanel: React.FC<{
  title: string;
  prompt: string;
  action?: CursorAgentAction;
  copyLabel?: string;
}> = ({ title, prompt, action, copyLabel = 'Copiar prompt' }) => (
  <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Bot className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          {title}
        </span>
        {action ? (
          <span className={cn('badge badge-sm', CURSOR_AGENT_ACTION_BADGE_CLASS[action])}>
            {CURSOR_AGENT_ACTION_LABELS[action]}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => void copyText('Prompt', prompt)}
        className="btn btn-primary btn-xs gap-1"
        aria-label={copyLabel}
      >
        <Copy className="h-3.5 w-3.5" aria-hidden />
        {copyLabel}
      </button>
    </div>
    <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-base-100/90 p-3 text-xs leading-relaxed text-base-content/90">
      {prompt}
    </pre>
  </div>
);

export const TaskDevGuidanceSection: React.FC<TaskDevGuidanceSectionProps> = ({
  task,
  onGenerate,
  isGenerating,
}) => {
  const { onShowDevImplementationReport } = useTaskDetail();
  const guidance = task.devGuidance;
  const outdated = useMemo(() => isDevGuidanceOutdated(task), [task]);

  const handleCopyAll = useCallback(async () => {
    if (!guidance) return;
    await copyText('Guia completo', devGuidanceToMarkdown(task, guidance));
  }, [guidance, task]);

  const handleDownload = () => {
    if (!guidance) return;
    const md = devGuidanceToMarkdown(task, guidance);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guia-dev-${task.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasCursorPrompts =
    Boolean(guidance?.cursorAgentMasterPrompt?.trim()) ||
    guidance?.implementationSteps.some(s => s.cursorAgentPrompt?.trim());

  return (
    <div className="space-y-4">
      <div className={cn(dashboardPanelClass, 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between')}>
        <div>
          <h3 className="text-base font-bold text-base-content">Guia de implementação (IA)</h3>
          <p className="text-sm text-base-content/70">
            Gera passos técnicos e prompts prontos para colar no{' '}
            <strong className="font-semibold">{CURSOR_IMPLEMENTATION_TOOL_LABEL}</strong>.
          </p>
          {task.devGuidanceGeneratedAt ? (
            <p className="mt-1 text-xs text-base-content/55">
              Última geração: {new Date(task.devGuidanceGeneratedAt).toLocaleString('pt-BR')}
            </p>
          ) : null}
          {outdated && guidance ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-warning">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              O contexto da tarefa mudou — considere regenerar o guia.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void onGenerate()}
            disabled={isGenerating}
            className="btn btn-primary btn-sm gap-1.5"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {isGenerating ? 'Gerando…' : guidance ? 'Regenerar guia' : 'Gerar guia com IA'}
          </button>
          {guidance ? (
            <>
              <button type="button" onClick={() => void handleCopyAll()} className="btn btn-ghost btn-sm gap-1">
                <Copy className="h-4 w-4" aria-hidden />
                Copiar tudo
              </button>
              <button type="button" onClick={handleDownload} className="btn btn-ghost btn-sm gap-1">
                <Download className="h-4 w-4" aria-hidden />
                Baixar .md
              </button>
              {onShowDevImplementationReport ? (
                <button
                  type="button"
                  onClick={onShowDevImplementationReport}
                  className="btn btn-secondary btn-sm gap-1"
                >
                  <FileCheck className="h-4 w-4" aria-hidden />
                  {task.devImplementationRecord ? 'Ver registro' : 'Registrar implementação'}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {!guidance ? (
        <p className="text-sm text-base-content/65">
          Nenhum guia gerado ainda. Configure a stack no dashboard do projeto e clique em{' '}
          <strong className="font-medium">Gerar guia com IA</strong> para receber prompts prontos
          para o Agente do Cursor (criar, modificar ou excluir código).
        </p>
      ) : (
        <div className="space-y-4">
          {guidance.cursorAgentMasterPrompt?.trim() ? (
            <article className={cn(dashboardPanelClass, 'border-primary/25')}>
              <h4 className="font-semibold text-base-content">Prompt mestre — Agente do Cursor</h4>
              <p className="mt-1 text-sm text-base-content/70">
                Cole este prompt no chat do Cursor para implementar a tarefa completa de uma vez.
              </p>
              <CursorPromptPanel
                title="Implementação completa"
                prompt={guidance.cursorAgentMasterPrompt.trim()}
                copyLabel="Copiar prompt mestre"
              />
            </article>
          ) : null}

          {!hasCursorPrompts ? (
            <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-base-content/80">
              Este guia foi gerado antes da integração com Cursor. Regenerar para obter prompts
              prontos para o Agente.
            </p>
          ) : null}

          <article className={dashboardPanelClass}>
            <h4 className="mb-2 font-semibold text-base-content">Visão geral</h4>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-base-content/85">
              {guidance.overview}
            </p>
          </article>

          {guidance.prerequisites.length > 0 ? (
            <article className={dashboardPanelClass}>
              <h4 className="mb-2 font-semibold text-base-content">Pré-requisitos</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm text-base-content/85">
                {guidance.prerequisites.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </article>
          ) : null}

          {guidance.implementationSteps.map(step => (
            <article key={step.order} className={dashboardPanelClass}>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold text-base-content">
                  {step.order}. {step.title}
                </h4>
                {step.cursorAgentAction ? (
                  <span
                    className={cn(
                      'badge badge-sm',
                      CURSOR_AGENT_ACTION_BADGE_CLASS[step.cursorAgentAction]
                    )}
                  >
                    {CURSOR_AGENT_ACTION_LABELS[step.cursorAgentAction]}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/85">
                {step.description}
              </p>
              {step.filesOrModules?.length ? (
                <ul className="mt-2 list-disc pl-5 text-sm text-base-content/75">
                  {step.filesOrModules.map(f => (
                    <li key={f}>
                      <code className="text-xs">{f}</code>
                    </li>
                  ))}
                </ul>
              ) : null}
              {step.codeHints?.trim() ? (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-base-200/80 p-3 text-xs">
                  {step.codeHints}
                </pre>
              ) : null}
              {step.cursorAgentPrompt?.trim() ? (
                <CursorPromptPanel
                  title={`Passo ${step.order} — Cursor Agent`}
                  prompt={step.cursorAgentPrompt.trim()}
                  action={step.cursorAgentAction}
                  copyLabel="Copiar prompt do passo"
                />
              ) : null}
              {step.validationChecklist?.length ? (
                <ul className="mt-2 space-y-1 text-sm text-base-content/80">
                  {step.validationChecklist.map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden>☐</span>
                      {c}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}

          {guidance.dataModel?.trim() ? (
            <article className={dashboardPanelClass}>
              <h4 className="mb-2 font-semibold text-base-content">Modelo de dados</h4>
              <pre className="whitespace-pre-wrap text-sm text-base-content/85">{guidance.dataModel}</pre>
            </article>
          ) : null}

          {guidance.apiContracts?.trim() ? (
            <article className={dashboardPanelClass}>
              <h4 className="mb-2 font-semibold text-base-content">Contratos de API</h4>
              <pre className="whitespace-pre-wrap text-sm text-base-content/85">{guidance.apiContracts}</pre>
            </article>
          ) : null}

          {guidance.risksAndEdgeCases?.length ? (
            <article className={dashboardPanelClass}>
              <h4 className="mb-2 font-semibold text-base-content">Riscos e edge cases</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {guidance.risksAndEdgeCases.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </article>
          ) : null}

          {guidance.suggestedTests?.length ? (
            <article className={dashboardPanelClass}>
              <h4 className="mb-2 font-semibold text-base-content">Testes sugeridos (para você escrever)</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {guidance.suggestedTests.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </article>
          ) : null}
        </div>
      )}
    </div>
  );
};

TaskDevGuidanceSection.displayName = 'TaskDevGuidanceSection';
