import React, { useMemo } from 'react';
import { isSupabaseAvailable } from '../../services/supabaseService';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';

interface VariableStatus {
    name: string;
    configured: boolean;
    description: string;
    required: boolean;
}

export const SupabaseSettingsTab: React.FC = () => {
    const supabaseAvailable = isSupabaseAvailable();

    const variablesStatus: VariableStatus[] = useMemo(() => {
        const supabaseProxyUrl = (import.meta.env.VITE_SUPABASE_PROXY_URL || '').trim();
        const supabaseUrl =
            import.meta.env.VITE_SUPABASE_URL ||
            import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
            import.meta.env.SUPABASE_URL;
        const supabaseAnonKey =
            import.meta.env.VITE_SUPABASE_ANON_KEY ||
            import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
            import.meta.env.SUPABASE_ANON_KEY;

        const isProduction = typeof window !== 'undefined' && 
            (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.com'));

        return [
            {
                name: 'VITE_SUPABASE_PROXY_URL',
                configured: Boolean(supabaseProxyUrl),
                description: isProduction 
                    ? 'Obrigatório em produção. Caminho relativo para o proxy (ex: /api/supabaseProxy)'
                    : 'Recomendado. URL do proxy para desenvolvimento (ex: http://localhost:3000/api/supabaseProxy)',
                required: isProduction
            },
            {
                name: 'VITE_PUBLIC_SUPABASE_URL',
                configured: Boolean(supabaseUrl),
                description: 'URL do projeto Supabase (pode ser exposta no frontend)',
                required: false
            },
            {
                name: 'VITE_SUPABASE_ANON_KEY',
                configured: Boolean(supabaseAnonKey),
                description: 'Opcional. Chave anônima para fallback em desenvolvimento local',
                required: false
            }
        ];
    }, []);

    const backendVariables: VariableStatus[] = useMemo(() => {
        return [
            {
                name: 'SUPABASE_URL',
                configured: true, // Não podemos verificar no frontend
                description: 'Configurada no Vercel (backend). URL do projeto Supabase',
                required: true
            },
            {
                name: 'SUPABASE_SERVICE_ROLE_KEY',
                configured: true, // Não podemos verificar no frontend
                description: 'Configurada no Vercel (backend). Chave de serviço do Supabase',
                required: true
            }
        ];
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">Configurações do Supabase</h3>
                    <p className="text-text-secondary text-sm">
                        Gerencie as configurações de armazenamento na nuvem
                    </p>
                </div>
                {supabaseAvailable ? (
                    <Badge variant="success">Configurado</Badge>
                ) : (
                    <Badge variant="warning">Não Configurado</Badge>
                )}
            </div>

            <Card>
                <div className="space-y-6">
                    {supabaseAvailable ? (
                        <>
                            <div>
                                <p className="text-text-secondary text-sm mb-4">
                                    Supabase está configurado e funcionando. Seus projetos podem ser salvos na nuvem.
                                </p>
                                <div className="space-y-2 text-sm">
                                    <p className="text-text-secondary">
                                        <strong className="text-text-primary">Status:</strong> Conectado
                                    </p>
                                    <p className="text-text-secondary">
                                        <strong className="text-text-primary">Modo:</strong> Via Proxy (recomendado)
                                    </p>
                                    <p className="text-text-secondary">
                                        <strong className="text-text-primary">Autenticação:</strong> Anônima (compartilhada)
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <p className="text-text-secondary text-sm mb-4">
                                    Supabase não está configurado. Configure as variáveis abaixo para habilitar o armazenamento na nuvem.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-text-primary mb-2">
                                        Variáveis do Frontend (Vercel)
                                    </h4>
                                    <div className="space-y-2">
                                        {variablesStatus.map((variable) => (
                                            <div
                                                key={variable.name}
                                                className="flex items-start gap-3 p-3 rounded-lg bg-surface-secondary/50"
                                            >
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {variable.configured ? (
                                                        <span className="text-green-500 text-sm">✓</span>
                                                    ) : (
                                                        <span className="text-yellow-500 text-sm">⚠</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <code className="text-xs bg-black/30 px-2 py-0.5 rounded text-text-primary">
                                                            {variable.name}
                                                        </code>
                                                        {variable.required && (
                                                            <Badge variant="warning" className="text-xs">
                                                                Obrigatório
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-text-secondary">
                                                        {variable.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-text-primary mb-2">
                                        Variáveis do Backend (Vercel - Serverless Functions)
                                    </h4>
                                    <div className="space-y-2">
                                        {backendVariables.map((variable) => (
                                            <div
                                                key={variable.name}
                                                className="flex items-start gap-3 p-3 rounded-lg bg-surface-secondary/50"
                                            >
                                                <div className="flex-shrink-0 mt-0.5">
                                                    <span className="text-blue-500 text-sm">ℹ</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <code className="text-xs bg-black/30 px-2 py-0.5 rounded text-text-primary">
                                                            {variable.name}
                                                        </code>
                                                        <Badge variant="warning" className="text-xs">
                                                            Obrigatório
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-text-secondary">
                                                        {variable.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                <p className="text-sm text-text-secondary">
                                    <strong className="text-text-primary">📚 Documentação:</strong> Consulte{' '}
                                    <code className="bg-black/30 px-1 rounded">docs/SUPABASE_SETUP.md</code> para um guia passo a passo de configuração.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

