import React from 'react';
import { isSupabaseAvailable } from '../../services/supabaseService';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';

export const SupabaseSettingsTab: React.FC = () => {
    const supabaseAvailable = isSupabaseAvailable();

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
                <div className="space-y-4">
                    {supabaseAvailable ? (
                        <>
                            <p className="text-text-secondary text-sm">
                                Supabase está configurado e funcionando. Seus projetos são sincronizados automaticamente na nuvem.
                            </p>
                            <div className="space-y-2 text-sm">
                                <p className="text-text-secondary">
                                    <strong className="text-text-primary">Status:</strong> Conectado
                                </p>
                                <p className="text-text-secondary">
                                    <strong className="text-text-primary">Sincronização:</strong> Automática
                                </p>
                                <p className="text-text-secondary">
                                    <strong className="text-text-primary">Autenticação:</strong> Anônima (compartilhada)
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-text-secondary text-sm">
                                Supabase não está configurado. Configure o proxy no Vercel para habilitar o armazenamento na nuvem.
                            </p>
                            <div className="space-y-2 text-sm text-text-secondary">
                                <p>
                                    <strong>Variáveis necessárias:</strong>
                                </p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li><code className="bg-black/30 px-1 rounded">SUPABASE_URL</code></li>
                                    <li><code className="bg-black/30 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code></li>
                                    <li><code className="bg-black/30 px-1 rounded">VITE_SUPABASE_PROXY_URL</code> (ex.: <code>/api/supabaseProxy</code>)</li>
                                </ul>
                                <p className="mt-4">
                                    Consulte a documentação em <code className="bg-black/30 px-1 rounded">docs/SUPABASE_SETUP.md</code> para mais informações.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

