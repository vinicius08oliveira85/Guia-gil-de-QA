import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TaskTestStatus, TaskTestStatusRecord, JiraTask } from '../types';
import { logger } from '../utils/logger';

const supabaseProxyUrl = (import.meta.env.VITE_SUPABASE_PROXY_URL || '').trim();

const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
    import.meta.env.SUPABASE_URL;

const supabaseAnonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.SUPABASE_ANON_KEY;

/**
 * Verifica se está em ambiente de produção (Vercel)
 */
const isProduction = (): boolean => {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    return hostname.includes('vercel.app') || hostname.includes('vercel.com');
};

let supabase: SupabaseClient | null = null;

const requestTimeoutMs = 5000; // Timeout de 5 segundos para requisições
const maxRetries = 3; // Máximo de 3 tentativas
const retryDelays = [1000, 2000, 4000]; // Backoff exponencial: 1s, 2s, 4s

// Inicializar cliente Supabase direto se variáveis estiverem disponíveis
if (supabaseUrl && supabaseAnonKey) {
    logger.info('Inicializando SDK Supabase direto para task test status', 'taskTestStatusService');
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    void supabase.auth.signInAnonymously().then(result => {
        if (result.error) {
            logger.warn('Erro ao autenticar anonimamente no Supabase', 'taskTestStatusService', result.error);
            return;
        }
        logger.info('Supabase configurado via SDK para task test status', 'taskTestStatusService');
    }).catch(error => {
        logger.warn('Erro ao configurar autenticação Supabase', 'taskTestStatusService', error);
    });
}

/**
 * Cria uma promise que rejeita após o timeout especificado
 */
const createTimeoutPromise = <T>(timeoutMs: number, errorMessage: string): Promise<T> => {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });
};

/**
 * Verifica se um erro é relacionado a problemas de rede (timeout, connection reset, DNS)
 */
const isNetworkError = (error: unknown): boolean => {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('timeout') ||
               message.includes('timed_out') ||
               message.includes('connection reset') ||
               message.includes('err_connection_reset') ||
               message.includes('err_timed_out') ||
               message.includes('err_name_not_resolved') ||
               message.includes('failed to fetch') ||
               message.includes('networkerror') ||
               message.includes('network request failed');
    }
    if (error instanceof TypeError) {
        return error.message.includes('Failed to fetch') || 
               error.message.includes('NetworkError');
    }
    return false;
};

/**
 * Chama o proxy do Supabase com timeout e tratamento de erros melhorado
 */
const callSupabaseProxy = async <T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    options?: {
        body?: unknown;
        query?: Record<string, string>;
        headers?: Record<string, string>;
    },
    timeoutMs: number = requestTimeoutMs
): Promise<T> => {
    if (!supabaseProxyUrl) {
        throw new Error('Supabase proxy não configurado');
    }

    let url = supabaseProxyUrl;
    if (options?.query) {
        const params = new URLSearchParams(options.query).toString();
        if (params) {
            url += (url.includes('?') ? '&' : '?') + params;
        }
    }

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    const headers = { ...defaultHeaders, ...options?.headers };

    const body = options?.body ? JSON.stringify(options.body) : undefined;

    const fetchPromise = fetch(url, {
        method,
        headers,
        body
    }).then(async (response) => {
        if (response.status === 0 || response.type === 'opaque') {
            throw new Error('CORS: Requisição bloqueada. Configure o proxy corretamente.');
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok || data?.success === false) {
            const message = data?.error || `Erro HTTP ${response.status}`;
            throw new Error(message);
        }
        return data as T;
    });

    // Race entre fetch e timeout
    return Promise.race([
        fetchPromise,
        createTimeoutPromise<T>(timeoutMs, `Timeout: requisição ao Supabase excedeu ${timeoutMs}ms`)
    ]);
};

/**
 * Salva status de teste via proxy (não implementado - usar SDK direto)
 * O proxy atual é específico para projects, então usamos apenas SDK direto
 */
const saveThroughProxy = async (taskKey: string, status: TaskTestStatus, retryCount: number = 0): Promise<void> => {
    // Proxy não suporta task_test_status ainda - usar SDK direto
    throw new Error('Proxy não suporta task_test_status. Use SDK direto.');
};

/**
 * Salva status de teste via SDK direto
 */
const saveThroughSdk = async (taskKey: string, status: TaskTestStatus, retryCount: number = 0): Promise<void> => {
    if (!supabase) {
        throw new Error('Cliente Supabase indisponível');
    }

    const savePromise = supabase
        .from('task_test_status')
        .upsert({
            task_key: taskKey,
            status: status,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'task_key'
        });
    
    const timeoutPromise = createTimeoutPromise<{ error: { message: string } | null }>(
        requestTimeoutMs,
        'Timeout: requisição ao Supabase excedeu 5s'
    );
    
    const result = await Promise.race([savePromise, timeoutPromise]);
    const { error } = result;

    if (error) {
        // Se for erro de rede e ainda temos tentativas, fazer retry com backoff
        if (isNetworkError(error) && retryCount < maxRetries) {
            const delay = retryDelays[retryCount] || 4000;
            if (retryCount === 0) {
                logger.debug(`Erro de rede ao salvar via SDK. Tentando novamente em ${delay}ms...`, 'taskTestStatusService');
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            return saveThroughSdk(taskKey, status, retryCount + 1);
        }
        throw new Error(error.message);
    }

    if (retryCount === 0) {
        logger.debug(`Status de teste "${status}" salvo via SDK para ${taskKey}`, 'taskTestStatusService');
    }
};

/**
 * Carrega status de teste via proxy (não implementado - usar SDK direto)
 * O proxy atual é específico para projects, então usamos apenas SDK direto
 */
const loadThroughProxy = async (taskKey: string): Promise<TaskTestStatus | null> => {
    // Proxy não suporta task_test_status ainda - usar SDK direto
    return null;
};

/**
 * Carrega múltiplos status de teste via proxy (não implementado - usar SDK direto)
 * O proxy atual é específico para projects, então usamos apenas SDK direto
 */
const loadMultipleThroughProxy = async (taskKeys: string[]): Promise<Map<string, TaskTestStatus>> => {
    // Proxy não suporta task_test_status ainda - usar SDK direto
    return new Map();
};

/**
 * Carrega status de teste via SDK direto
 */
const loadThroughSdk = async (taskKey: string): Promise<TaskTestStatus | null> => {
    if (!supabase) {
        return null;
    }

    try {
        const queryPromise = supabase
            .from('task_test_status')
            .select('status')
            .eq('task_key', taskKey)
            .single();
        
        const timeoutPromise = createTimeoutPromise<{ data: null; error: { message: string } }>(
            requestTimeoutMs,
            'Timeout: requisição ao Supabase excedeu 5s'
        );
        
        const result = await Promise.race([queryPromise, timeoutPromise]);
        const { data, error } = result;

        if (error) {
            // Se não encontrou registro, não é erro
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(error.message);
        }

        return (data as { status: TaskTestStatus } | null)?.status || null;
    } catch (error) {
        if (isNetworkError(error)) {
            logger.warn('Erro de rede ao carregar status via SDK', 'taskTestStatusService', error);
        } else {
            logger.warn('Erro ao carregar status via SDK', 'taskTestStatusService', error);
        }
        return null;
    }
};

/**
 * Carrega múltiplos status de teste via SDK direto
 */
const loadMultipleThroughSdk = async (taskKeys: string[]): Promise<Map<string, TaskTestStatus>> => {
    const result = new Map<string, TaskTestStatus>();
    
    if (!supabase || taskKeys.length === 0) {
        return result;
    }

    try {
        const queryPromise = supabase
            .from('task_test_status')
            .select('task_key, status')
            .in('task_key', taskKeys);
        
        const timeoutPromise = createTimeoutPromise<{ data: null; error: { message: string } }>(
            requestTimeoutMs,
            'Timeout: requisição ao Supabase excedeu 5s'
        );
        
        const queryResult = await Promise.race([queryPromise, timeoutPromise]);
        const { data, error } = queryResult;

        if (error) {
            throw new Error(error.message);
        }

        if (data) {
            (data as TaskTestStatusRecord[]).forEach(record => {
                result.set(record.task_key, record.status);
            });
        }
    } catch (error) {
        if (isNetworkError(error)) {
            logger.warn('Erro de rede ao carregar múltiplos status via SDK', 'taskTestStatusService', error);
        } else {
            logger.warn('Erro ao carregar múltiplos status via SDK', 'taskTestStatusService', error);
        }
    }
    
    return result;
};

/**
 * Calcula o status de teste baseado nos testCases da task
 * 
 * Regras:
 * 1. Se não há testCases → 'testar' (laranja)
 * 2. Se todos os testCases foram executados (nenhum 'Not Run') → 'teste_concluido' (verde) - independente de terem passado ou falhado
 * 3. Se há testCases mas pelo menos um ainda está 'Not Run':
 *    - Se algum teste falhou → 'pendente' (vermelho)
 *    - Se há testes sendo executados (alguns Passed mas não todos) → 'testando' (amarelo)
 *    - Se nenhum foi executado → 'testar' (laranja)
 */
export const calculateTaskTestStatus = (task: JiraTask): TaskTestStatus => {
    const testCases = task.testCases || [];
    
    // Se não há testCases, retornar 'testar'
    if (testCases.length === 0) {
        return 'testar';
    }
    
    // Verificar se todos os testes foram executados (nenhum 'Not Run')
    const allTestsExecuted = testCases.every(tc => tc.status !== 'Not Run');
    
    if (allTestsExecuted) {
        // Todos foram executados → 'teste_concluido' (independente de terem passado ou falhado)
        return 'teste_concluido';
    }
    
    // Ainda há testes pendentes ('Not Run')
    // Verificar se algum teste falhou
    const hasFailed = testCases.some(tc => tc.status === 'Failed');
    if (hasFailed) {
        return 'pendente';
    }
    
    // Verificar se há testes sendo executados (alguns Passed mas não todos)
    const hasPassed = testCases.some(tc => tc.status === 'Passed');
    if (hasPassed) {
        return 'testando';
    }
    
    // Se nenhum foi executado, retornar 'testar'
    return 'testar';
};

/**
 * Carrega o status de teste de uma task do Supabase
 */
export const loadTaskTestStatus = async (taskKey: string): Promise<TaskTestStatus | null> => {
    // Usar apenas SDK direto (proxy não suporta task_test_status)
    if (supabase) {
        try {
            return await loadThroughSdk(taskKey);
        } catch (error) {
            logger.warn('Erro ao carregar status via SDK', 'taskTestStatusService', error);
        }
    }

    return null;
};

/**
 * Carrega múltiplos status de teste do Supabase
 */
export const loadMultipleTaskTestStatus = async (taskKeys: string[]): Promise<Map<string, TaskTestStatus>> => {
    if (taskKeys.length === 0) {
        return new Map();
    }

    // Usar apenas SDK direto (proxy não suporta task_test_status)
    if (supabase) {
        try {
            return await loadMultipleThroughSdk(taskKeys);
        } catch (error) {
            logger.warn('Erro ao carregar múltiplos status via SDK', 'taskTestStatusService', error);
        }
    }

    return new Map();
};

/**
 * Salva o status de teste de uma task no Supabase
 */
export const saveTaskTestStatus = async (taskKey: string, status: TaskTestStatus): Promise<void> => {
    // Usar apenas SDK direto (proxy não suporta task_test_status)
    if (supabase) {
        try {
            await saveThroughSdk(taskKey, status);
            return;
        } catch (error) {
            if (isNetworkError(error)) {
                logger.warn('Erro de rede ao salvar status via SDK. Salvando apenas localmente.', 'taskTestStatusService', error);
            } else {
                logger.warn('Erro ao salvar status via SDK', 'taskTestStatusService', error);
            }
            throw error;
        }
    }

    // Se SDK não está disponível
    if (!supabase) {
        logger.debug('Supabase não configurado. Status salvo apenas localmente.', 'taskTestStatusService');
    }
};

/**
 * Verifica se Supabase está configurado e disponível
 */
export const isTaskTestStatusAvailable = (): boolean => {
    return Boolean(supabaseProxyUrl) || supabase !== null;
};

