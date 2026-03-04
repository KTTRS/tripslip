import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeUserInput,
  sanitizeRichText,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeObject,
  SANITIZATION_PRESETS,
} from '../sanitization';

describe('sanitizeHtml', () => {
  it('should remove script tags', () => {
    const dirty = '<script>alert("xss")</script>Hello';
    expect(sanitizeHtml(dirty)).toBe('Hello');
  });

  it('should remove event handlers', () => {
    const dirty = '<div onclick="alert()">Click</div>';
    expect(sanitizeHtml(dirty)).not.toContain('onclick');
  });

  it('should remove javascript: URLs', () => {
    const dirty = '<a href="javascript:alert()">Click</a>';
    const clean = sanitizeHtml(dirty, 'RICH');
    expect(clean).not.toContain('javascript:');
  });

  it('should allow safe HTML with BASIC preset', () => {
    const dirty = '<b>Bold</b> and <i>italic</i>';
    const clean = sanitizeHtml(dirty, 'BASIC');
    expect(clean).toContain('<b>Bold</b>');
    expect(clean).toContain('<i>italic</i>');
  });

  it('should strip all HTML with STRICT preset', () => {
    const dirty = '<b>Bold</b> text';
    const clean = sanitizeHtml(dirty, 'STRICT');
    expect(clean).toBe('Bold text');
  });

  it('should allow rich HTML with RICH preset', () => {
    const dirty = '<h1>Title</h1><p>Paragraph</p><a href="https://example.com">Link</a>';
    const clean = sanitizeHtml(dirty, 'RICH');
    expect(clean).toContain('<h1>Title</h1>');
    expect(clean).toContain('<p>Paragraph</p>');
    expect(clean).toContain('<a');
  });

  it('should handle empty strings', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null as any)).toBe('');
    expect(sanitizeHtml(undefined as any)).toBe('');
  });

  it('should handle custom options', () => {
    const dirty = '<b>Bold</b> <script>alert()</script>';
    const clean = sanitizeHtml(dirty, {
      allowedTags: ['b'],
      allowedAttributes: [],
      allowDataAttributes: false,
    });
    expect(clean).toContain('<b>Bold</b>');
    expect(clean).not.toContain('script');
  });
});

describe('sanitizeText', () => {
  it('should strip all HTML', () => {
    expect(sanitizeText('<b>Hello</b> World')).toBe('Hello World');
    expect(sanitizeText('<script>alert()</script>')).toBe('');
    expect(sanitizeText('Plain text')).toBe('Plain text');
  });
});

describe('sanitizeUserInput', () => {
  it('should allow basic formatting', () => {
    const input = '<b>Bold</b> and <i>italic</i>';
    const clean = sanitizeUserInput(input);
    expect(clean).toContain('<b>Bold</b>');
    expect(clean).toContain('<i>italic</i>');
  });

  it('should remove dangerous HTML', () => {
    const input = '<b>Safe</b> <script>alert()</script>';
    const clean = sanitizeUserInput(input);
    expect(clean).toContain('<b>Safe</b>');
    expect(clean).not.toContain('script');
  });
});

describe('sanitizeRichText', () => {
  it('should allow rich formatting', () => {
    const content = '<h1>Title</h1><p>Content</p><ul><li>Item</li></ul>';
    const clean = sanitizeRichText(content);
    expect(clean).toContain('<h1>Title</h1>');
    expect(clean).toContain('<p>Content</p>');
    expect(clean).toContain('<ul>');
    expect(clean).toContain('<li>Item</li>');
  });

  it('should remove dangerous content', () => {
    const content = '<h1>Title</h1><script>alert()</script>';
    const clean = sanitizeRichText(content);
    expect(clean).toContain('<h1>Title</h1>');
    expect(clean).not.toContain('script');
  });
});

describe('sanitizeUrl', () => {
  it('should allow safe URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    expect(sanitizeUrl('tel:+1234567890')).toBe('tel:+1234567890');
    expect(sanitizeUrl('/relative/path')).toBe('/relative/path');
    expect(sanitizeUrl('//cdn.example.com/file.js')).toBe('//cdn.example.com/file.js');
  });

  it('should block dangerous protocols', () => {
    expect(sanitizeUrl('javascript:alert()')).toBe('');
    expect(sanitizeUrl('data:text/html,<script>alert()</script>')).toBe('');
    expect(sanitizeUrl('vbscript:alert()')).toBe('');
    expect(sanitizeUrl('file:///etc/passwd')).toBe('');
  });

  it('should handle empty and invalid URLs', () => {
    expect(sanitizeUrl('')).toBe('');
    expect(sanitizeUrl(null as any)).toBe('');
    expect(sanitizeUrl(undefined as any)).toBe('');
  });

  it('should handle case insensitivity', () => {
    expect(sanitizeUrl('JAVASCRIPT:alert()')).toBe('');
    expect(sanitizeUrl('JavaScript:alert()')).toBe('');
  });
});

describe('sanitizeFilename', () => {
  it('should allow safe filenames', () => {
    expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
    expect(sanitizeFilename('my-file_123.txt')).toBe('my-file_123.txt');
  });

  it('should remove path traversal attempts', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('windowssystem32');
  });

  it('should remove dangerous characters', () => {
    expect(sanitizeFilename('file<script>.txt')).toBe('filescript.txt');
    expect(sanitizeFilename('file|name.txt')).toBe('filename.txt');
    expect(sanitizeFilename('file:name.txt')).toBe('filename.txt');
  });

  it('should handle empty and invalid filenames', () => {
    expect(sanitizeFilename('')).toBe('file');
    expect(sanitizeFilename('...')).toBe('file');
    expect(sanitizeFilename(null as any)).toBe('');
  });

  it('should limit filename length', () => {
    const longName = 'a'.repeat(300) + '.txt';
    const sanitized = sanitizeFilename(longName);
    expect(sanitized.length).toBeLessThanOrEqual(255);
    expect(sanitized).toMatch(/\.txt$/);
  });
});

describe('sanitizeObject', () => {
  it('should sanitize string values', () => {
    const obj = {
      name: '<b>John</b>',
      bio: '<script>alert()</script>Safe text',
      age: 30,
    };
    const clean = sanitizeObject(obj);
    expect(clean.name).toBe('John');
    expect(clean.bio).toBe('Safe text');
    expect(clean.age).toBe(30);
  });

  it('should sanitize nested objects', () => {
    const obj = {
      user: {
        name: '<b>John</b>',
        profile: {
          bio: '<script>alert()</script>',
        },
      },
    };
    const clean = sanitizeObject(obj);
    expect(clean.user.name).toBe('John');
    expect(clean.user.profile.bio).toBe('');
  });

  it('should sanitize arrays', () => {
    const obj = {
      tags: ['<b>tag1</b>', '<script>alert()</script>', 'safe'],
    };
    const clean = sanitizeObject(obj);
    expect(clean.tags[0]).toBe('tag1');
    expect(clean.tags[1]).toBe('');
    expect(clean.tags[2]).toBe('safe');
  });

  it('should preserve non-string values', () => {
    const obj = {
      name: '<b>John</b>',
      age: 30,
      active: true,
      score: 95.5,
      data: null,
    };
    const clean = sanitizeObject(obj);
    expect(clean.name).toBe('John');
    expect(clean.age).toBe(30);
    expect(clean.active).toBe(true);
    expect(clean.score).toBe(95.5);
    expect(clean.data).toBeNull();
  });

  it('should respect sanitization options', () => {
    const obj = {
      content: '<b>Bold</b> <script>alert()</script>',
    };
    const clean = sanitizeObject(obj, 'BASIC');
    expect(clean.content).toContain('<b>Bold</b>');
    expect(clean.content).not.toContain('script');
  });
});
