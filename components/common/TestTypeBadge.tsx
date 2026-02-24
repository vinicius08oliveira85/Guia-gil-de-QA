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
    TestTube,
    GitBranch,
    Gauge,
    FileCheck,
    Eye,
    Network,
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
    /** Quando true, exibe estilo de destaque (selecionado) */
    selected?: boolean;
    /** Tamanho do badge */
    size?: 'xs' | 'sm' | 'md' | 'lg';
    /** Classes CSS adicionais */
    className?: string;
    /** Label adicional (ex: contador) */
    label?: string;
    /** Estilo: solid (cores vivas, padrão para pills selecionáveis) ou pastel (cores suaves, para lista de testes executados) */
    variantStyle?: 'solid' | 'pastel';
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
    'Teste de Verificação de Correção': FileCheck,
};

/** Ícones por chave normalizada (sem acento) para nomes vindos sem acento */
const testTypeIconMapNormalized: Record<string, React.ComponentType<{ className?: string }>> = (() => {
    const out: Record<string, React.ComponentType<{ className?: string }>> = {};
    for (const [name, icon] of Object.entries(testTypeIconMap)) {
        out[normalizeForVariantLookup(name)] = icon;
    }
    return out;
})();

/** Remove sufixo entre parênteses (ex: "Teste Funcional (API)" -> "Teste Funcional") para lookup de variante e ícone */
function getBaseTestTypeName(testType: string): string {
    const withoutSuffix = testType.replace(/\s*\([^)]*\)\s*$/, '').trim();
    return withoutSuffix || testType;
}

/** Primeira letra maiúscula e as restantes minúsculas (ortografia) */
function capitalizeLabel(s: string): string {
    if (!s.length) return s;
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Normaliza para lookup sem acentos (ex: "Integração" e "Integracao" batem na mesma variante) */
function normalizeForVariantLookup(s: string): string {
    return s
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();
}

/** Variante pill por categoria (Referência completa / v0): error=vermelho, warning=laranja, info=azul, success=verde, default=cinza outline */
type TestTypeVariant = 'error' | 'warning' | 'info' | 'success' | 'default';
const testTypeVariantMap: Record<string, TestTypeVariant> = {
    'Teste de Segurança': 'error',
    'Teste de Autenticação': 'error',
    'Análise de Vulnerabilidades': 'error',
    'Teste de Penetração': 'error',
    'Teste de Performance': 'warning',
    'Teste de Desempenho': 'warning',
    'Teste de Performance Mobile': 'warning',
    'Teste de Carga': 'warning',
    'Teste de Stress': 'warning',
    'Teste de Capacidade': 'warning',
    'Teste Funcional': 'info',
    'Teste de Integração': 'info',
    'Teste de Regressão': 'info',
    'Teste de Regressão Automatizado': 'info',
    'Regressão': 'info',
    'Unitário': 'info',
    'Integração': 'info',
    'API': 'info',
    'Teste de Contrato': 'info',
    'Teste E2E': 'info',
    'Teste E2E Automatizado': 'info',
    'Sistema': 'info',
    'Smoke Test': 'info',
    'Sanity Test': 'info',
    'Teste de Validação': 'success',
    'Validação de User Stories': 'success',
    'Aceitação': 'success',
    'Definição de Critérios de Aceitação': 'success',
    'Teste de Usabilidade': 'success',
    'Usabilidade': 'success',
    'Teste de Acessibilidade': 'success',
    'Teste de Compatibilidade': 'default',
    'Teste de Compatibilidade de Navegadores': 'default',
    'Teste de Dispositivos': 'default',
    'Teste de Gestos': 'default',
    'Teste Exploratório': 'default',
    'Teste Caixa Branca': 'default',
    'Análise de Requisitos': 'default',
    'Análise de Casos de Uso': 'default',
    'Teste de Design': 'default',
    'Teste de Verificação de Correção': 'info',
};

/** Chaves normalizadas (sem acento) para lookup por categoria/variante mesmo com texto vindo sem acento */
const testTypeVariantMapNormalized: Record<string, TestTypeVariant> = (() => {
    const out: Record<string, TestTypeVariant> = {};
    for (const [name, variant] of Object.entries(testTypeVariantMap)) {
        out[normalizeForVariantLookup(name)] = variant;
    }
    return out;
})();

function getTestTypeVariant(testType: string): TestTypeVariant {
    const exact = testTypeVariantMap[testType];
    if (exact) return exact;
    const base = getBaseTestTypeName(testType);
    if (testTypeVariantMap[base]) return testTypeVariantMap[base];
    const normalized = normalizeForVariantLookup(base);
    return testTypeVariantMapNormalized[normalized] ?? 'default';
}

/** Cores pill sólido (topo – pills selecionáveis): fundo sólido + texto branco; default = outline cinza */
const pillVariantClassesSolid: Record<TestTypeVariant, string> = {
    error: 'bg-red-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-blue-600 text-white',
    success: 'bg-green-600 text-white',
    default: 'bg-gray-200 text-gray-800 border border-gray-300',
};

/** Sombra na cor do badge quando selecionado (substitui borda laranja) */
const pillSelectedShadowClasses: Record<TestTypeVariant, string> = {
    error: 'shadow-md shadow-red-600/50',
    warning: 'shadow-md shadow-amber-500/50',
    info: 'shadow-md shadow-blue-600/50',
    success: 'shadow-md shadow-green-600/50',
    default: 'shadow-md shadow-gray-400/50',
};
const pillIconClassesSolid: Record<TestTypeVariant, string> = {
    error: 'text-white',
    warning: 'text-white',
    info: 'text-white',
    success: 'text-white',
    default: 'text-gray-600',
};

/** Cores pill Soft/Pastel (lista de baixo – testes executados): fundo claro + texto escuro */
const pillVariantClassesPastel: Record<TestTypeVariant, string> = {
    error: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};
const pillIconClassesPastel: Record<TestTypeVariant, string> = {
    error: 'text-red-700 dark:text-red-300',
    warning: 'text-amber-700 dark:text-amber-300',
    info: 'text-blue-700 dark:text-blue-300',
    success: 'text-green-700 dark:text-green-300',
    default: 'text-gray-600 dark:text-gray-400',
};

/**
 * Componente Badge específico para tipos de teste
 * Estilo Referência completa (v0): pill por categoria, cores sólidas, ícone + texto uppercase bold
 *
 * @example
 * ```tsx
 * <TestTypeBadge testType="Teste Funcional" />
 * <TestTypeBadge testType="Teste de Usabilidade" size="sm" label="5/5" />
 * <TestTypeBadge testType="Teste de Regressão" selected />
 * ```
 */
export const TestTypeBadge = React.memo<TestTypeBadgeProps>(({
    testType,
    status,
    selected = false,
    size = 'md',
    className = '',
    label,
    variantStyle = 'solid',
}) => {
    const variant = getTestTypeVariant(testType);
    const baseName = getBaseTestTypeName(testType);
    const TestTypeIcon =
        testTypeIconMap[testType]
        || testTypeIconMap[baseName]
        || testTypeIconMapNormalized[normalizeForVariantLookup(baseName)]
        || Circle;
    const pillVariantClasses = variantStyle === 'pastel' ? pillVariantClassesPastel : pillVariantClassesSolid;
    const pillIconClasses = variantStyle === 'pastel' ? pillIconClassesPastel : pillIconClassesSolid;

    const sizeClasses = {
        xs: 'text-[10px] px-2 py-0.5',
        sm: 'text-xs px-2.5 py-1',
        md: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2',
    };
    const iconSizes = {
        xs: 'h-2.5 w-2.5',
        sm: 'h-3 w-3',
        md: 'h-3.5 w-3.5',
        lg: 'h-4 w-4',
    };

    const actualStatus = (() => {
        if (status) return status;
        if (label === 'Planejado' || label === '—') return 'planned' as const;
        const match = label?.match(/(\d+)\/(\d+)/);
        if (match) {
            const executed = parseInt(match[1], 10);
            const total = parseInt(match[2], 10);
            if (executed === 0) return 'pending';
            if (executed === total) return 'done';
            return 'partial';
        }
        return 'pending';
    })();

    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 rounded-full font-bold tracking-wider transition-all',
                'hover:scale-105 hover:shadow-sm whitespace-nowrap shrink-0',
                pillVariantClasses[variant],
                sizeClasses[size],
                selected && pillSelectedShadowClasses[variant],
                className
            )}
            aria-label={`Tipo de teste: ${testType}${selected ? ', Selecionado' : ''}${label ? `, ${label}` : ''}${!selected && actualStatus ? `, Status: ${actualStatus}` : ''}`}
            role="status"
        >
            <TestTypeIcon className={cn(iconSizes[size], pillIconClasses[variant])} aria-hidden="true" />
            <span className="truncate">{capitalizeLabel(testType)}</span>
            {label && (
                <span className={cn('ml-1 font-semibold shrink-0', pillIconClasses[variant])}>
                    {label}
                </span>
            )}
        </span>
    );
});

TestTypeBadge.displayName = 'TestTypeBadge';

