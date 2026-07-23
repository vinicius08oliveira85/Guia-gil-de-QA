import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Target } from 'lucide-react';
import { InsightMetricCard } from '../../../components/dashboard/insights/InsightMetricCard';
import { ExecutionStatusDonut } from '../../../components/dashboard/insights/ExecutionStatusDonut';
import { DefectTrendChart } from '../../../components/dashboard/insights/DefectTrendChart';
import { INSIGHT_COLORS, TONE_ACCENT } from '../../../components/dashboard/insights/insightTokens';

describe('InsightMetricCard — a11y e snapshot', () => {
  it('expõe heading e conteúdo acessível', () => {
    const { container } = render(
      <InsightMetricCard title="Cobertura de testes" subtitle="Escopo atual" icon={Target} tone="success">
        <p>42%</p>
      </InsightMetricCard>
    );
    expect(screen.getByRole('heading', { name: /Cobertura de testes/i })).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(container.querySelector('article')).toMatchSnapshot();
  });

  it('aplica accent semântico via CSS variable', () => {
    const { container } = render(
      <InsightMetricCard title="Falhas" tone="danger">
        <span>ok</span>
      </InsightMetricCard>
    );
    const article = container.querySelector('article') as HTMLElement;
    expect(article.style.getPropertyValue('--insight-card-accent')).toBe(TONE_ACCENT.danger);
  });
});

describe('ExecutionStatusDonut — a11y e snapshot', () => {
  it('expõe imagem acessível e lista de fatias', () => {
    const { container } = render(
      <ExecutionStatusDonut passed={10} failed={2} blocked={1} pending={5} />
    );
    expect(
      screen.getByRole('img', { name: /Distribuição da execução de testes/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Passou: 10 casos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Falhou: 2 casos/i })).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('estado vazio é anunciável em texto', () => {
    render(<ExecutionStatusDonut passed={0} failed={0} blocked={0} pending={0} />);
    expect(screen.getByText(/Sem casos de teste para exibir/i)).toBeInTheDocument();
  });

  it('atualiza rótulo central ao pairar na legenda', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ExecutionStatusDonut passed={10} failed={2} blocked={0} pending={0} />
    );
    await user.hover(screen.getByRole('button', { name: /Falhou: 2 casos/i }));
    const center = container.querySelector('.dashboard-neu-donut-well .absolute');
    expect(center).toHaveTextContent('2');
    expect(center).toHaveTextContent('Falhou');
  });
});

describe('DefectTrendChart — a11y e snapshot', () => {
  it('expõe gráfico com label e pontos com title nativo', () => {
    const { container } = render(<DefectTrendChart values={[1, 3, 2, 0, 4]} />);
    expect(
      screen.getByRole('img', { name: /Tendência de bugs criados por semana/i })
    ).toBeInTheDocument();
    expect(container.querySelector('svg')).toMatchSnapshot();
  });
});

describe('insightTokens', () => {
  it('mantém tokens semânticos distintos do brand', () => {
    expect(INSIGHT_COLORS.passed).not.toBe(INSIGHT_COLORS.failed);
    expect(INSIGHT_COLORS.critical).toBe(INSIGHT_COLORS.failed);
    expect(TONE_ACCENT.success).toBe(INSIGHT_COLORS.passed);
  });
});
