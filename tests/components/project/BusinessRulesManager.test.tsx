import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Project } from '../../../types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BusinessRulesManager } from '../../../components/project/BusinessRulesManager';
import { createMockProject } from '../../integration/mocks';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../../services/ai/businessRuleDossierService', () => ({
  generateBusinessRuleDossier: vi.fn(),
  refreshBusinessRuleDossier: vi.fn(),
}));

describe('BusinessRulesManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza lista de dossiês', () => {
    const project = createMockProject({
      businessRules: [
        {
          id: '1',
          title: 'RN-Mapa',
          createdAt: '2020-01-01T00:00:00.000Z',
          linkedTaskIds: ['T-1'],
          analysis: {
            version: 1,
            generatedAt: '2020-01-02T00:00:00.000Z',
            markdown: '# Dossiê\n\nConteúdo',
            executiveSummary: 'Resumo',
            asWas: 'Era',
            asIs: 'É',
            toBe: 'Será',
            components: [],
            functionalities: [],
            integrations: [],
            traceability: [],
          },
        },
      ],
    });

    render(<BusinessRulesManager project={project} onUpdateProject={() => {}} />);
    expect(screen.getByText('RN-Mapa')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
  });

  it('filtra regras por busca', async () => {
    const user = userEvent.setup();
    const project = createMockProject({
      businessRules: [
        {
          id: '1',
          title: 'RN-Atual',
          createdAt: '2020-01-01T00:00:00.000Z',
          linkedTaskIds: [],
        },
        {
          id: '2',
          title: 'RN-Mapa',
          createdAt: '2020-01-01T00:00:00.000Z',
          linkedTaskIds: [],
        },
      ],
    });

    render(<BusinessRulesManager project={project} onUpdateProject={() => {}} />);
    await user.type(screen.getByLabelText('Filtrar regras de negócio'), 'Mapa');
    expect(screen.getByText('RN-Mapa')).toBeInTheDocument();
    expect(screen.queryByText('RN-Atual')).not.toBeInTheDocument();
  });

  it('abre modal de nova regra', async () => {
    const user = userEvent.setup();
    const project = createMockProject({ businessRules: [] });
    render(<BusinessRulesManager project={project} onUpdateProject={() => {}} />);
    await user.click(screen.getAllByRole('button', { name: /Nova regra/i })[0]);
    expect(screen.getByLabelText(/Nome da regra/i)).toBeInTheDocument();
  });
});
