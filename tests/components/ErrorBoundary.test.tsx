import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';

// Componente que lança erro para testar ErrorBoundary
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Erro de teste');
  }
  return <div>Sem erro</div>;
};

describe('ErrorBoundary', () => {
  // Suprimir console.error durante os testes
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('deve renderizar children quando não há erro', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Sem erro')).toBeInTheDocument();
  });

  it('deve renderizar fallback quando há erro', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Ops! Algo deu errado/i)).toBeInTheDocument();
  });
});
