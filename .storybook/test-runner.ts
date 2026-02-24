import { expect } from '@storybook/test';
import { checkA11y, injectAxe } from 'axe-playwright';

/**
 * Configuração do test runner do Storybook
 * Executa testes de acessibilidade e interação
 */

// Teste de acessibilidade
export const a11yTest = async ({ canvasElement }) => {
  await injectAxe(page);
  await checkA11y(page, canvasElement);
};

// Teste de snapshot visual (requer Chromatic)
export const visualTest = async ({ canvasElement }) => {
  await expect(canvasElement).toMatchSnapshot();
};
