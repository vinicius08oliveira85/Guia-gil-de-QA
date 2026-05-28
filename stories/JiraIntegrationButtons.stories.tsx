import type { Meta, StoryObj } from '@storybook/react';
import {
  jiraIntegrationImportBtnClass,
  jiraIntegrationSaveBtnClass,
  jiraIntegrationScopeClass,
} from '../components/jira/jiraIntegrationUi';

const meta: Meta = {
  title: 'Settings/JiraIntegrationButtons',
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component:
          'Botões primários da integração Jira em settings. Estado disabled usa regra neumórfica `.jira-integration-import-btn:disabled` / `.jira-integration-save-btn:disabled` (superfície afundada, sem opacity Tailwind).',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const PrimaryDisabledNeu: Story = {
  render: () => (
    <div className={`${jiraIntegrationScopeClass} max-w-sm space-y-4 p-4`}>
      <button type="button" className={jiraIntegrationImportBtnClass} disabled>
        Importar Projeto (desabilitado)
      </button>
      <button type="button" className={jiraIntegrationSaveBtnClass} disabled>
        Salvar e Testar (desabilitado)
      </button>
    </div>
  ),
};

export const PrimaryEnabled: Story = {
  render: () => (
    <div className={`${jiraIntegrationScopeClass} max-w-sm space-y-4 p-4`}>
      <button type="button" className={jiraIntegrationImportBtnClass}>
        Importar Projeto
      </button>
      <button type="button" className={jiraIntegrationSaveBtnClass}>
        Salvar e Testar
      </button>
    </div>
  ),
};
