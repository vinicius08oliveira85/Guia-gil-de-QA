import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import { GeminiConfig, saveGeminiConfig, getGeminiConfig, deleteGeminiConfig } from '../../services/geminiConfigService';
import { Modal } from '../common/Modal';
import { Spinner } from '../common/Spinner';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { StatusBadge } from './StatusBadge';
import { Card } from '../common/Card';

export const GeminiApiKeysTab: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [isConfigured, setIsConfigured] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const { handleError, handleSuccess } = useErrorHandler();

    useEffect(() => {
        // Carregar configuração salva
        try {
            const savedConfig = getGeminiConfig();
            if (savedConfig?.apiKey) {
                setApiKey(savedConfig.apiKey);
                setIsConfigured(true);
            }
        } catch (error) {
            // Se houver erro ao carregar configuração, apenas logar e continuar
            console.warn('Erro ao carregar configuração do Gemini:', error);
        }
    }, []);

    const handleSaveConfig = async () => {
        if (!apiKey.trim()) {
            handleError(new Error('Preencha a chave API'), 'Configuração do Gemini');
            return;
        }

        // Validar formato básico
        if (apiKey.trim().length < 10) {
            handleError(new Error('Chave API inválida. Verifique o formato da chave.'), 'Configuração do Gemini');
            return;
        }

        setIsTesting(true);
        try {
            const config: GeminiConfig = { apiKey: apiKey.trim() };
            saveGeminiConfig(config);
            
            // Recarregar keys no manager
            try {
                const { geminiApiKeyManager } = await import('../../services/ai/geminiApiKeyManager');
                geminiApiKeyManager.reloadKeys();
            } catch (reloadError) {
                // Se houver erro ao recarregar, apenas logar mas continuar
                console.warn('Erro ao recarregar keys no manager:', reloadError);
            }
            
            setIsConfigured(true);
            setShowConfigModal(false);
            handleSuccess('Chave API do Gemini configurada com sucesso!');
        } catch (error) {
            handleError(error instanceof Error ? error : new Error('Erro ao salvar configuração'), 'Configuração do Gemini');
        } finally {
            setIsTesting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            deleteGeminiConfig();
            setApiKey('');
            setIsConfigured(false);
            
            // Recarregar keys no manager
            try {
                const { geminiApiKeyManager } = await import('../../services/ai/geminiApiKeyManager');
                geminiApiKeyManager.reloadKeys();
            } catch (reloadError) {
                // Se houver erro ao recarregar, apenas logar mas continuar
                console.warn('Erro ao recarregar keys no manager:', reloadError);
            }
            
            handleSuccess('Chave API do Gemini removida');
        } catch (error) {
            handleError(error instanceof Error ? error : new Error('Erro ao remover configuração'), 'Configuração do Gemini');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header da seção */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="shrink-0 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Key className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-base-content mb-2">Chave API do Gemini</h3>
                        <p className="text-base-content/70 text-sm leading-relaxed">
                            Configure sua chave API do Google Gemini para usar funcionalidades de IA
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
                <Card className="p-6">
                    <div className="space-y-4">
                        <p className="text-base-content/70 text-sm leading-relaxed">
                            Configure sua chave API do Google Gemini para habilitar funcionalidades de IA no aplicativo.
                        </p>
                        <ul className="list-disc list-inside text-base-content/70 text-sm space-y-2 ml-4">
                            <li>A chave API é armazenada localmente no seu navegador</li>
                            <li>Você pode obter uma chave em: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-light underline">Google AI Studio</a></li>
                            <li>A chave também pode ser configurada via variável de ambiente <code className="bg-base-300 px-1.5 py-0.5 rounded text-xs">VITE_GEMINI_API_KEY</code></li>
                        </ul>
                        <button
                            onClick={() => setShowConfigModal(true)}
                            className="btn btn-primary w-full mt-4"
                        >
                            <Key className="h-4 w-4 mr-2" />
                            Configurar Chave API
                        </button>
                    </div>
                </Card>
            ) : (
                <Card className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-base-content/70 text-sm">
                                Chave API configurada
                            </p>
                            <p className="text-base-content/70 text-xs font-mono break-all">
                                {apiKey && apiKey.length > 12 
                                    ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
                                    : '••••••••'}
                            </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={() => {
                                    const savedConfig = getGeminiConfig();
                                    if (savedConfig) {
                                        setApiKey(savedConfig.apiKey);
                                    }
                                    setShowConfigModal(true);
                                }}
                                className="btn btn-secondary text-sm"
                            >
                                Editar
                            </button>
                            <button
                                onClick={handleDisconnect}
                                className="btn btn-secondary text-sm hover:bg-red-500/20 hover:border-red-500/30"
                            >
                                Remover
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Modal de Configuração */}
            <Modal
                isOpen={showConfigModal}
                onClose={() => setShowConfigModal(false)}
                title="Configurar Chave API do Gemini"
                size="lg"
                maxHeight="90vh"
            >
                <div className="space-y-5 pb-2">
                    <div>
                        <label className="block text-sm font-medium text-base-content/70 mb-1">
                            Chave API do Gemini *
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Sua chave API do Gemini"
                            className="input input-bordered w-full bg-base-100 border-base-300 text-base-content focus:outline-none focus:border-primary"
                        />
                        <p className="text-xs text-base-content/70 mt-1">
                            <a
                                href="https://makersuite.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:text-accent-light underline"
                            >
                                Como obter uma chave API?
                            </a>
                        </p>
                        <p className="text-xs text-base-content/70 mt-2">
                            A chave será armazenada localmente no seu navegador e terá prioridade sobre variáveis de ambiente.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-base-300 mt-6">
                        <button
                            onClick={() => setShowConfigModal(false)}
                            className="btn btn-secondary"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveConfig}
                            disabled={isTesting || !apiKey.trim()}
                            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isTesting ? (
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

