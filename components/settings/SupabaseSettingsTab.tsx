import React, { useMemo } from 'react';
import { Database, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { diagnoseSupabaseConfig, isSupabaseAvailable } from '../../services/supabaseService';
import { StatusBadge } from './StatusBadge';
import { Card } from '../common/Card';
import { cn } from '../../utils/cn';

interface VariableStatus {
    name: string;
    configured: boolean;
    description: string;
    required: boolean;
}

export const SupabaseSettingsTab: React.FC = () => {
    const diagnosis = useMemo(() => diagnoseSupabaseConfig(), []);
    const supabaseAvailable = diagnosis.isAvailable;

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
                configured: true,
                description: 'Configurada no Vercel (backend). URL do projeto Supabase. Não verificável no navegador.',
                required: true
            },
            {
                name: 'SUPABASE_SERVICE_ROLE_KEY',
                configured: true,
                description: 'Configurada no Vercel (backend). Chave de serviço do Supabase. Não verificável no navegador.',
                required: true
            }
        ];
    }, []);

    return (
        <div className="space-y-6">
            {/* Header da seção */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="shrink-0 h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-base-content mb-2">Configurações do Supabase</h3>
                        <p className="text-base-content/70 text-sm leading-relaxed">
                            Gerencie as configurações de armazenamento na nuvem
                        </p>
                    </div>
                </div>
                {supabaseAvailable ? (
                    <StatusBadge variant="configured">Configurado</StatusBadge>
                ) : (
                    <StatusBadge variant="warning">Não Configurado</StatusBadge>
                )}
            </div>

            <Card className="p-6">
                <div className="space-y-6">
                    {supabaseAvailable ? (
                        <>
                            <div>
                                <p className="text-base-content/70 text-sm mb-4 leading-relaxed">
                                    {diagnosis.details}
                                </p>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <p className="text-base-content/70">
                                            <strong className="text-base-content">Status:</strong> Conectado
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                        <p className="text-base-content/70">
                                            <strong className="text-base-content">Modo:</strong>{' '}
                                            {diagnosis.hasProxy && diagnosis.hasSDK ? 'Proxy e SDK' : diagnosis.hasProxy ? 'Proxy' : 'SDK'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                        <p className="text-base-content/70">
                                            <strong className="text-base-content">Autenticação:</strong> Anônima (compartilhada)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <p className="text-base-content/70 text-sm mb-4 leading-relaxed">
                                    {diagnosis.details} No navegador apenas variáveis com prefixo <code className="bg-base-300 px-1 rounded text-xs">VITE_</code> são expostas; use <code className="bg-base-300 px-1 rounded text-xs">VITE_SUPABASE_PROXY_URL</code> ou <code className="bg-base-300 px-1 rounded text-xs">VITE_SUPABASE_URL</code> + <code className="bg-base-300 px-1 rounded text-xs">VITE_SUPABASE_ANON_KEY</code>.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-base-content mb-3">
                                        Variáveis do Frontend (Vercel)
                                    </h4>
                                    <div className="space-y-2">
                                        {variablesStatus.map((variable) => (
                                            <div
                                                key={variable.name}
                                                className={cn(
                                                    "flex items-start gap-3 p-3 rounded-lg border",
                                                    variable.configured
                                                        ? "bg-emerald-500/5 border-emerald-500/20"
                                                        : "bg-base-200/50 border-base-300"
                                                )}
                                            >
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {variable.configured ? (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                    ) : (
                                                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <code className="text-xs bg-base-300 px-2 py-0.5 rounded font-mono text-base-content">
                                                            {variable.name}
                                                        </code>
                                                        {variable.required && (
                                                            <StatusBadge variant="warning" className="text-xs">
                                                                Obrigatório
                                                            </StatusBadge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-base-content/70 leading-relaxed">
                                                        {variable.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-base-content mb-1">
                                        Variáveis do Backend (Vercel - Serverless Functions)
                                    </h4>
                                    <p className="text-xs text-base-content/60 mb-3">
                                        Configuradas no servidor. O status não é verificável no navegador.
                                    </p>
                                    <div className="space-y-2">
                                        {backendVariables.map((variable) => (
                                            <div
                                                key={variable.name}
                                                className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20"
                                            >
                                                <div className="flex-shrink-0 mt-0.5">
                                                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <code className="text-xs bg-base-300 px-2 py-0.5 rounded font-mono text-base-content">
                                                            {variable.name}
                                                        </code>
                                                        <StatusBadge variant="warning" className="text-xs">
                                                            Obrigatório
                                                        </StatusBadge>
                                                    </div>
                                                    <p className="text-xs text-base-content/70 leading-relaxed">
                                                        {variable.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                <div className="flex items-start gap-2">
                                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-base-content/70 leading-relaxed">
                                        <strong className="text-base-content">Documentação:</strong> Consulte{' '}
                                        <code className="bg-base-300 px-1.5 py-0.5 rounded font-mono text-xs">docs/SUPABASE_SETUP.md</code> para um guia passo a passo de configuração.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

