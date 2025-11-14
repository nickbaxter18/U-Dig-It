import { describe, expect, it } from 'vitest';
import { escapeHTML, sanitizeHTML, stripTags } from '../html-sanitizer';

describe('HTML Sanitizer', () => {
  describe('sanitizeHTML', () => {
    it('should allow safe HTML tags', () => {
      const html = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeHTML(html);

      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    it('should remove script tags', () => {
      const html = '<p>Text</p><script>alert("xss")</script>';
      const result = sanitizeHTML(html);

      expect(result).toContain('Text');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should remove event handlers', () => {
      const html = '<div onclick="alert(1)">Click me</div>';
      const result = sanitizeHTML(html);

      expect(result).toContain('Click me');
      expect(result).not.toContain('onclick');
    });

    it('should remove javascript: URLs', () => {
      const html = '<a href="javascript:alert(1)">Link</a>';
      const result = sanitizeHTML(html);

      expect(result).toContain('Link');
      expect(result).not.toContain('javascript:');
    });

    it('should remove data: URLs', () => {
      const html = '<img src="data:text/html,<script>alert(1)</script>" />';
      const result = sanitizeHTML(html);

      expect(result).not.toContain('data:');
    });

    it('should allow safe attributes', () => {
      const html = '<a href="https://example.com" title="Example">Link</a>';
      const result = sanitizeHTML(html);

      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('title="Example"');
    });

    it('should remove dangerous attributes', () => {
      const html = '<img src="x" onerror="alert(1)" />';
      const result = sanitizeHTML(html);

      expect(result).not.toContain('onerror');
    });

    it('should handle nested tags', () => {
      const html = '<div><p><strong>Nested</strong> content</p></div>';
      const result = sanitizeHTML(html);

      expect(result).toContain('<div>');
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    it('should preserve text content', () => {
      const html = '<p>Important <em>text</em> here</p>';
      const result = sanitizeHTML(html);

      expect(result).toContain('Important');
      expect(result).toContain('text');
      expect(result).toContain('here');
    });

    it('should handle malformed HTML', () => {
      const html = '<p>Unclosed tag';
      const result = sanitizeHTML(html);

      expect(result).toContain('Unclosed tag');
    });

    it('should remove style tags', () => {
      const html = '<style>body { background: red; }</style><p>Text</p>';
      const result = sanitizeHTML(html);

      expect(result).not.toContain('<style>');
      expect(result).toContain('Text');
    });

    it('should allow safe style attributes when configured', () => {
      const html = '<p style="color: blue;">Styled text</p>';
      const result = sanitizeHTML(html, { allowStyles: true });

      expect(result).toContain('style');
    });

    it('should remove style attributes by default', () => {
      const html = '<p style="color: red;">Text</p>';
      const result = sanitizeHTML(html);

      expect(result).not.toContain('style');
    });
  });

  describe('stripTags', () => {
    it('should remove all HTML tags', () => {
      const html = '<p>Hello <strong>world</strong></p>';
      const result = stripTags(html);

      expect(result).toBe('Hello world');
    });

    it('should remove script tags and content', () => {
      const html = '<p>Before</p><script>alert("xss")</script><p>After</p>';
      const result = stripTags(html);

      expect(result).not.toContain('alert');
      expect(result).toContain('Before');
      expect(result).toContain('After');
    });

    it('should preserve text content', () => {
      const html = '<div><p>Paragraph 1</p><p>Paragraph 2</p></div>';
      const result = stripTags(html);

      expect(result).toContain('Paragraph 1');
      expect(result).toContain('Paragraph 2');
    });

    it('should handle self-closing tags', () => {
      const html = 'Before<br />After';
      const result = stripTags(html);

      expect(result).toBe('BeforeAfter');
    });

    it('should decode HTML entities', () => {
      const html = '<p>&lt;script&gt;alert&lt;/script&gt;</p>';
      const result = stripTags(html);

      expect(result).toContain('<script>');
    });
  });

  describe('escapeHTML', () => {
    it('should escape less-than signs', () => {
      const text = '<script>';
      const result = escapeHTML(text);

      expect(result).toBe('&lt;script&gt;');
    });

    it('should escape greater-than signs', () => {
      const text = 'a > b';
      const result = escapeHTML(text);

      expect(result).toContain('&gt;');
    });

    it('should escape ampersands', () => {
      const text = 'Tom & Jerry';
      const result = escapeHTML(text);

      expect(result).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      const text = 'He said "hello"';
      const result = escapeHTML(text);

      expect(result).toContain('&quot;');
    });

    it('should escape apostrophes', () => {
      const text = "It's a test";
      const result = escapeHTML(text);

      expect(result).toContain('&#x27;');
    });

    it('should handle multiple special characters', () => {
      const text = '<script>alert("xss")</script>';
      const result = escapeHTML(text);

      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should preserve safe text', () => {
      const text = 'Hello world 123';
      const result = escapeHTML(text);

      expect(result).toBe('Hello world 123');
    });
  });

  describe('XSS Prevention', () => {
    it('should prevent basic XSS', () => {
      const html = '<img src=x onerror=alert(1)>';
      const result = sanitizeHTML(html);

      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should prevent event handler XSS', () => {
      const html = '<div onload="alert(1)">Content</div>';
      const result = sanitizeHTML(html);

      expect(result).not.toContain('onload');
    });

    it('should prevent javascript: protocol XSS', () => {
      const html = '<a href="javascript:void(0)">Link</a>';
      const result = sanitizeHTML(html);

      expect(result).not.toContain('javascript:');
    });

    it('should prevent data: URL XSS', () => {
      const html = '<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==" />';
      const result = sanitizeHTML(html);

      expect(result).not.toContain('data:');
    });

    it('should prevent SVG XSS', () => {
      const html = '<svg onload="alert(1)"><circle /></svg>';
      const result = sanitizeHTML(html);

      expect(result).not.toContain('onload');
    });
  });
});


