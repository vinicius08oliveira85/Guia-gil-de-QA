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
  landingNeuLinkBtnClass,
  landingNeuStatusChipClass,
  landingTextMutedClass,
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
      className={landingNeuStatusChipClass(item.ok)}
      title={item.detail ?? item.label}
      role="status"
      aria-label={`${item.label}: ${item.ok ? 'configurado' : 'não configurado'}`}
    >
      {item.ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
      ) : (
        <CircleDashed
          className={cn('h-3.5 w-3.5 shrink-0', landingTextMutedClass)}
          aria-hidden
        />
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
export interface LandingIntegrationStatusProps {
  className?: string;
}

export const LandingIntegrationStatus = React.memo<LandingIntegrationStatusProps>(({ className }) => {
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
    <div
      className={cn(
        'landing-integration-status flex w-full flex-col items-center gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start',
        className
      )}
    >
      <span
        className={cn(
          'hidden text-[0.6875rem] font-bold uppercase tracking-wider sm:inline',
          landingTextMutedClass
        )}
      >
        Integrações
      </span>
      <div
        className="flex flex-wrap items-center justify-center gap-2 lg:justify-start"
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
          className={landingNeuLinkBtnClass}
          aria-label="Configurar integrações pendentes"
        >
          Configurar integrações
        </Link>
      ) : (
        <span className={cn('text-xs font-semibold', landingTextStrongClass)}>Tudo configurado</span>
      )}
    </div>
  );
});

LandingIntegrationStatus.displayName = 'LandingIntegrationStatus';
