import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../components/common/Badge';

const meta: Meta<typeof Badge> = {
  title: 'Common/Badge',
  component: Badge,
  parameters: {
    layout: 'padded',
    design: {
      type: 'figma',
      url: process.env.STORYBOOK_FIGMA_URL || '',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'info'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Badge',
    variant: 'default',
    size: 'md',
  },
};

export const Success: Story = {
  args: {
    children: 'Aprovado',
    variant: 'success',
    size: 'md',
  },
};

export const Warning: Story = {
  args: {
    children: 'Atenção',
    variant: 'warning',
    size: 'md',
  },
};

export const Error: Story = {
  args: {
    children: 'Erro',
    variant: 'error',
    size: 'md',
  },
};

export const Info: Story = {
  args: {
    children: 'Informação',
    variant: 'info',
    size: 'md',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Badge size="sm">Pequeno</Badge>
      <Badge size="md">Médio</Badge>
      <Badge size="lg">Grande</Badge>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Badge variant="default">Padrão</Badge>
      <Badge variant="success">Sucesso</Badge>
      <Badge variant="warning">Aviso</Badge>
      <Badge variant="error">Erro</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};
