import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../../components/common/Button';

describe('Button', () => {
  it('renderiza children', () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('usa type="button" por padrão', () => {
    render(<Button>Enviar</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('aceita type explícito', () => {
    render(<Button type="submit">Enviar</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('dispara onClick', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Ok</Button>);
    await user.click(screen.getByRole('button'));
    expect(clicked).toBe(true);
  });

  it('aplica variante via className', () => {
    render(<Button variant="destructive">Apagar</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-error');
  });

  it('aplica size via className', () => {
    render(<Button size="sm">Pequeno</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-sm');
  });

  it('mescla className externa', () => {
    render(<Button className="custom-class">Teste</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('disabled desabilita o botão', () => {
    render(<Button disabled>Bloqueado</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('isLoading desabilita e exibe spinner', () => {
    render(<Button isLoading>Salvar</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn.querySelector('.loading')).toBeInTheDocument();
  });

  it('isLoading preserva children como texto do loading', () => {
    render(<Button isLoading>Salvar</Button>);
    expect(screen.getByText('Salvar')).toBeInTheDocument();
  });

  it('isLoading substitui texto com loadingText customizado', () => {
    render(<Button isLoading loadingText="Processando...">Salvar</Button>);
    expect(screen.getByText('Processando...')).toBeInTheDocument();
    expect(screen.queryByText('Salvar')).not.toBeInTheDocument();
  });

  it('renderiza como link quando asChild com Slot', () => {
    render(
      <Button asChild>
        <a href="/teste">Link</a>
      </Button>
    );
    expect(screen.getByRole('link')).toHaveTextContent('Link');
  });

  describe('variantes', () => {
    const variants = [
      'default', 'destructive', 'success', 'warning', 'info',
      'outline', 'secondary', 'ghost', 'link',
    ] as const;
    for (const v of variants) {
      it(`renderiza variant="${v}" sem erro`, () => {
        render(<Button variant={v}>{v}</Button>);
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    }
  });

  describe('sizes', () => {
    const sizes = [
      'default', 'sm', 'xs', 'lg',
      'icon', 'iconSm', 'circle', 'circleLg',
      'panel', 'panelSm', 'panelXs',
    ] as const;
    for (const s of sizes) {
      it(`renderiza size="${s}" sem erro`, () => {
        render(<Button size={s}>{s}</Button>);
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    }
  });

  describe('acessibilidade', () => {
    it('aria-busy true quando isLoading', () => {
      render(<Button isLoading>Carregar</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('aria-busy ausente por padrão', () => {
      render(<Button>Ok</Button>);
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
    });

    it('passa aria-label adicionais', () => {
      render(<Button aria-label="Fechar modal">X</Button>);
      expect(screen.getByRole('button', { name: 'Fechar modal' })).toBeInTheDocument();
    });
  });

  describe('forwardRef', () => {
    it('encaminha ref para o elemento button', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});
