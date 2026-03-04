import { describe, it, expect } from 'vitest';
import {
  validateFileSize,
  validateFileMimeType,
  validateFileExtension,
  validateExtensionMimeTypeMatch,
  validateFile,
  formatFileSize,
  DEFAULT_MAX_FILE_SIZE,
  FILE_TYPE_PRESETS,
} from '../file-validation';

// Helper to create mock File objects
function createMockFile(name: string, size: number, type: string): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

describe('validateFileSize', () => {
  it('should accept files within size limit', () => {
    const file = createMockFile('test.pdf', 1024, 'application/pdf');
    const result = validateFileSize(file, 2048);
    expect(result.valid).toBe(true);
  });

  it('should reject files exceeding size limit', () => {
    const file = createMockFile('test.pdf', 2048, 'application/pdf');
    const result = validateFileSize(file, 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum');
  });

  it('should use default max size if not specified', () => {
    const file = createMockFile('test.pdf', DEFAULT_MAX_FILE_SIZE + 1, 'application/pdf');
    const result = validateFileSize(file);
    expect(result.valid).toBe(false);
  });
});

describe('validateFileMimeType', () => {
  it('should accept allowed MIME types', () => {
    const file = createMockFile('test.pdf', 1024, 'application/pdf');
    const result = validateFileMimeType(file, ['application/pdf']);
    expect(result.valid).toBe(true);
  });

  it('should reject disallowed MIME types', () => {
    const file = createMockFile('test.exe', 1024, 'application/x-msdownload');
    const result = validateFileMimeType(file, ['application/pdf']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not allowed');
  });
});

describe('validateFileExtension', () => {
  it('should accept allowed extensions', () => {
    const file = createMockFile('test.pdf', 1024, 'application/pdf');
    const result = validateFileExtension(file, ['.pdf']);
    expect(result.valid).toBe(true);
  });

  it('should reject disallowed extensions', () => {
    const file = createMockFile('test.exe', 1024, 'application/x-msdownload');
    const result = validateFileExtension(file, ['.pdf']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('should be case insensitive', () => {
    const file = createMockFile('test.PDF', 1024, 'application/pdf');
    const result = validateFileExtension(file, ['.pdf']);
    expect(result.valid).toBe(true);
  });
});

describe('validateExtensionMimeTypeMatch', () => {
  it('should pass for matching extension and MIME type', () => {
    const file = createMockFile('test.pdf', 1024, 'application/pdf');
    const result = validateExtensionMimeTypeMatch(file);
    expect(result.valid).toBe(true);
    expect(result.warnings).toBeUndefined();
  });

  it('should warn for mismatched extension and MIME type', () => {
    const file = createMockFile('test.pdf', 1024, 'image/jpeg');
    const result = validateExtensionMimeTypeMatch(file);
    expect(result.valid).toBe(true);
    expect(result.warnings).toBeDefined();
    expect(result.warnings![0]).toContain('does not match');
  });
});

describe('validateFile', () => {
  it('should validate file with custom options', async () => {
    const file = createMockFile('test.pdf', 1024, 'application/pdf');
    const result = await validateFile(file, {
      maxSizeBytes: 2048,
      allowedMimeTypes: ['application/pdf'],
      allowedExtensions: ['.pdf'],
      checkMagicBytes: false,
    });
    expect(result.valid).toBe(true);
  });

  it('should validate file with preset', async () => {
    const file = createMockFile('test.jpg', 1024, 'image/jpeg');
    const result = await validateFile(file, 'IMAGES');
    expect(result.valid).toBe(true);
  });

  it('should reject file exceeding size limit', async () => {
    const file = createMockFile('test.jpg', 10 * 1024 * 1024, 'image/jpeg');
    const result = await validateFile(file, 'IMAGES');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum');
  });

  it('should reject file with disallowed MIME type', async () => {
    const file = createMockFile('test.exe', 1024, 'application/x-msdownload');
    const result = await validateFile(file, 'IMAGES');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not allowed');
  });
});

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('should format with decimals', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(2621440)).toBe('2.5 MB');
  });
});

describe('FILE_TYPE_PRESETS', () => {
  it('should have IMAGES preset', () => {
    expect(FILE_TYPE_PRESETS.IMAGES).toBeDefined();
    expect(FILE_TYPE_PRESETS.IMAGES.allowedMimeTypes).toContain('image/jpeg');
    expect(FILE_TYPE_PRESETS.IMAGES.allowedExtensions).toContain('.jpg');
  });

  it('should have DOCUMENTS preset', () => {
    expect(FILE_TYPE_PRESETS.DOCUMENTS).toBeDefined();
    expect(FILE_TYPE_PRESETS.DOCUMENTS.allowedMimeTypes).toContain('application/pdf');
  });

  it('should have SPREADSHEETS preset', () => {
    expect(FILE_TYPE_PRESETS.SPREADSHEETS).toBeDefined();
    expect(FILE_TYPE_PRESETS.SPREADSHEETS.allowedMimeTypes).toContain('text/csv');
  });
});
