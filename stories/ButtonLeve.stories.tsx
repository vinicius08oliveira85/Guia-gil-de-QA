import type { Meta, StoryObj } from '@storybook/react';
import { ButtonLeve } from '../components/common/ButtonLeve';

const meta: Meta<typeof ButtonLeve> = {
  title: 'Common/ButtonLeve',
  component: ButtonLeve,
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
      options: ['primary', 'secondary', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    fullWidth: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonLeve>;

export const Primary: Story = {
  args: {
    children: 'Botão Primário',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Botão Secundário',
    variant: 'secondary',
    size: 'md',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Botão Ghost',
    variant: 'ghost',
    size: 'md',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ButtonLeve size="sm">Pequeno</ButtonLeve>
      <ButtonLeve size="md">Médio</ButtonLeve>
      <ButtonLeve size="lg">Grande</ButtonLeve>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <ButtonLeve variant="primary">Primário</ButtonLeve>
      <ButtonLeve variant="secondary">Secundário</ButtonLeve>
      <ButtonLeve variant="ghost">Ghost</ButtonLeve>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <ButtonLeve variant="primary" disabled>
        Primário Desabilitado
      </ButtonLeve>
      <ButtonLeve variant="secondary" disabled>
        Secundário Desabilitado
      </ButtonLeve>
      <ButtonLeve variant="ghost" disabled>
        Ghost Desabilitado
      </ButtonLeve>
    </div>
  ),
};

export const FullWidth: Story = {
  args: {
    children: 'Botão de Largura Total',
    variant: 'primary',
    fullWidth: true,
  },
};
