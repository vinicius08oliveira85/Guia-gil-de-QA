import { useMemo } from 'react';
import { Project, Requirement, STLCPhaseName } from '../types';
import { filterRequirementsByPhase, getRequirementAccess } from '../utils/requirementAccessControl';
import { useSTLCPhase } from './useSTLCPhase';

/**
 * Hook para gerenciar requisitos do projeto com filtros e controle de acesso
 */
export function useRequirements(
    project: Project,
    options: {
        showRestricted?: boolean;
        filterByPhase?: STLCPhaseName | null;
        filterByType?: 'Funcional' | 'Não Funcional' | null;
        filterByStatus?: Requirement['status'] | null;
    } = {}
) {
    const { currentPhase } = useSTLCPhase(project);
    const {
        showRestricted = true,
        filterByPhase = null,
        filterByType = null,
        filterByStatus = null,
    } = options;

    const allRequirements = useMemo(() => {
        return project.requirements || [];
    }, [project.requirements]);

    const filteredRequirements = useMemo(() => {
        const phaseToUse = filterByPhase || currentPhase;
        let filtered = filterRequirementsByPhase(allRequirements, phaseToUse, showRestricted);

        // Filtro por tipo
        if (filterByType) {
            filtered = filtered.filter(req => req.type === filterByType);
        }

        // Filtro por status
        if (filterByStatus) {
            filtered = filtered.filter(req => req.status === filterByStatus);
        }

        return filtered;
    }, [allRequirements, currentPhase, filterByPhase, filterByType, filterByStatus, showRestricted]);

    const requirementsByPhase = useMemo(() => {
        const grouped: Record<STLCPhaseName, Requirement[]> = {
            'Análise de Requisitos': [],
            'Planejamento de Testes': [],
            'Desenvolvimento de Casos de Teste': [],
            'Execução de Testes': [],
            'Encerramento do Teste': [],
        };

        allRequirements.forEach(req => {
            grouped[req.stlcPhase].push(req);
        });

        return grouped;
    }, [allRequirements]);

    const getRequirementAccessInfo = (requirement: Requirement) => {
        return getRequirementAccess(requirement, currentPhase);
    };

    const statistics = useMemo(() => {
        const total = allRequirements.length;
        const functional = allRequirements.filter(r => r.type === 'Funcional').length;
        const nonFunctional = allRequirements.filter(r => r.type === 'Não Funcional').length;
        const approved = allRequirements.filter(r => r.status === 'Aprovado').length;
        const validated = allRequirements.filter(r => r.status === 'Validado').length;
        const withTestCases = allRequirements.filter(r => r.testCases.length > 0).length;
        const coverage = total > 0 ? Math.round((withTestCases / total) * 100) : 0;

        return {
            total,
            functional,
            nonFunctional,
            approved,
            validated,
            withTestCases,
            coverage,
        };
    }, [allRequirements]);

    return {
        allRequirements,
        filteredRequirements,
        requirementsByPhase,
        currentPhase,
        getRequirementAccessInfo,
        statistics,
    };
}

