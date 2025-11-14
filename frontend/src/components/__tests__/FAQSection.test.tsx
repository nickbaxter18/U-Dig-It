import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import FAQSection from '../FAQSection';

describe('FAQSection', () => {
  it('should render FAQ heading', () => {
    render(<FAQSection />);
    expect(screen.getByRole('heading', { name: /frequently asked questions|faq/i })).toBeInTheDocument();
  });

  it('should render FAQ items', () => {
    render(<FAQSection />);

    const questions = screen.getAllByRole('button', { name: /what|how|when/i });
    expect(questions.length).toBeGreaterThan(0);
  });

  it('should expand FAQ when clicking question', async () => {
    const user = userEvent.setup();
    render(<FAQSection />);

    const firstQuestion = screen.getAllByRole('button')[0];
    await user.click(firstQuestion);

    // Answer should be visible
    const answers = screen.getAllByText(/.{20,}/); // Find long text (answers)
    expect(answers.length).toBeGreaterThan(0);
  });

  it('should collapse FAQ when clicking again', async () => {
    const user = userEvent.setup();
    render(<FAQSection />);

    const firstQuestion = screen.getAllByRole('button')[0];

    // Expand
    await user.click(firstQuestion);
    const answersExpanded = screen.getAllByText(/.{20,}/);
    const initialCount = answersExpanded.length;

    // Collapse
    await user.click(firstQuestion);
    const answersCollapsed = screen.queryAllByText(/.{20,}/);
    expect(answersCollapsed.length).toBeLessThan(initialCount);
  });

  it('should have accessible accordion structure', () => {
    render(<FAQSection />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-expanded');
    });
  });
});
