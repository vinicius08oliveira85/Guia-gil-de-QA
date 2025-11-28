import { Requirement, STLCPhaseName } from '../types';
import { getSTLCPhaseOrder, isSTLCPhaseAfter } from './stlcPhaseDetector';

export interface RequirementAccess {
    accessLevel: 'full' | 'limited' | 'restricted';
    message?: string;
    canEdit: boolean;
    canView: boolean;
    canDelete: boolean;
}

/**
 * Determina o nível de acesso a um requisito baseado na fase atual do STLC
 * 
 * @param requirement - Requisito a ser avaliado
 * @param currentPhase - Fase atual do STLC do projeto
 * @returns Informações de acesso ao requisito
 */
export function getRequirementAccess(
    requirement: Requirement,
    currentPhase: STLCPhaseName
): RequirementAccess {
    const requirementPhase = requirement.stlcPhase;
    const currentPhaseOrder = getSTLCPhaseOrder(currentPhase);
    const requirementPhaseOrder = getSTLCPhaseOrder(requirementPhase);

    // Se o requisito é de uma fase futura
    if (isSTLCPhaseAfter(requirementPhase, currentPhase)) {
        return {
            accessLevel: 'restricted',
            message: `Liberação: SOMENTE na Fase ${requirementPhase}`,
            canEdit: false,
            canView: true, // Pode ver mas com restrição
            canDelete: false,
        };
    }

    // Fase 1: Análise de Requisitos - Acesso COMPLETO a todos
    if (currentPhase === 'Análise de Requisitos') {
        return {
            accessLevel: 'full',
            canEdit: true,
            canView: true,
            canDelete: true,
        };
    }

    // Fase 2: Planejamento de Testes - Acesso COMPLETO a todos
    if (currentPhase === 'Planejamento de Testes') {
        return {
            accessLevel: 'full',
            canEdit: true,
            canView: true,
            canDelete: true,
        };
    }

    // Fase 3: Desenvolvimento de Casos de Teste
    // Acesso COMPLETO a requisitos funcionais e não funcionais relevantes
    if (currentPhase === 'Desenvolvimento de Casos de Teste') {
        // Se o requisito é da fase atual ou anterior, acesso completo
        if (requirementPhaseOrder <= currentPhaseOrder) {
            return {
                accessLevel: 'full',
                canEdit: true,
                canView: true,
                canDelete: false, // Não pode deletar em desenvolvimento
            };
        }
        // Caso contrário, restrito
        return {
            accessLevel: 'restricted',
            message: `Liberação: SOMENTE na Fase ${requirementPhase}`,
            canEdit: false,
            canView: true,
            canDelete: false,
        };
    }

    // Fase 4: Execução de Testes
    // Acesso COMPLETO mas foco em requisitos com casos de teste
    if (currentPhase === 'Execução de Testes') {
        // Se o requisito tem casos de teste associados, acesso completo
        if (requirement.testCases.length > 0) {
            return {
                accessLevel: 'full',
                canEdit: false, // Não pode editar durante execução
                canView: true,
                canDelete: false,
            };
        }
        // Se é da fase atual ou anterior, pode ver mas não editar
        if (requirementPhaseOrder <= currentPhaseOrder) {
            return {
                accessLevel: 'limited',
                canEdit: false,
                canView: true,
                canDelete: false,
            };
        }
        // Caso contrário, restrito
        return {
            accessLevel: 'restricted',
            message: `Liberação: SOMENTE na Fase ${requirementPhase}`,
            canEdit: false,
            canView: true,
            canDelete: false,
        };
    }

    // Fase 5: Encerramento do Teste
    // Acesso LIMITADO, apenas para consulta histórica e avaliação da cobertura (RTM)
    if (currentPhase === 'Encerramento do Teste') {
        return {
            accessLevel: 'limited',
            message: 'Fase de Encerramento: Acesso apenas para consulta histórica e avaliação de cobertura (RTM)',
            canEdit: false,
            canView: true,
            canDelete: false,
        };
    }

    // Fallback: acesso limitado
    return {
        accessLevel: 'limited',
        canEdit: false,
        canView: true,
        canDelete: false,
    };
}

/**
 * Filtra requisitos baseado na fase atual e regras de acesso
 * 
 * @param requirements - Lista de requisitos
 * @param currentPhase - Fase atual do STLC
 * @param showRestricted - Se deve mostrar requisitos restritos (fases futuras)
 * @returns Requisitos filtrados
 */
export function filterRequirementsByPhase(
    requirements: Requirement[],
    currentPhase: STLCPhaseName,
    showRestricted: boolean = true
): Requirement[] {
    return requirements.filter(req => {
        const access = getRequirementAccess(req, currentPhase);
        
        // Se não deve mostrar restritos, filtrar
        if (!showRestricted && access.accessLevel === 'restricted') {
            return false;
        }
        
        return access.canView;
    });
}

