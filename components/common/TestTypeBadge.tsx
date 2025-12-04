import React from 'react';

/**
 * Props do componente TestTypeBadge
 */
interface TestTypeBadgeProps {
    /** Tipo de teste a exibir */
    testType: string;
    /** Status opcional do teste (para indicar progresso) */
    status?: 'pending' | 'partial' | 'done' | 'failed';
    /** Tamanho do badge */
    size?: 'sm' | 'md' | 'lg';
    /** Classes CSS adicionais */
    className?: string;
    /** Label adicional (ex: contador) */
    label?: string;
}

/**
 * Mapeamento de tipos de teste para classes CSS específicas
 * Usa prefixo test-type- para isolamento visual
 */
const testTypeClassMap: { [key: string]: string } = {
    'Teste Funcional': 'test-type-functional',
    'Teste de Integração': 'test-type-integration',
    'Teste de Usabilidade': 'test-type-usability',
    'Teste de Desempenho': 'test-type-performance',
    'Teste de Performance': 'test-type-performance',
    'Teste de Segurança': 'test-type-security',
    'Teste de Regressão': 'test-type-regression',
    'Teste Caixa Branca': 'test-type-whitebox',
    'Teste de Compatibilidade': 'test-type-compatibility',
    'Teste de Compatibilidade de Navegadores': 'test-type-compatibility',
    'Teste de Acessibilidade': 'test-type-accessibility',
    'Teste de Validação': 'test-type-validation',
    'Teste de Contrato': 'test-type-contract',
    'Teste E2E': 'test-type-e2e',
    'Teste E2E Automatizado': 'test-type-e2e',
    'Teste de Regressão Automatizado': 'test-type-regression',
    'Teste de Autenticação': 'test-type-security',
    'Teste de Dispositivos': 'test-type-device',
    'Teste de Gestos': 'test-type-gesture',
    'Teste de Performance Mobile': 'test-type-performance',
    'Análise de Vulnerabilidades': 'test-type-security',
    'Teste de Penetração': 'test-type-security',
    'Smoke Test': 'test-type-smoke',
    'Sanity Test': 'test-type-sanity',
    'Teste Exploratório': 'test-type-exploratory',
    'Unitário': 'test-type-unit',
    'Integração': 'test-type-integration',
    'Sistema': 'test-type-system',
    'Aceitação': 'test-type-acceptance',
    'API': 'test-type-api',
    'Usabilidade': 'test-type-usability',
    'Regressão': 'test-type-regression',
    'Análise de Requisitos': 'test-type-analysis',
    'Validação de User Stories': 'test-type-validation',
    'Análise de Casos de Uso': 'test-type-analysis',
    'Definição de Critérios de Aceitação': 'test-type-acceptance',
    'Teste de Design': 'test-type-design',
    'Teste de Carga': 'test-type-load',
    'Teste de Stress': 'test-type-stress',
    'Teste de Capacidade': 'test-type-capacity',
};

/**
 * Classes de status para indicar progresso
 */
const statusClassMap: { [key: string]: string } = {
    'pending': 'test-type-status-pending',
    'partial': 'test-type-status-partial',
    'done': 'test-type-status-done',
    'failed': 'test-type-status-failed',
};

/**
 * Classes de tamanho
 */
const sizeClassMap: { [key: string]: string } = {
    'sm': 'test-type-size-sm',
    'md': 'test-type-size-md',
    'lg': 'test-type-size-lg',
};

/**
 * Componente Badge específico para tipos de teste
 * Usa classes CSS específicas com prefixo test-type- para isolamento visual
 * 
 * @example
 * ```tsx
 * <TestTypeBadge testType="Teste Funcional" />
 * <TestTypeBadge testType="Teste de Usabilidade" status="done" size="sm" />
 * ```
 */
export const TestTypeBadge = React.memo<TestTypeBadgeProps>(({
    testType,
    status,
    size = 'md',
    className = '',
    label
}) => {
    // Obter classe base do tipo de teste
    const testTypeClass = testTypeClassMap[testType] || 'test-type-default';
    
    // Classes de status (se fornecido)
    const statusClass = status ? statusClassMap[status] : '';
    
    // Classe de tamanho
    const sizeClass = sizeClassMap[size];
    
    // Montar classes finais
    const classes = [
        'test-type-badge',
        testTypeClass,
        statusClass,
        sizeClass,
        className
    ].filter(Boolean).join(' ');
    
    const displayText = label ? `${testType} • ${label}` : testType;
    
    return (
        <span
            className={classes}
            aria-label={`Tipo de teste: ${testType}${status ? `, Status: ${status}` : ''}`}
            role="status"
        >
            {displayText}
        </span>
    );
});

TestTypeBadge.displayName = 'TestTypeBadge';

