import type { Meta, StoryObj } from '@storybook/react';
import { HelloWorld } from 'builder-plugins';

const meta = {
  title: 'Components/HelloWorld',
  component: HelloWorld,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'The name to greet',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning'],
      description: 'The visual style variant',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'The size of the component',
    },
  },
} satisfies Meta<typeof HelloWorld>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'World',
    variant: 'primary',
    size: 'medium',
  },
};

export const WithCustomName: Story = {
  args: {
    name: 'Storybook',
    variant: 'primary',
    size: 'medium',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 items-center">
        <HelloWorld name="Primary" variant="primary" />
        <HelloWorld name="Secondary" variant="secondary" />
        <HelloWorld name="Success" variant="success" />
        <HelloWorld name="Warning" variant="warning" />
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <HelloWorld name="Small" size="small" />
      <HelloWorld name="Medium" size="medium" />
      <HelloWorld name="Large" size="large" />
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    name: 'Interactive',
    variant: 'primary',
    size: 'medium',
  },
};