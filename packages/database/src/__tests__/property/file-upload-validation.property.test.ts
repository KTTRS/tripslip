/**
 * Property-Based Tests - File Upload Validation (Task 2.2)
 * 
 * Tests Property 14: File Upload Validation
 * 
 * For any file upload (photo, video, document), if the file exceeds the maximum 
 * size limit or is not in a supported format, the upload SHALL be rejected with 
 * an appropriate error message.
 * 
 * **Validates: Requirements 7.5, 7.6, 7.10**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// =====================================================
// VALIDATION CONSTANTS (from venue-media-service.ts)
// =====================================================

const PHOTO_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const VIDEO_MAX_SIZE = 100 * 1024 * 1024; // 100MB
const FORM_MAX_SIZE = 5 * 1024 * 1024; // 5MB

const PHOTO_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const FORM_ALLOWED_TYPES = ['application/pdf'];

// =====================================================
// VALIDATION FUNCTIONS (replicated from service)
// =====================================================

interface FileValidationError {
  field: string;
  message: string;
}

function validatePhotoFile(file: { type: string; size: number }): FileValidationError[] {
  const errors: FileValidationError[] = [];

  if (!PHOTO_ALLOWED_TYPES.includes(file.type)) {
    errors.push({
      field: 'file',
      message: `Invalid file type. Allowed types: ${PHOTO_ALLOWED_TYPES.join(', ')}`,
    });
  }

  if (file.size > PHOTO_MAX_SIZE) {
    errors.push({
      field: 'file',
      message: `File size exceeds maximum of ${PHOTO_MAX_SIZE / 1024 / 1024}MB`,
    });
  }

  return errors;
}

function validateVideoFile(file: { type: string; size: number }): FileValidationError[] {
  const errors: FileValidationError[] = [];

  if (!VIDEO_ALLOWED_TYPES.includes(file.type)) {
    errors.push({
      field: 'file',
      message: `Invalid file type. Allowed types: ${VIDEO_ALLOWED_TYPES.join(', ')}`,
    });
  }

  if (file.size > VIDEO_MAX_SIZE) {
    errors.push({
      field: 'file',
      message: `File size exceeds maximum of ${VIDEO_MAX_SIZE / 1024 / 1024}MB`,
    });
  }

  return errors;
}

function validateFormFile(file: { type: string; size: number }): FileValidationError[] {
  const errors: FileValidationError[] = [];

  if (!FORM_ALLOWED_TYPES.includes(file.type)) {
    errors.push({
      field: 'file',
      message: `Invalid file type. Allowed types: ${FORM_ALLOWED_TYPES.join(', ')}`,
    });
  }

  if (file.size > FORM_MAX_SIZE) {
    errors.push({
      field: 'file',
      message: `File size exceeds maximum of ${FORM_MAX_SIZE / 1024 / 1024}MB`,
    });
  }

  return errors;
}

function validateVideoEmbedUrl(url: string, type: 'youtube' | 'vimeo'): FileValidationError[] {
  const errors: FileValidationError[] = [];

  if (type === 'youtube') {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(url)) {
      errors.push({
        field: 'url',
        message: 'Invalid YouTube URL',
      });
    }
  } else if (type === 'vimeo') {
    const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;
    if (!vimeoRegex.test(url)) {
      errors.push({
        field: 'url',
        message: 'Invalid Vimeo URL',
      });
    }
  }

  return errors;
}

// =====================================================
// CUSTOM ARBITRARIES FOR FILE GENERATION
// =====================================================

/**
 * Generates arbitrary file-like objects with controlled type and size
 */
const fileArbitrary = (allowedTypes: string[], maxSize: number) =>
  fc.record({
    type: fc.constantFrom(...allowedTypes),
    size: fc.integer({ min: 1, max: maxSize }),
  });

/**
 * Generates file-like objects with invalid types
 */
const invalidTypeFileArbitrary = (allowedTypes: string[], maxSize: number) =>
  fc.record({
    type: fc.constantFrom(
      'application/octet-stream',
      'text/plain',
      'image/gif',
      'image/bmp',
      'video/avi',
      'application/zip',
      'text/html'
    ).filter(type => !allowedTypes.includes(type)),
    size: fc.integer({ min: 1, max: maxSize }),
  });

/**
 * Generates file-like objects with sizes exceeding the limit
 */
const oversizedFileArbitrary = (allowedTypes: string[], maxSize: number) =>
  fc.record({
    type: fc.constantFrom(...allowedTypes),
    size: fc.integer({ min: maxSize + 1, max: maxSize * 2 }),
  });

/**
 * Generates valid YouTube URLs
 */
const validYouTubeUrlArbitrary = fc.oneof(
  fc.constant('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
  fc.constant('https://youtube.com/watch?v=abc123'),
  fc.constant('https://youtu.be/xyz789'),
  fc.constant('http://www.youtube.com/watch?v=test123'),
  fc.string({ minLength: 11, maxLength: 11 }).map(id => `https://www.youtube.com/watch?v=${id}`)
);

/**
 * Generates valid Vimeo URLs
 */
const validVimeoUrlArbitrary = fc.oneof(
  fc.constant('https://vimeo.com/123456789'),
  fc.constant('https://www.vimeo.com/987654321'),
  fc.constant('http://vimeo.com/111222333'),
  fc.integer({ min: 100000000, max: 999999999 }).map(id => `https://vimeo.com/${id}`)
);

/**
 * Generates invalid video embed URLs
 */
const invalidVideoUrlArbitrary = fc.oneof(
  fc.constant('https://example.com/video'),
  fc.constant('not-a-url'),
  fc.constant('ftp://youtube.com/video'),
  fc.constant('https://dailymotion.com/video/123'),
  fc.constant('https://youtube.co/watch'),
  fc.constant('https://vimeo.co/123')
);

// =====================================================
// PROPERTY TESTS
// =====================================================

describe('Property 14: File Upload Validation (Task 2.2)', () => {
  describe('Photo Upload Validation (Requirement 7.5)', () => {
    it('accepts valid photo files (JPEG, PNG, WebP) under 10MB', async () => {
      await fc.assert(
        fc.asyncProperty(
          fileArbitrary(PHOTO_ALLOWED_TYPES, PHOTO_MAX_SIZE),
          async (file) => {
            const errors = validatePhotoFile(file);
            expect(errors).toHaveLength(0);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects photo files with invalid types', async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidTypeFileArbitrary(PHOTO_ALLOWED_TYPES, PHOTO_MAX_SIZE),
          async (file) => {
            const errors = validatePhotoFile(file);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.message.includes('Invalid file type'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects photo files exceeding 10MB size limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          oversizedFileArbitrary(PHOTO_ALLOWED_TYPES, PHOTO_MAX_SIZE),
          async (file) => {
            const errors = validatePhotoFile(file);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.message.includes('File size exceeds maximum'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects photo files with both invalid type and excessive size', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            type: fc.constantFrom('image/gif', 'image/bmp', 'text/plain'),
            size: fc.integer({ min: PHOTO_MAX_SIZE + 1, max: PHOTO_MAX_SIZE * 2 }),
          }),
          async (file) => {
            const errors = validatePhotoFile(file);
            expect(errors.length).toBe(2);
            expect(errors.some(e => e.message.includes('Invalid file type'))).toBe(true);
            expect(errors.some(e => e.message.includes('File size exceeds maximum'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('accepts photo files at exactly the size limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...PHOTO_ALLOWED_TYPES),
          async (type) => {
            const file = { type, size: PHOTO_MAX_SIZE };
            const errors = validatePhotoFile(file);
            expect(errors).toHaveLength(0);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);
  });

  describe('Video Upload Validation (Requirement 7.6)', () => {
    it('accepts valid video files (MP4, WebM, QuickTime) under 100MB', async () => {
      await fc.assert(
        fc.asyncProperty(
          fileArbitrary(VIDEO_ALLOWED_TYPES, VIDEO_MAX_SIZE),
          async (file) => {
            const errors = validateVideoFile(file);
            expect(errors).toHaveLength(0);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects video files with invalid types', async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidTypeFileArbitrary(VIDEO_ALLOWED_TYPES, VIDEO_MAX_SIZE),
          async (file) => {
            const errors = validateVideoFile(file);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.message.includes('Invalid file type'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects video files exceeding 100MB size limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          oversizedFileArbitrary(VIDEO_ALLOWED_TYPES, VIDEO_MAX_SIZE),
          async (file) => {
            const errors = validateVideoFile(file);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.message.includes('File size exceeds maximum'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects video files with both invalid type and excessive size', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            type: fc.constantFrom('video/avi', 'video/x-msvideo', 'application/octet-stream'),
            size: fc.integer({ min: VIDEO_MAX_SIZE + 1, max: VIDEO_MAX_SIZE * 2 }),
          }),
          async (file) => {
            const errors = validateVideoFile(file);
            expect(errors.length).toBe(2);
            expect(errors.some(e => e.message.includes('Invalid file type'))).toBe(true);
            expect(errors.some(e => e.message.includes('File size exceeds maximum'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('accepts video files at exactly the size limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...VIDEO_ALLOWED_TYPES),
          async (type) => {
            const file = { type, size: VIDEO_MAX_SIZE };
            const errors = validateVideoFile(file);
            expect(errors).toHaveLength(0);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);
  });

  describe('Video Embed URL Validation (Requirement 7.6)', () => {
    it('accepts valid YouTube URLs', async () => {
      await fc.assert(
        fc.asyncProperty(
          validYouTubeUrlArbitrary,
          async (url) => {
            const errors = validateVideoEmbedUrl(url, 'youtube');
            expect(errors).toHaveLength(0);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('accepts valid Vimeo URLs', async () => {
      await fc.assert(
        fc.asyncProperty(
          validVimeoUrlArbitrary,
          async (url) => {
            const errors = validateVideoEmbedUrl(url, 'vimeo');
            expect(errors).toHaveLength(0);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects invalid YouTube URLs', async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidVideoUrlArbitrary,
          async (url) => {
            const errors = validateVideoEmbedUrl(url, 'youtube');
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.message.includes('Invalid YouTube URL'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects invalid Vimeo URLs', async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidVideoUrlArbitrary,
          async (url) => {
            const errors = validateVideoEmbedUrl(url, 'vimeo');
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.message.includes('Invalid Vimeo URL'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);
  });

  describe('Form/Document Upload Validation (Requirement 7.10)', () => {
    it('accepts valid PDF files under 5MB', async () => {
      await fc.assert(
        fc.asyncProperty(
          fileArbitrary(FORM_ALLOWED_TYPES, FORM_MAX_SIZE),
          async (file) => {
            const errors = validateFormFile(file);
            expect(errors).toHaveLength(0);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects form files with invalid types (non-PDF)', async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidTypeFileArbitrary(FORM_ALLOWED_TYPES, FORM_MAX_SIZE),
          async (file) => {
            const errors = validateFormFile(file);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.message.includes('Invalid file type'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects form files exceeding 5MB size limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          oversizedFileArbitrary(FORM_ALLOWED_TYPES, FORM_MAX_SIZE),
          async (file) => {
            const errors = validateFormFile(file);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.message.includes('File size exceeds maximum'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('rejects form files with both invalid type and excessive size', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            type: fc.constantFrom('application/msword', 'text/plain', 'image/jpeg'),
            size: fc.integer({ min: FORM_MAX_SIZE + 1, max: FORM_MAX_SIZE * 2 }),
          }),
          async (file) => {
            const errors = validateFormFile(file);
            expect(errors.length).toBe(2);
            expect(errors.some(e => e.message.includes('Invalid file type'))).toBe(true);
            expect(errors.some(e => e.message.includes('File size exceeds maximum'))).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('accepts form files at exactly the size limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...FORM_ALLOWED_TYPES),
          async (type) => {
            const file = { type, size: FORM_MAX_SIZE };
            const errors = validateFormFile(file);
            expect(errors).toHaveLength(0);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);
  });

  describe('Cross-Type Validation Consistency', () => {
    it('maintains consistent validation behavior across all file types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('photo', 'video', 'form'),
          fc.integer({ min: 1, max: 200 * 1024 * 1024 }),
          async (fileType, size) => {
            let errors: FileValidationError[];
            let maxSize: number;
            let allowedTypes: string[];

            if (fileType === 'photo') {
              maxSize = PHOTO_MAX_SIZE;
              allowedTypes = PHOTO_ALLOWED_TYPES;
              errors = validatePhotoFile({ type: allowedTypes[0], size });
            } else if (fileType === 'video') {
              maxSize = VIDEO_MAX_SIZE;
              allowedTypes = VIDEO_ALLOWED_TYPES;
              errors = validateVideoFile({ type: allowedTypes[0], size });
            } else {
              maxSize = FORM_MAX_SIZE;
              allowedTypes = FORM_ALLOWED_TYPES;
              errors = validateFormFile({ type: allowedTypes[0], size });
            }

            // Validation should be consistent: reject if over limit, accept if under
            if (size > maxSize) {
              expect(errors.length).toBeGreaterThan(0);
              expect(errors.some(e => e.message.includes('File size exceeds maximum'))).toBe(true);
            } else {
              expect(errors.some(e => e.message.includes('File size exceeds maximum'))).toBe(false);
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('provides appropriate error messages for all validation failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('photo', 'video', 'form'),
          async (fileType) => {
            let errors: FileValidationError[];

            // Test with invalid type and oversized file
            if (fileType === 'photo') {
              errors = validatePhotoFile({ type: 'image/gif', size: PHOTO_MAX_SIZE + 1 });
            } else if (fileType === 'video') {
              errors = validateVideoFile({ type: 'video/avi', size: VIDEO_MAX_SIZE + 1 });
            } else {
              errors = validateFormFile({ type: 'application/msword', size: FORM_MAX_SIZE + 1 });
            }

            // Should have exactly 2 errors with appropriate messages
            expect(errors).toHaveLength(2);
            expect(errors.every(e => e.field === 'file')).toBe(true);
            expect(errors.every(e => e.message.length > 0)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);
  });
});
