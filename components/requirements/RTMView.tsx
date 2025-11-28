import React from 'react';
import { Project, Requirement, RTMEntry, TestCase } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { getRTMEntry, calculateRequirementCoverage } from '../../services/requirementService';

interface RTMViewProps {
    project: Project;
    requirements: Requirement[];
}

export const RTMView: React.FC<RTMViewProps> = ({ project, requirements }) => {
    // Obter todos os casos de teste do projeto
    const allTestCases = project.tasks.flatMap(task => task.testCases || []);

    // Criar mapa de casos de teste por ID
    const testCaseMap = new Map<string, TestCase>();
    allTestCases.forEach(tc => {
        testCaseMap.set(tc.id, tc);
    });

    // Calcular cobertura para cada requisito
    const requirementsWithCoverage = requirements.map(req => {
        const rtmEntry = getRTMEntry(project, req.id);
        const coverage = rtmEntry 
            ? rtmEntry.coverage 
            : calculateRequirementCoverage(req, allTestCases);
        
        return {
            requirement: req,
            coverage,
            testCaseCount: req.testCases.length,
            executedTestCases: req.testCases.filter(id => {
                const tc = testCaseMap.get(id);
                return tc && tc.status !== 'Not Run';
            }).length,
            passedTestCases: req.testCases.filter(id => {
                const tc = testCaseMap.get(id);
                return tc && tc.status === 'Passed';
            }).length,
        };
    });

    const totalCoverage = requirementsWithCoverage.length > 0
        ? Math.round(
            requirementsWithCoverage.reduce((sum, item) => sum + item.coverage, 0) / 
            requirementsWithCoverage.length
          )
        : 0;

    const getCoverageColor = (coverage: number): 'success' | 'warning' | 'error' => {
        if (coverage >= 80) return 'success';
        if (coverage >= 50) return 'warning';
        return 'error';
    };

    return (
        <Card>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary">
                            Requirements Traceability Matrix (RTM)
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                            Rastreabilidade entre requisitos e casos de teste
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-text-secondary">Cobertura Total</p>
                        <p className={`text-2xl font-bold ${
                            getCoverageColor(totalCoverage) === 'success' ? 'text-success' :
                            getCoverageColor(totalCoverage) === 'warning' ? 'text-warning-dark' :
                            'text-danger'
                        }`}>
                            {totalCoverage}%
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b-2 border-surface-border text-text-secondary">
                            <tr>
                                <th className="p-3 text-left">Requisito</th>
                                <th className="p-3 text-left">Título</th>
                                <th className="p-3 text-center">Casos de Teste</th>
                                <th className="p-3 text-center">Executados</th>
                                <th className="p-3 text-center">Aprovados</th>
                                <th className="p-3 text-center">Cobertura</th>
                                <th className="p-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {requirementsWithCoverage.map(({ requirement, coverage, testCaseCount, executedTestCases, passedTestCases }) => (
                                <tr key={requirement.id} className="hover:bg-surface-hover transition-colors">
                                    <td className="p-3 font-semibold text-text-primary">
                                        {requirement.id}
                                    </td>
                                    <td className="p-3 text-text-primary">
                                        <div className="max-w-md truncate" title={requirement.title}>
                                            {requirement.title}
                                        </div>
                                    </td>
                                    <td className="p-3 text-center text-text-secondary">
                                        {testCaseCount}
                                    </td>
                                    <td className="p-3 text-center text-text-secondary">
                                        {executedTestCases}
                                    </td>
                                    <td className="p-3 text-center text-text-secondary">
                                        {passedTestCases}
                                    </td>
                                    <td className="p-3 text-center">
                                        <Badge 
                                            variant={getCoverageColor(coverage)} 
                                            size="sm"
                                        >
                                            {coverage}%
                                        </Badge>
                                    </td>
                                    <td className="p-3 text-center">
                                        <Badge 
                                            variant={
                                                requirement.status === 'Validado' ? 'success' :
                                                requirement.status === 'Aprovado' ? 'info' :
                                                requirement.status === 'Em Teste' ? 'warning' :
                                                'default'
                                            }
                                            size="sm"
                                        >
                                            {requirement.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {requirementsWithCoverage.length === 0 && (
                    <div className="text-center py-8 text-text-secondary">
                        <p>Nenhum requisito encontrado para exibir no RTM.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

