import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '../components/common/Card';

const meta: Meta<typeof Card> = {
  title: 'Common/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    design: {
      type: 'figma',
      url: process.env.STORYBOOK_FIGMA_URL || '',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <>
        <h2 className="heading-card">Título do Card</h2>
        <p className="text-text-secondary">
          Este é um exemplo de card padrão com conteúdo simples.
        </p>
      </>
    ),
  },
};

export const WithContent: Story = {
  args: {
    children: (
      <>
        <div className="flex items-center justify-between mb-4">
          <h3 className="heading-card">Card com Conteúdo</h3>
          <span className="badge-chip">Novo</span>
        </div>
        <p className="text-text-secondary mb-4">
          Este card contém mais conteúdo, incluindo um badge e múltiplos parágrafos.
        </p>
        <div className="flex gap-2">
          <button className="btn btn-flat">Ação 1</button>
          <button className="btn btn-flat">Ação 2</button>
        </div>
      </>
    ),
  },
};

export const Dense: Story = {
  args: {
    className: 'dense-card',
    children: (
      <>
        <h4 className="heading-card text-sm">Card Compacto</h4>
        <p className="text-text-secondary text-sm">
          Este é um card com estilo denso, ideal para listas e grids.
        </p>
      </>
    ),
  },
};
