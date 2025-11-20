/**
 * Example Storybook Story
 *
 * Demonstrates component development in isolation with Storybook.
 * Stories show all component states and variations.
 */
import type { Meta, StoryObj } from '@storybook/nextjs';

import { Button } from '@/components/Button';

/**
 * Button component for user interactions
 *
 * ## Features
 * - Multiple variants (default, destructive, outline, ghost)
 * - Size options (sm, md, lg)
 * - Loading state
 * - Disabled state
 * - Full width option
 */
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button interaction',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Default button style
 */
export const Default: Story = {
  args: {
    children: 'Book Equipment',
  },
};

/**
 * Primary action button with emphasis
 */
export const Primary: Story = {
  args: {
    variant: 'default',
    children: 'Confirm Booking',
  },
};

/**
 * Destructive action (delete, cancel)
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Cancel Booking',
  },
};

/**
 * Outline style for secondary actions
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'View Details',
  },
};

/**
 * Ghost button for subtle actions
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Edit',
  },
};

/**
 * Small size for compact layouts
 */
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

/**
 * Large size for emphasis
 */
export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Get Started',
  },
};

/**
 * Disabled state prevents interaction
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Unavailable',
  },
};

/**
 * Loading state with spinner
 */
export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <span className="mr-2">Processing...</span>
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      </>
    ),
  },
};

/**
 * Full width button
 */
export const FullWidth: Story = {
  args: {
    className: 'w-full',
    children: 'Continue',
  },
};

/**
 * With icon
 */
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Equipment
      </>
    ),
  },
};

/**
 * Button Group (Multiple buttons together)
 */
export const ButtonGroup: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </div>
  ),
};
