import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  validateEmail,
  validatePhone,
  preventSQLInjection,
  validateFileType,
  ALLOWED_FILE_TYPES,
  DANGEROUS_FILE_TYPES,
} from '../validation';

describe('validation utilities', () => {
  describe('sanitizeInput', () => {
    it('removes dangerous HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      
      expect(result).toBe('scriptalert(xss)/script');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('removes quotes', () => {
      const input = 'Hello "world" and \'test\'';
      const result = sanitizeInput(input);
      
      expect(result).toBe('Hello world and test');
      expect(result).not.toContain('"');
      expect(result).not.toContain("'");
    });

    it('removes javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeInput(input);
      
      expect(result).toBe('alert(xss)');
      expect(result.toLowerCase()).not.toContain('javascript:');
    });

    it('removes event handlers', () => {
      const input = 'onclick=alert("xss") onload=malicious()';
      const result = sanitizeInput(input);
      
      expect(result).toBe('alert(xss) malicious()');
      expect(result.toLowerCase()).not.toContain('onclick=');
      expect(result.toLowerCase()).not.toContain('onload=');
    });

    it('trims whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizeInput(input);
      
      expect(result).toBe('hello world');
    });

    it('handles empty string', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    it('handles normal text without changes', () => {
      const input = 'This is normal text with numbers 123 and symbols @#$%';
      const result = sanitizeInput(input);
      
      expect(result).toBe(input.trim());
    });
  });

  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'a@b.co',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('rejects invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user@example',
        'user name@example.com',
        '',
        'user@example..com',
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('handles edge cases', () => {
      expect(validateEmail('a@b.c')).toBe(true); // Minimum valid email
      expect(validateEmail('user@sub.domain.com')).toBe(true); // Subdomain
      expect(validateEmail('user@domain-name.com')).toBe(true); // Hyphenated domain
    });
  });

  describe('validatePhone', () => {
    it('validates correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '+12345678901',
        '1234567890',
        '+44 20 7946 0958',
        '+1 (555) 123-4567',
        '+33 1 42 86 83 26',
      ];

      validPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(true);
      });
    });

    it('rejects invalid phone numbers', () => {
      const invalidPhones = [
        '123', // Too short
        '+0123456789', // Starts with 0 after country code
        'abc123456789', // Contains letters
        '', // Empty
        '+', // Just plus sign
        '++1234567890', // Double plus
        '+123456789012345678', // Too long
      ];

      invalidPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(false);
      });
    });

    it('handles formatting characters', () => {
      expect(validatePhone('+1 (555) 123-4567')).toBe(true);
      expect(validatePhone('+1-555-123-4567')).toBe(true);
      expect(validatePhone('+1 555 123 4567')).toBe(true);
      expect(validatePhone('(555) 123-4567')).toBe(true);
    });

    it('validates international formats', () => {
      expect(validatePhone('+44 20 7946 0958')).toBe(true); // UK
      expect(validatePhone('+33 1 42 86 83 26')).toBe(true); // France
      expect(validatePhone('+81 3 1234 5678')).toBe(true); // Japan
      expect(validatePhone('+86 138 0013 8000')).toBe(true); // China
    });
  });

  describe('preventSQLInjection', () => {
    it('removes SQL injection characters', () => {
      const input = "'; DROP TABLE users; --";
      const result = preventSQLInjection(input);
      
      expect(result).toBe(' DROP TABLE users --');
      expect(result).not.toContain("'");
      expect(result).not.toContain('"');
      expect(result).not.toContain(';');
    });

    it('removes backslashes', () => {
      const input = 'test\\nvalue\\r\\n';
      const result = preventSQLInjection(input);
      
      expect(result).toBe('testnvaluern');
      expect(result).not.toContain('\\');
    });

    it('handles normal text', () => {
      const input = 'This is normal text with spaces and numbers 123';
      const result = preventSQLInjection(input);
      
      expect(result).toBe(input);
    });

    it('handles empty string', () => {
      const result = preventSQLInjection('');
      expect(result).toBe('');
    });

    it('removes multiple dangerous characters', () => {
      const input = `'"; SELECT * FROM users WHERE id = '1'; --`;
      const result = preventSQLInjection(input);
      
      expect(result).toBe(' SELECT * FROM users WHERE id = 1 --');
    });
  });

  describe('validateFileType', () => {
    it('validates allowed file types', () => {
      expect(validateFileType('document.pdf', ALLOWED_FILE_TYPES)).toBe(true);
      expect(validateFileType('image.jpg', ALLOWED_FILE_TYPES)).toBe(true);
      expect(validateFileType('image.jpeg', ALLOWED_FILE_TYPES)).toBe(true);
      expect(validateFileType('image.png', ALLOWED_FILE_TYPES)).toBe(true);
      expect(validateFileType('document.doc', ALLOWED_FILE_TYPES)).toBe(true);
      expect(validateFileType('document.docx', ALLOWED_FILE_TYPES)).toBe(true);
    });

    it('rejects dangerous file types', () => {
      DANGEROUS_FILE_TYPES.forEach(ext => {
        const filename = `malicious${ext}`;
        expect(validateFileType(filename, ALLOWED_FILE_TYPES)).toBe(false);
      });
    });

    it('rejects unknown file types', () => {
      expect(validateFileType('file.xyz', ALLOWED_FILE_TYPES)).toBe(false);
      expect(validateFileType('file.unknown', ALLOWED_FILE_TYPES)).toBe(false);
      expect(validateFileType('file.txt', ALLOWED_FILE_TYPES)).toBe(false);
    });

    it('handles case insensitive extensions', () => {
      expect(validateFileType('document.PDF', ALLOWED_FILE_TYPES)).toBe(true);
      expect(validateFileType('image.JPG', ALLOWED_FILE_TYPES)).toBe(true);
      expect(validateFileType('image.JPEG', ALLOWED_FILE_TYPES)).toBe(true);
    });

    it('handles files without extensions', () => {
      expect(validateFileType('filename', ALLOWED_FILE_TYPES)).toBe(false);
      expect(validateFileType('', ALLOWED_FILE_TYPES)).toBe(false);
    });

    it('handles multiple dots in filename', () => {
      expect(validateFileType('my.document.pdf', ALLOWED_FILE_TYPES)).toBe(true);
      expect(validateFileType('file.backup.doc', ALLOWED_FILE_TYPES)).toBe(true);
      expect(validateFileType('image.final.jpg', ALLOWED_FILE_TYPES)).toBe(true);
    });

    it('works with custom allowed types', () => {
      const customTypes = ['.txt', '.csv', '.json'];
      
      expect(validateFileType('data.txt', customTypes)).toBe(true);
      expect(validateFileType('export.csv', customTypes)).toBe(true);
      expect(validateFileType('config.json', customTypes)).toBe(true);
      expect(validateFileType('image.jpg', customTypes)).toBe(false);
    });
  });

  describe('constants', () => {
    it('defines allowed file types', () => {
      expect(ALLOWED_FILE_TYPES).toContain('.pdf');
      expect(ALLOWED_FILE_TYPES).toContain('.jpg');
      expect(ALLOWED_FILE_TYPES).toContain('.jpeg');
      expect(ALLOWED_FILE_TYPES).toContain('.png');
      expect(ALLOWED_FILE_TYPES).toContain('.doc');
      expect(ALLOWED_FILE_TYPES).toContain('.docx');
    });

    it('defines dangerous file types', () => {
      expect(DANGEROUS_FILE_TYPES).toContain('.exe');
      expect(DANGEROUS_FILE_TYPES).toContain('.sh');
      expect(DANGEROUS_FILE_TYPES).toContain('.bat');
      expect(DANGEROUS_FILE_TYPES).toContain('.cmd');
      expect(DANGEROUS_FILE_TYPES).toContain('.com');
      expect(DANGEROUS_FILE_TYPES).toContain('.js');
    });

    it('ensures no overlap between allowed and dangerous types', () => {
      const overlap = ALLOWED_FILE_TYPES.filter(type => 
        DANGEROUS_FILE_TYPES.includes(type)
      );
      expect(overlap).toHaveLength(0);
    });
  });
});