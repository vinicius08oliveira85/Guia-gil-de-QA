import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Key,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  addGeminiKey,
  getGeminiEnvKeyInfo,
  getGeminiKeysConfig,
  maskGeminiApiKey,
  removeGeminiKey,
  reorderGeminiKeys,
  type GeminiApiKeyEntry,
  updateGeminiKey,
} from '../../services/geminiConfigService';
import { geminiApiKeyManager } from '../../services/ai/geminiApiKeyManager';
import {
  GEMINI_USAGE_UPDATED_EVENT,
  getGeminiKeyUsage,
  resetGeminiKeyUsage,
} from '../../services/ai/geminiUsageTracker';
import { geminiRateLimiter } from '../../utils/rateLimiter';
import { Modal } from '../common/Modal';
import { Spinner } from '../common/Spinner';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { StatusBadge } from './StatusBadge';
import { Input } from '../common/Input';
import {
  leveSettingsInsetPanelClass,
  leveSettingsLinkClass,
  leveSettingsListClass,
  leveSettingsMutedTextClass,
  leveSettingsMutedTextXsClass,
  leveSettingsOutlineBtnClass,
  leveSettingsPrimaryBtnFullClass,
  leveSettingsSectionIconWrapClass,
  leveSettingsSectionMainClass,
  leveSettingsSectionRowClass,
  leveSettingsSectionSubtitleClass,
  leveSettingsSectionTitleClass,
  leveSettingsStrongTextClass,
  leveViewOutlineBtnClass,
  leveViewPrimaryBtnClass,
} from '../common/projectCardUi';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import {
  settingsNeuInlineActionsClass,
  settingsNeuModalPanelClass,
  settingsNeuRemoveBtnClass,
} from './settingsNeuUi';

interface GeminiApiKeysTabProps {
  onDirtyChange?: (dirty: boolean) => void;
}

type KeyFormState = {
  id?: string;
  name: string;
  apiKey: string;
  enabled: boolean;
};

function formatDuration(ms: number): string {
  if (ms <= 0) return 'agora';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes} min`;
}

function formatTimestamp(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR');
  } catch {
    return iso;
  }
}

async function reloadGeminiRuntime(): Promise<void> {
  geminiApiKeyManager.reloadKeys();
  const { invalidateAIServiceCache } = await import('../../services/ai/aiServiceFactory');
  invalidateAIServiceCache();
}

async function testGeminiKey(key: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
    { signal: AbortSignal.timeout(10_000) }
  );
  if (res.ok) {
    return { ok: true, message: 'Chave válida com acesso ao Gemini.' };
  }
  const body = await res.json().catch(() => ({}));
  const msg = body?.error?.message ?? `Resposta inesperada (status ${res.status})`;
  return { ok: false, message: msg };
}

export const GeminiApiKeysTab: React.FC<GeminiApiKeysTabProps> = ({ onDirtyChange }) => {
  const [keys, setKeys] = useState<GeminiApiKeyEntry[]>(() => getGeminiKeysConfig().keys);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<KeyFormState>({ name: '', apiKey: '', enabled: true });
  const [keyError, setKeyError] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<GeminiApiKeyEntry | null>(null);
  const [usageTick, setUsageTick] = useState(0);
  const { handleError, handleSuccess } = useErrorHandler();

  const refreshKeys = useCallback(() => {
    setKeys(getGeminiKeysConfig().keys);
    setUsageTick(t => t + 1);
  }, []);

  const refreshStatus = useCallback(async () => {
    await reloadGeminiRuntime();
    refreshKeys();
  }, [refreshKeys]);

  useEffect(() => {
    const onUsage = () => setUsageTick(t => t + 1);
    window.addEventListener(GEMINI_USAGE_UPDATED_EVENT, onUsage);
    return () => window.removeEventListener(GEMINI_USAGE_UPDATED_EVENT, onUsage);
  }, []);

  const managerStats = useMemo(() => geminiApiKeyManager.getStats(), [keys, usageTick]);
  const exhaustedInfo = useMemo(() => geminiApiKeyManager.getExhaustedKeysInfo(), [keys, usageTick]);
  const rateStats = useMemo(() => geminiRateLimiter.getStats(), [usageTick]);

  const envKeyInfo = useMemo(() => getGeminiEnvKeyInfo(), [keys, usageTick]);

  const exhaustedById = useMemo(
    () => new Map(exhaustedInfo.map(info => [info.keyId, info])),
    [exhaustedInfo]
  );

  const isConfigured =
    keys.some(k => k.enabled && k.apiKey.trim().length > 0) || Boolean(envKeyInfo?.configured);

  const handleReactivateKey = (keyId: string, keyName: string) => {
    const reactivated = geminiApiKeyManager.reactivateKey(keyId);
    if (reactivated) {
      refreshKeys();
      handleSuccess(`Chave "${keyName}" reativada.`);
    } else {
      handleError(new Error('Não foi possível reativar a chave.'), 'API Keys Gemini');
    }
  };

  const validateKey = (v: string, isEdit: boolean) => {
    if (!v.trim() && isEdit) return '';
    return v.trim().length > 0 && v.trim().length < 10
      ? 'Chave muito curta (mínimo 10 caracteres)'
      : '';
  };

  const openAddModal = () => {
    setForm({ name: '', apiKey: '', enabled: true });
    setKeyError('');
    setShowModal(true);
  };

  const openEditModal = (entry: GeminiApiKeyEntry) => {
    setForm({
      id: entry.id,
      name: entry.name,
      apiKey: entry.apiKey,
      enabled: entry.enabled,
    });
    setKeyError('');
    setShowModal(true);
  };

  const handleTestKey = async () => {
    const key = form.apiKey.trim();
    if (!key) {
      toast.error('Preencha a chave API antes de testar.');
      return;
    }
    setIsTesting(true);
    try {
      const result = await testGeminiKey(key);
      if (result.ok) toast.success(result.message);
      else toast.error(`Chave inválida: ${result.message}`);
    } catch {
      toast.error('Falha ao testar a chave. Verifique sua conexão.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const apiKey = form.apiKey.trim();

    if (!name) {
      handleError(new Error('Informe um nome para identificar a chave.'), 'API Keys Gemini');
      return;
    }

    if (!form.id && !apiKey) {
      handleError(new Error('Preencha a chave API.'), 'API Keys Gemini');
      return;
    }

    const validation = validateKey(apiKey, Boolean(form.id));
    if (validation) {
      setKeyError(validation);
      return;
    }

    setIsSaving(true);
    try {
      if (form.id) {
        updateGeminiKey(form.id, {
          name,
          ...(apiKey ? { apiKey } : {}),
          enabled: form.enabled,
        });
      } else {
        addGeminiKey({ name, apiKey, enabled: form.enabled });
      }
      await reloadGeminiRuntime();
      refreshKeys();
      setShowModal(false);
      onDirtyChange?.(false);
      handleSuccess(form.id ? 'Chave atualizada.' : 'Chave adicionada.');
    } catch (error) {
      handleError(error, 'API Keys Gemini');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (entry: GeminiApiKeyEntry) => {
    try {
      removeGeminiKey(entry.id);
      resetGeminiKeyUsage(entry.id);
      await reloadGeminiRuntime();
      refreshKeys();
      setRemoveTarget(null);
      handleSuccess(`Chave "${entry.name}" removida.`);
    } catch (error) {
      handleError(error, 'Remover chave Gemini');
    }
  };

  const moveKey = async (id: string, direction: 'up' | 'down') => {
    const index = keys.findIndex(k => k.id === id);
    if (index < 0) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= keys.length) return;

    const ordered = [...keys];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    reorderGeminiKeys(ordered.map(k => k.id));
    await reloadGeminiRuntime();
    refreshKeys();
  };

  const getKeyStatusVariant = (
    entry: GeminiApiKeyEntry
  ): 'configured' | 'warning' | 'disconnected' => {
    if (!entry.enabled) return 'disconnected';
    if (exhaustedById.has(entry.id)) return 'warning';
    return 'configured';
  };

  const getKeyStatusLabel = (entry: GeminiApiKeyEntry): string => {
    if (!entry.enabled) return 'Desabilitada';
    const exhausted = exhaustedById.get(entry.id);
    if (exhausted) {
      return `Limite (${formatDuration(exhausted.timeUntilReuseMs)} para reset)`;
    }
    return 'Ativa';
  };

  return (
    <div className="space-y-6">
      <div className={leveSettingsSectionRowClass}>
        <div className={leveSettingsSectionMainClass}>
          <div className={leveSettingsSectionIconWrapClass}>
            <Key className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={leveSettingsSectionTitleClass}>Chaves API do Gemini</h3>
            <p className={leveSettingsSectionSubtitleClass}>
              Cadastre múltiplas chaves com nome. Em caso de limite (429), o app usa a próxima na
              ordem de fallback.
            </p>
            <p className={cn(leveSettingsMutedTextXsClass, 'mt-2')}>
              Métricas abaixo refletem o uso neste app — não a quota oficial do Google AI Studio.
            </p>
          </div>
        </div>
        {isConfigured ? (
          <StatusBadge variant="configured">
            {managerStats.availableKeys}/{managerStats.totalKeys} ativa(s)
          </StatusBadge>
        ) : (
          <StatusBadge variant="warning">Não configurado</StatusBadge>
        )}
      </div>

      <div className={cn(leveSettingsInsetPanelClass, 'grid gap-3 sm:grid-cols-3')}>
        <div>
          <p className={leveSettingsStrongTextClass}>Rate limiter local</p>
          <p className={cn(leveSettingsMutedTextXsClass, 'mt-1')}>
            {rateStats.currentRequests}/{rateStats.maxRequests} req/min · fila: {rateStats.queueLength}
          </p>
        </div>
        <div>
          <p className={leveSettingsStrongTextClass}>Chave em uso agora</p>
          <p className={cn(leveSettingsMutedTextXsClass, 'mt-1')}>
            {managerStats.currentKeyName ?? '—'}
          </p>
        </div>
        <div>
          <p className={leveSettingsStrongTextClass}>Esgotadas</p>
          <p className={cn(leveSettingsMutedTextXsClass, 'mt-1')}>
            {managerStats.exhaustedKeys} de {managerStats.totalKeys}
          </p>
        </div>
      </div>

      {envKeyInfo ? (
        <div className={cn(leveSettingsInsetPanelClass, 'space-y-3 p-4')}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={leveSettingsStrongTextClass}>{envKeyInfo.name}</p>
                <StatusBadge variant={envKeyInfo.activeAsFallback ? 'configured' : 'disconnected'}>
                  {envKeyInfo.activeAsFallback ? 'Ativa (.env)' : 'Reserva (.env)'}
                </StatusBadge>
                {envKeyInfo.activeAsFallback && exhaustedById.has(envKeyInfo.id) ? (
                  <StatusBadge variant="warning">Limite</StatusBadge>
                ) : null}
              </div>
              <p className={cn(leveSettingsMutedTextXsClass, 'mt-1')}>
                {envKeyInfo.activeAsFallback
                  ? 'Usada quando não há chaves habilitadas na interface.'
                  : 'Definida no .env, mas não entra no fallback enquanto existir chave na interface.'}
              </p>
              <p className="font-mono text-xs text-[var(--leve-header-text-muted)]">•••••••• (somente leitura)</p>
            </div>
            {envKeyInfo.activeAsFallback && exhaustedById.has(envKeyInfo.id) ? (
              <button
                type="button"
                className={leveSettingsOutlineBtnClass}
                onClick={() => handleReactivateKey(envKeyInfo.id, envKeyInfo.name)}
                aria-label="Reativar chave do ambiente"
              >
                Reativar agora
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {keys.length === 0 ? (
        <div className={leveSettingsInsetPanelClass}>
          <div className="space-y-4">
            <p className={leveSettingsMutedTextClass}>
              {envKeyInfo
                ? 'Nenhuma chave na interface. A chave do .env está em uso; adicione chaves aqui para priorizá-las.'
                : 'Nenhuma chave cadastrada. Adicione ao menos uma para habilitar IA.'}
            </p>
            <ul className={leveSettingsListClass}>
              <li>Chaves ficam apenas no seu navegador</li>
              <li>
                Obtenha em{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={leveSettingsLinkClass}
                >
                  Google AI Studio
                </a>
              </li>
            </ul>
            <button type="button" onClick={openAddModal} className={leveSettingsPrimaryBtnFullClass}>
              <Plus className="h-4 w-4" aria-hidden />
              Adicionar primeira chave
            </button>
            {envKeyInfo ? (
              <button
                type="button"
                onClick={() => void refreshStatus()}
                className={leveViewOutlineBtnClass}
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                Atualizar status
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((entry, index) => {
            const usage = getGeminiKeyUsage(entry.id);
            void usageTick;

            return (
              <div
                key={entry.id}
                className={cn(leveSettingsInsetPanelClass, 'space-y-3 p-4')}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={leveSettingsStrongTextClass}>{entry.name}</p>
                      <StatusBadge variant={getKeyStatusVariant(entry)}>
                        {getKeyStatusLabel(entry)}
                      </StatusBadge>
                      <span className="font-sans text-[10px] uppercase tracking-wide text-[var(--leve-header-text-muted)]">
                        Fallback #{index + 1}
                      </span>
                    </div>
                    <p className="break-all font-mono text-xs text-[var(--leve-header-text-muted)]">
                      {maskGeminiApiKey(entry.apiKey)}
                    </p>
                  </div>
                  <div className={settingsNeuInlineActionsClass}>
                    <button
                      type="button"
                      className={leveSettingsOutlineBtnClass}
                      onClick={() => void moveKey(entry.id, 'up')}
                      disabled={index === 0}
                      aria-label={`Subir prioridade de ${entry.name}`}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={leveSettingsOutlineBtnClass}
                      onClick={() => void moveKey(entry.id, 'down')}
                      disabled={index === keys.length - 1}
                      aria-label={`Baixar prioridade de ${entry.name}`}
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={leveSettingsOutlineBtnClass}
                      onClick={() => openEditModal(entry)}
                    >
                      Editar
                    </button>
                    {exhaustedById.has(entry.id) ? (
                      <button
                        type="button"
                        className={leveSettingsOutlineBtnClass}
                        onClick={() => handleReactivateKey(entry.id, entry.name)}
                        aria-label={`Reativar chave ${entry.name}`}
                      >
                        Reativar
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={settingsNeuRemoveBtnClass}
                      onClick={() => setRemoveTarget(entry)}
                    >
                      Remover
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <p className={leveSettingsMutedTextClass}>
                    Requisições: <strong>{usage.requestCount}</strong> (ok: {usage.successCount} ·
                    erros: {usage.errorCount})
                  </p>
                  <p className={leveSettingsMutedTextClass}>
                    Limite (429): <strong>{usage.rateLimitCount}</strong>
                  </p>
                  <p className={leveSettingsMutedTextClass}>
                    Tokens (est.): <strong>{usage.estimatedTokens.toLocaleString('pt-BR')}</strong>
                  </p>
                  <p className={leveSettingsMutedTextClass}>
                    Último uso: {formatTimestamp(usage.lastUsedAt)}
                  </p>
                </div>
                {usage.lastErrorMessage ? (
                  <p className={cn(leveSettingsMutedTextXsClass, 'text-[#e54b4f]')}>
                    Último erro: {usage.lastErrorMessage}
                  </p>
                ) : null}
              </div>
            );
          })}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={openAddModal} className={leveViewPrimaryBtnClass}>
              <Plus className="h-4 w-4" aria-hidden />
              Adicionar chave
            </button>
            <button type="button" onClick={() => void refreshStatus()} className={leveViewOutlineBtnClass}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Atualizar status
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={form.id ? 'Editar chave API' : 'Adicionar chave API'}
        size="lg"
        maxHeight="90vh"
        panelClassName={settingsNeuModalPanelClass}
      >
        <div className="space-y-5 pb-2">
          <Input
            label="Nome / origem *"
            type="text"
            value={form.name}
            onChange={e => {
              setForm(prev => ({ ...prev, name: e.target.value }));
              onDirtyChange?.(true);
            }}
            placeholder="Ex.: Conta pessoal, Projeto cliente X"
            leftIcon={<Key className="w-4 h-4" />}
          />

          <Input
            label={form.id ? 'Chave API (deixe em branco para manter)' : 'Chave API *'}
            type="password"
            value={form.apiKey}
            onChange={e => {
              setForm(prev => ({ ...prev, apiKey: e.target.value }));
              onDirtyChange?.(true);
            }}
            onBlur={() => setKeyError(validateKey(form.apiKey, Boolean(form.id)))}
            placeholder="AIza..."
            error={keyError}
            leftIcon={<Key className="w-4 h-4" />}
          />

          <label className="flex items-start gap-2 font-sans text-sm">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary mt-0.5"
              checked={form.enabled}
              onChange={e => setForm(prev => ({ ...prev, enabled: e.target.checked }))}
            />
            <span>
              <span className={leveSettingsStrongTextClass}>Habilitada</span>
              <span className={cn(leveSettingsMutedTextXsClass, 'mt-1 block')}>
                Chaves desabilitadas não entram no fallback.
              </span>
            </span>
          </label>

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[color-mix(in_srgb,var(--leve-header-text)_12%,transparent)] pt-4">
            <button type="button" onClick={() => setShowModal(false)} className={leveViewOutlineBtnClass}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleTestKey()}
              disabled={isTesting || isSaving || !form.apiKey.trim()}
              className={cn(leveViewOutlineBtnClass, 'disabled:cursor-not-allowed disabled:opacity-50')}
            >
              {isTesting ? (
                <>
                  <Spinner small />
                  Testando...
                </>
              ) : (
                'Testar chave'
              )}
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isTesting || isSaving}
              className={cn(leveViewPrimaryBtnClass, 'disabled:cursor-not-allowed disabled:opacity-50')}
            >
              {isSaving ? (
                <>
                  <Spinner small />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeTarget && void handleRemove(removeTarget)}
        title="Remover chave API"
        message={
          removeTarget
            ? `Remover a chave "${removeTarget.name}"? As métricas de uso desta chave também serão apagadas.`
            : ''
        }
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

GeminiApiKeysTab.displayName = 'GeminiApiKeysTab';
