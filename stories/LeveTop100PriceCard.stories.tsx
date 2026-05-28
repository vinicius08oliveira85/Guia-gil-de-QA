import type { Meta, StoryObj } from '@storybook/react';
import { LeveTop100PriceCard } from '../components/marketing/LeveTop100PriceCard';

const meta: Meta<typeof LeveTop100PriceCard> = {
  title: 'Marketing/LeveTop100PriceCard',
  component: LeveTop100PriceCard,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
  argTypes: {
    href: { control: 'text' },
    price: { control: 'text' },
    backgroundImageUrl: { control: 'text' },
    footnote: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof LeveTop100PriceCard>;

export const Default: Story = {
  args: {
    href: 'https://www.levesaude.com.br/planos/leve-top-100',
    price: 'R$ 150,81',
  },
  decorators: [
    Story => (
      <div className="app-neu-scope max-w-md font-sans">
        <Story />
      </div>
    ),
  ],
};

export const WithBackgroundImage: Story = {
  args: {
    ...Default.args,
    backgroundImageUrl:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
  },
  decorators: Default.decorators,
};
