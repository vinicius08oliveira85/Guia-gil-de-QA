import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import {
  GeminiConfig,
  saveGeminiConfig,
  getGeminiConfig,
  deleteGeminiConfig,
} from '../../services/geminiConfigService';
import { Modal } from '../common/Modal';
import { Spinner } from '../common/Spinner';
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
  leveViewInlineCodeClass,
  leveViewOutlineBtnClass,
  leveViewPrimaryBtnClass,
} from '../common/projectCardUi';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import {
  settingsNeuConfiguredPanelClass,
  settingsNeuEditBtnClass,
  settingsNeuInlineActionsClass,
  settingsNeuModalPanelClass,
  settingsNeuRemoveBtnClass,
} from './settingsNeuUi';

interface GeminiApiKeysTabProps {
  onDirtyChange?: (dirty: boolean) => void;
}

export const GeminiApiKeysTab: React.FC<GeminiApiKeysTabProps> = ({ onDirtyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [keyError, setKeyError] = useState('');
  const { handleError, handleSuccess } = useErrorHandler();

  const validateKey = (v: string) =>
    v.trim().length > 0 && v.trim().length < 10 ? 'Chave muito curta (mínimo 10 caracteres)' : '';

  useEffect(() => {
    try {
      const savedConfig = getGeminiConfig();
      if (savedConfig?.apiKey) {
        setApiKey(savedConfig.apiKey);
        setIsConfigured(true);
      }
    } catch (error) {
      console.warn('Erro ao carregar configuração do Gemini:', error);
    }
  }, []);

  const reloadManager = async () => {
    try {
      const { geminiApiKeyManager } = await import('../../services/ai/geminiApiKeyManager');
      geminiApiKeyManager.reloadKeys();
      const { invalidateAIServiceCache } = await import('../../services/ai/aiServiceFactory');
      invalidateAIServiceCache();
    } catch {
      console.warn('Erro ao recarregar keys no manager');
    }
  };

  const handleTestKey = async () => {
    const key = apiKey.trim();
    if (!key) {
      toast.error('Preencha a chave API antes de testar.');
      return;
    }
    if (key.length < 10) {
      toast.error('Chave muito curta.');
      return;
    }
    setIsTesting(true);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
        { signal: AbortSignal.timeout(10_000) }
      );
      if (res.ok) {
        toast.success('Chave API válida e com acesso ao Gemini!');
      } else {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error?.message ?? `Resposta inesperada (status ${res.status})`;
        toast.error(`Chave inválida: ${msg}`);
      }
    } catch {
      toast.error('Falha ao testar a chave. Verifique sua conexão.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!apiKey.trim()) {
      handleError(new Error('Preencha a chave API'), 'Configuração do Gemini');
      return;
    }
    if (apiKey.trim().length < 10) {
      handleError(
        new Error('Chave API inválida. Verifique o formato da chave.'),
        'Configuração do Gemini'
      );
      return;
    }

    setIsSaving(true);
    try {
      const config: GeminiConfig = { apiKey: apiKey.trim() };
      saveGeminiConfig(config);
      await reloadManager();
      setIsConfigured(true);
      setShowConfigModal(false);
      onDirtyChange?.(false);
      handleSuccess('Chave API do Gemini configurada com sucesso!');
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error('Erro ao salvar configuração'),
        'Configuração do Gemini'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      deleteGeminiConfig();
      setApiKey('');
      setIsConfigured(false);

      try {
        const { geminiApiKeyManager } = await import('../../services/ai/geminiApiKeyManager');
        geminiApiKeyManager.reloadKeys();
        const { invalidateAIServiceCache } = await import('../../services/ai/aiServiceFactory');
        invalidateAIServiceCache();
      } catch (reloadError) {
        console.warn('Erro ao recarregar keys no manager:', reloadError);
      }

      handleSuccess('Chave API do Gemini removida');
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error('Erro ao remover configuração'),
        'Configuração do Gemini'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className={leveSettingsSectionRowClass}>
        <div className={leveSettingsSectionMainClass}>
          <div className={leveSettingsSectionIconWrapClass}>
            <Key className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={leveSettingsSectionTitleClass}>Chave API do Gemini</h3>
            <p className={leveSettingsSectionSubtitleClass}>
              Configure sua chave API do Google Gemini para usar funcionalidades de IA
            </p>
            <p className={cn(leveSettingsMutedTextXsClass, 'mt-2')}>
              Conteúdo de documentos e descrições de tarefas são enviados ao provedor de IA para
              análises e gerações. Evite colar dados sensíveis se necessário.
            </p>
          </div>
        </div>
        {isConfigured ? (
          <StatusBadge variant="configured">Configurado</StatusBadge>
        ) : (
          <StatusBadge variant="warning">Não Configurado</StatusBadge>
        )}
      </div>

      {!isConfigured ? (
        <div className={leveSettingsInsetPanelClass}>
          <div className="space-y-4">
            <p className={leveSettingsMutedTextClass}>
              Configure sua chave API do Google Gemini para habilitar funcionalidades de IA no
              aplicativo.
            </p>
            <ul className={leveSettingsListClass}>
              <li>A chave API é armazenada localmente no seu navegador</li>
              <li>
                Você pode obter uma chave em:{' '}
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={leveSettingsLinkClass}
                >
                  Google AI Studio
                </a>
              </li>
              <li>
                A chave também pode ser configurada via variável de ambiente{' '}
                <code className={leveViewInlineCodeClass}>VITE_GEMINI_API_KEY</code>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className={leveSettingsPrimaryBtnFullClass}
            >
              <Key className="h-4 w-4" aria-hidden />
              Configurar Chave API
            </button>
          </div>
        </div>
      ) : (
        <div className={settingsNeuConfiguredPanelClass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="font-sans text-sm font-medium text-[var(--leve-header-text)]">Chave API configurada</p>
              <p className="break-all font-mono text-xs text-[rgba(245,241,230,0.72)]">
                {apiKey && apiKey.length > 12
                  ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
                  : '••••••••'}
              </p>
            </div>
            <div className={settingsNeuInlineActionsClass}>
              <button
                type="button"
                onClick={() => {
                  const savedConfig = getGeminiConfig();
                  if (savedConfig) {
                    setApiKey(savedConfig.apiKey);
                  }
                  setShowConfigModal(true);
                }}
                className={settingsNeuEditBtnClass}
              >
                Editar
              </button>
              <button type="button" onClick={handleDisconnect} className={settingsNeuRemoveBtnClass}>
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Configurar Chave API do Gemini"
        size="lg"
        maxHeight="90vh"
        panelClassName={settingsNeuModalPanelClass}
      >
        <div className="space-y-5 pb-2">
          <Input
            label="Chave API do Gemini *"
            type="password"
            value={apiKey}
            onChange={e => {
              setApiKey(e.target.value);
              onDirtyChange?.(true);
            }}
            onBlur={() => setKeyError(validateKey(apiKey))}
            placeholder="Sua chave API do Gemini"
            error={keyError}
            leftIcon={<Key className="w-4 h-4" />}
          />
          <p className={cn(leveSettingsMutedTextXsClass, '-mt-3')}>
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className={leveSettingsLinkClass}
            >
              Como obter uma chave API?
            </a>{' '}
            — A chave é armazenada localmente no navegador.
          </p>

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[color-mix(in_srgb,var(--leve-header-text)_12%,transparent)] pt-4">
            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className={leveViewOutlineBtnClass}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleTestKey}
              disabled={isTesting || isSaving || !apiKey.trim()}
              className={cn(
                leveViewOutlineBtnClass,
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {isTesting ? (
                <>
                  <Spinner small />
                  Testando...
                </>
              ) : (
                'Testar Chave'
              )}
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={isTesting || isSaving || !apiKey.trim()}
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
    </div>
  );
};
