import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestPyramidSummaryCard } from '../../components/trail/TestPyramidSummaryCard';
import { Project } from '../../types';

const createProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  name: 'Projeto Demo',
  description: 'Projeto focado em cobertura de testes',
  documents: [],
  tasks: [],
  phases: [],
  ...overrides
});

describe('TestPyramidSummaryCard', () => {
  it('renderiza dados detalhados quando a análise está disponível', () => {
    const project = createProject({
      testPyramidAnalysis: {
        distribution: [
          { level: 'Unitário', effort: '70%', examples: ['Cobrir regras críticas com testes parametrizados'] },
          { level: 'Integração', effort: '20%', examples: ['Validar sincronização entre módulos'] },
          { level: 'E2E', effort: '10%', examples: ['Simular jornada completa do usuário'] }
        ]
      }
    });

    render(<TestPyramidSummaryCard project={project} versionLabel="Release 1" />);

    expect(screen.getByText(/3 recomendações curadas pela IA/i)).toBeInTheDocument();
    expect(screen.getByText(/Cobertura ideal 70%/i)).toBeInTheDocument();
    expect(screen.getByText(/Cobertura ideal 20%/i)).toBeInTheDocument();
    expect(screen.getByText(/Cobertura ideal 10%/i)).toBeInTheDocument();
  });

  it('mostra estado vazio quando não há análise', () => {
    const project = createProject();

    render(<TestPyramidSummaryCard project={project} versionLabel="Release 1" />);

    expect(screen.getByText(/Sem dados de pirâmide ainda/i)).toBeInTheDocument();
  });
});
