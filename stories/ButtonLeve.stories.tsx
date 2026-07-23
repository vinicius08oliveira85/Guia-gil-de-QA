import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/common/Button';

const meta: Meta<typeof Button> = {
  title: 'Common/Button',
  component: Button,
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
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'brand', 'brandOutline'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'panel', 'panelSm', 'panelXs'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Botão Primário',
    variant: 'brand',
    size: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Botão Secundário',
    variant: 'brandOutline',
    size: 'default',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Botão Ghost',
    variant: 'ghost',
    size: 'default',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Pequeno</Button>
      <Button size="default">Médio</Button>
      <Button size="lg">Grande</Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="brand">Primário</Button>
      <Button variant="brandOutline">Secundário</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="default">Default</Button>
      <Button variant="outline">Outline</Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="brand" disabled>
        Primário Desabilitado
      </Button>
      <Button variant="brandOutline" disabled>
        Secundário Desabilitado
      </Button>
      <Button variant="ghost" disabled>
        Ghost Desabilitado
      </Button>
    </div>
  ),
};
