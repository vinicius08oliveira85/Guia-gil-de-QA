import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from '../components/common/Modal';
import { ButtonLeve } from '../components/common/ButtonLeve';

const meta: Meta<typeof Modal> = {
  title: 'Common/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
    design: {
      type: 'figma',
      url: process.env.STORYBOOK_FIGMA_URL || '',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

const ModalWrapper = ({ size = 'md', children }: { size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Abrir Modal</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Título do Modal" size={size}>
        {children}
      </Modal>
    </>
  );
};

export const Default: Story = {
  render: () => (
    <ModalWrapper>
      <p className="text-text-secondary">
        Este é um modal padrão com conteúdo simples.
      </p>
    </ModalWrapper>
  ),
};

export const Small: Story = {
  render: () => (
    <ModalWrapper size="sm">
      <p className="text-text-secondary">
        Modal pequeno ideal para confirmações rápidas.
      </p>
    </ModalWrapper>
  ),
};

export const Medium: Story = {
  render: () => (
    <ModalWrapper size="md">
      <p className="text-text-secondary mb-4">
        Modal médio com conteúdo padrão.
      </p>
      <div className="flex gap-2">
        <ButtonLeve variant="primary">Confirmar</ButtonLeve>
        <ButtonLeve variant="secondary">Cancelar</ButtonLeve>
      </div>
    </ModalWrapper>
  ),
};

export const Large: Story = {
  render: () => (
    <ModalWrapper size="lg">
      <div className="space-y-4">
        <h3 className="heading-section">Modal Grande</h3>
        <p className="text-text-secondary">
          Este modal é ideal para conteúdo mais extenso, formulários ou visualizações detalhadas.
        </p>
        <div className="card-surface p-4">
          <p className="text-text-secondary">
            Conteúdo adicional em um card dentro do modal.
          </p>
        </div>
      </div>
    </ModalWrapper>
  ),
};

export const WithForm: Story = {
  render: () => (
    <ModalWrapper size="md">
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nome</label>
          <input
            type="text"
            className="input-field w-full"
            placeholder="Digite seu nome"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            className="input-field w-full"
            placeholder="Digite seu email"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <ButtonLeve variant="secondary">Cancelar</ButtonLeve>
          <ButtonLeve variant="primary">Salvar</ButtonLeve>
        </div>
      </form>
    </ModalWrapper>
  ),
};

