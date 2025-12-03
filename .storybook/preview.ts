import type { Preview } from '@storybook/react';
import React from 'react';
import '../index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#050917',
        },
        {
          name: 'light',
          value: '#f5f7fb',
        },
      ],
    },
    design: {
      type: 'figma',
      url: process.env.STORYBOOK_FIGMA_URL || '',
    },
  },
  decorators: [
    (Story) => React.createElement('div', { style: { padding: '2rem' } }, React.createElement(Story)),
  ],
};

export default preview;

