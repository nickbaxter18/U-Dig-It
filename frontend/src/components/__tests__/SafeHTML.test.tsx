import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SafeHTML from '../SafeHTML';

describe('SafeHTML', () => {
  it('should render safe HTML content', () => {
    const { container } = render(<SafeHTML html="<p>Safe content</p>" />);
    expect(container.innerHTML).toContain('Safe content');
  });

  it('should strip script tags', () => {
    const { container } = render(<SafeHTML html='<p>Text</p><script>alert("xss")</script>' />);

    expect(container.innerHTML).toContain('Text');
    expect(container.innerHTML).not.toContain('<script>');
  });

  it('should strip event handlers', () => {
    const { container } = render(<SafeHTML html='<div onclick="alert(1)">Click</div>' />);

    expect(container.innerHTML).toContain('Click');
    expect(container.innerHTML).not.toContain('onclick');
  });

  it('should allow safe HTML tags', () => {
    const safeHTML = '<div><p>Paragraph</p><ul><li>List item</li></ul></div>';
    const { container } = render(<SafeHTML html={safeHTML} />);

    expect(container.querySelector('p')).toBeInTheDocument();
    expect(container.querySelector('ul')).toBeInTheDocument();
    expect(container.querySelector('li')).toBeInTheDocument();
  });

  it('should strip dangerous attributes', () => {
    const { container } = render(<SafeHTML html='<img src="x" onerror="alert(1)" />' />);

    const img = container.querySelector('img');
    expect(img).not.toHaveAttribute('onerror');
  });

  it('should allow style attribute if enabled', () => {
    const { container } = render(<SafeHTML html='<p style="color: red">Styled</p>' allowStyles={true} />);

    const p = container.querySelector('p');
    expect(p).toHaveAttribute('style');
  });
});

