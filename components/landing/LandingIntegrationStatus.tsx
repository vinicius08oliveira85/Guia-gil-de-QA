import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CircleDashed, HardDrive, KeyRound, Link2 } from 'lucide-react';
import { getJiraConfig } from '../../services/jiraService';
import { hasGeminiConfig } from '../../services/geminiConfigService';
import {
  getConfiguredFolderLabel,
  hasConfiguredBackupFolder,
  isLocalFolderBackupSupported,
} from '../../services/localFolderBackupService';
import {
  landingAccentTextClass,
  landingStatusChipIdleClass,
  landingStatusChipOkClass,
  landingTextStrongClass,
} from './landingNeuUi';
import { cn } from '../../utils/cn';

interface StatusItem {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
  icon: React.ReactNode;
}

function StatusChip({ item }: { item: StatusItem }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        item.ok ? landingStatusChipOkClass : landingStatusChipIdleClass
      )}
      title={item.detail ?? item.label}
      role="status"
      aria-label={`${item.label}: ${item.ok ? 'configurado' : 'não configurado'}`}
    >
      {item.ok ? (
        <CheckCircle2
          className={cn('h-3.5 w-3.5 shrink-0', landingAccentTextClass)}
          aria-hidden
        />
      ) : (
        <CircleDashed className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      )}
      <span className="inline-flex items-center gap-1">
        {item.icon}
        {item.label}
      </span>
    </span>
  );
}

/**
 * Indicadores discretos de integrações (Jira, Gemini, pasta local).
 */
export const LandingIntegrationStatus = React.memo(() => {
  const [folderConfigured, setFolderConfigured] = useState(false);
  const [folderLabel, setFolderLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFolderLabel(getConfiguredFolderLabel());
    void hasConfiguredBackupFolder().then(ok => {
      if (!cancelled) setFolderConfigured(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const jiraOk = Boolean(getJiraConfig());
  const geminiOk = hasGeminiConfig();
  const folderSupported = isLocalFolderBackupSupported();

  const items: StatusItem[] = [
    {
      id: 'jira',
      label: 'Jira',
      ok: jiraOk,
      detail: jiraOk ? 'Credenciais Jira configuradas' : 'Configure o Jira em Configurações',
      icon: <Link2 className="h-3 w-3" aria-hidden />,
    },
    {
      id: 'gemini',
      label: 'Gemini',
      ok: geminiOk,
      detail: geminiOk ? 'Chave Gemini configurada' : 'Configure a IA em Configurações',
      icon: <KeyRound className="h-3 w-3" aria-hidden />,
    },
  ];

  if (folderSupported) {
    items.push({
      id: 'folder',
      label: 'Pasta local',
      ok: folderConfigured,
      detail: folderConfigured
        ? folderLabel
          ? `Pasta: ${folderLabel}`
          : 'Pasta de backup configurada'
        : 'Configure a pasta de backup em Configurações',
      icon: <HardDrive className="h-3 w-3" aria-hidden />,
    });
  }

  const missing = items.filter(i => !i.ok).length;

  return (
    <div className="flex w-full flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
      <div
        className="flex flex-wrap items-center justify-center gap-2"
        role="list"
        aria-label="Status das integrações"
      >
        {items.map(item => (
          <span key={item.id} role="listitem">
            <StatusChip item={item} />
          </span>
        ))}
      </div>
      {missing > 0 ? (
        <Link
          to="/settings"
          className={cn(
            'text-xs font-semibold underline-offset-2 hover:underline',
            landingAccentTextClass,
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--project-card-accent)]'
          )}
        >
          Configurar integrações
        </Link>
      ) : (
        <span className={cn('text-xs font-medium', landingTextStrongClass)}>Tudo configurado</span>
      )}
    </div>
  );
});

LandingIntegrationStatus.displayName = 'LandingIntegrationStatus';
