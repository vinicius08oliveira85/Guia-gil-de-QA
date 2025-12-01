import React, { useState, useMemo } from 'react';
import { Card } from '../common/Card';
import { Project, ProjectFunctionality } from '../../types';
import { FunctionalityManager } from './FunctionalityManager';
import { ProgressIndicator } from '../common/ProgressIndicator';

interface CoverageCardProps {
  project: Project;
}

/**
 * Card de cobertura por funcionalidade
 */
export const CoverageCard: React.FC<CoverageCardProps> = React.memo(({ project }) => {
  const [showManager, setShowManager] = useState(false);

  const functionalities = project.functionalities || [];
  const allTestCases = project.tasks.flatMap(t => t.testCases || []);

  // Calcular cobertura por funcionalidade
  const coverageData = useMemo(() => {
    return functionalities.map(func => {
      // Associar testes via testSuite se especificado
      let relatedTests = allTestCases;
      if (func.testSuite) {
        relatedTests = allTestCases.filter(tc => tc.testSuite === func.testSuite);
      }

      const total = relatedTests.length;
      const passed = relatedTests.filter(tc => tc.status === 'Passed').length;
      const coverage = total > 0 ? Math.round((passed / total) * 100) : 0;

      return {
        ...func,
        total,
        passed,
        coverage,
        meetsTarget: func.targetCoverage !== undefined ? coverage >= func.targetCoverage : null,
      };
    });
  }, [functionalities, allTestCases]);

  return (
    <>
      <Card className="space-y-4" aria-label="Cobertura por funcionalidade">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Cobertura por Funcionalidade</h3>
          <button
            onClick={() => setShowManager(true)}
            className="text-sm text-accent hover:text-accent-light transition-colors"
            aria-label="Gerenciar funcionalidades"
          >
            ⚙️ Gerenciar
          </button>
        </div>

        {coverageData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary mb-4">
              Nenhuma funcionalidade cadastrada.
            </p>
            <button
              onClick={() => setShowManager(true)}
              className="btn btn-primary"
              aria-label="Adicionar primeira funcionalidade"
            >
              Adicionar Funcionalidade
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {coverageData.map((func) => (
              <div
                key={func.id}
                className="p-3 bg-surface-hover rounded-lg border border-surface-border"
                aria-label={`${func.name}: ${func.coverage}% de cobertura`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{func.name}</p>
                    {func.description && (
                      <p className="text-xs text-text-secondary mt-1">{func.description}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-text-primary">{func.coverage}%</p>
                    {func.targetCoverage !== undefined && (
                      <p className="text-xs text-text-secondary">
                        Meta: {func.targetCoverage}%
                        {func.meetsTarget !== null && (
                          <span className={func.meetsTarget ? 'text-emerald-600' : 'text-red-600'}>
                            {' '}
                            {func.meetsTarget ? '✓' : '✗'}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <ProgressIndicator
                  value={func.coverage}
                  max={100}
                  color={func.coverage >= 80 ? 'green' : func.coverage >= 60 ? 'orange' : 'red'}
                  showPercentage={false}
                />
                <div className="flex gap-4 mt-2 text-xs text-text-secondary">
                  <span>{func.passed} aprovados</span>
                  <span>{func.total} total</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showManager && (
        <FunctionalityManager
          project={project}
          onClose={() => setShowManager(false)}
        />
      )}
    </>
  );
});

CoverageCard.displayName = 'CoverageCard';

