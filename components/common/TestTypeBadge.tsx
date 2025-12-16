import React from 'react';
import {
    Beaker,
    Layers,
    RotateCcw,
    Zap,
    CheckCircle2,
    Users,
    Shield,
    Globe,
    Circle,
    Clock,
    XCircle,
    TestTube,
    GitBranch,
    Gauge,
    FileCheck,
    Eye,
    Lock,
    Network,
    RefreshCw
} from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Props do componente TestTypeBadge
 */
interface TestTypeBadgeProps {
    /** Tipo de teste a exibir */
    testType: string;
    /** Status opcional do teste (para indicar progresso) */
    status?: 'pending' | 'partial' | 'done' | 'failed' | 'planned';
    /** Tamanho do badge */
    size?: 'sm' | 'md' | 'lg';
    /** Classes CSS adicionais */
    className?: string;
    /** Label adicional (ex: contador) */
    label?: string;
}

/**
 * Mapeamento de tipos de teste para ícones do lucide-react
 */
const testTypeIconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
    'Teste Funcional': TestTube,
    'Teste de Integração': Layers,
    'Teste de Regressão': RotateCcw,
    'Teste de Regressão Automatizado': RotateCcw,
    'Regressão': RotateCcw,
    'Teste de Performance': Zap,
    'Teste de Desempenho': Zap,
    'Teste de Performance Mobile': Zap,
    'Teste de Validação': FileCheck,
    'Validação de User Stories': FileCheck,
    'Teste de Usabilidade': Users,
    'Usabilidade': Users,
    'Teste de Segurança': Shield,
    'Teste de Autenticação': Shield,
    'Análise de Vulnerabilidades': Shield,
    'Teste de Penetração': Shield,
    'Teste E2E': Globe,
    'Teste E2E Automatizado': Globe,
    'Teste de Carga': Gauge,
    'Teste de Stress': Gauge,
    'Teste de Capacidade': Gauge,
    'Unitário': Beaker,
    'Integração': Layers,
    'API': Network,
    'Teste de Acessibilidade': Eye,
    'Teste de Compatibilidade': GitBranch,
    'Teste de Compatibilidade de Navegadores': GitBranch,
    'Teste de Contrato': FileCheck,
    'Aceitação': CheckCircle2,
    'Definição de Critérios de Aceitação': CheckCircle2,
    'Sistema': Layers,
    'Smoke Test': Circle,
    'Sanity Test': Circle,
    'Teste Exploratório': Circle,
    'Teste Caixa Branca': Circle,
    'Teste de Dispositivos': Circle,
    'Teste de Gestos': Circle,
    'Análise de Requisitos': Circle,
    'Análise de Casos de Uso': Circle,
    'Teste de Design': Circle,
};

/**
 * Configuração de cores e ícones por status
 */
const statusConfig = {
    pending: {
        bg: 'bg-slate-100 dark:bg-slate-900',
        text: 'text-slate-700 dark:text-slate-300',
        icon: 'text-slate-500 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-800',
        iconComponent: Circle,
    },
    partial: {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        text: 'text-amber-900 dark:text-amber-200',
        icon: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        iconComponent: Clock,
    },
    done: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        text: 'text-emerald-900 dark:text-emerald-200',
        icon: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        iconComponent: CheckCircle2,
    },
    failed: {
        bg: 'bg-red-50 dark:bg-red-950/30',
        text: 'text-red-900 dark:text-red-200',
        icon: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        iconComponent: XCircle,
    },
    planned: {
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        text: 'text-blue-900 dark:text-blue-200',
        icon: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        iconComponent: Circle,
    },
};

/**
 * Componente Badge específico para tipos de teste
 * Design moderno inspirado no v0 com ícones e cores baseadas em status
 * 
 * @example
 * ```tsx
 * <TestTypeBadge testType="Teste Funcional" />
 * <TestTypeBadge testType="Teste de Usabilidade" status="done" size="sm" label="5/5" />
 * <TestTypeBadge testType="Teste de Performance" label="Planejado" />
 * ```
 */
export const TestTypeBadge = React.memo<TestTypeBadgeProps>(({
    testType,
    status,
    size = 'md',
    className = '',
    label
}) => {
    // Determinar status baseado no label se não fornecido
    let actualStatus: 'pending' | 'partial' | 'done' | 'failed' | 'planned' = status || 'pending';
    
    // Se label é "Planejado", usar status "planned"
    if (label === 'Planejado' || label === '—') {
        actualStatus = 'planned';
    } else if (!status && label) {
        // Tentar inferir status do label (ex: "0/6" = pending, "5/8" = partial, "6/6" = done)
        const match = label.match(/(\d+)\/(\d+)/);
        if (match) {
            const executed = parseInt(match[1], 10);
            const total = parseInt(match[2], 10);
            if (executed === 0) {
                actualStatus = 'pending';
            } else if (executed === total) {
                actualStatus = 'done';
            } else {
                actualStatus = 'partial';
            }
        }
    }
    
    // Obter ícone do tipo de teste
    const TestTypeIcon = testTypeIconMap[testType] || Circle;
    
    // Obter configuração do status
    const config = statusConfig[actualStatus];
    const StatusIcon = config.iconComponent;
    
    // Classes de tamanho
    const sizeClasses = {
        sm: 'text-xs px-2.5 py-1',
        md: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2',
    };
    
    const iconSizes = {
        sm: 'h-3 w-3',
        md: 'h-3.5 w-3.5',
        lg: 'h-4 w-4',
    };
    
    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 rounded-full border font-medium transition-all',
                'hover:scale-105 hover:shadow-sm',
                config.bg,
                config.text,
                config.border,
                sizeClasses[size],
                className
            )}
            aria-label={`Tipo de teste: ${testType}${actualStatus ? `, Status: ${actualStatus}` : ''}${label ? `, ${label}` : ''}`}
            role="status"
        >
            <TestTypeIcon className={cn(iconSizes[size], config.icon)} aria-hidden="true" />
            <span className="truncate">{testType}</span>
            {label && (
                <span className={cn('ml-1 font-semibold shrink-0', config.icon)}>
                    {label}
                </span>
            )}
        </span>
    );
});

TestTypeBadge.displayName = 'TestTypeBadge';

