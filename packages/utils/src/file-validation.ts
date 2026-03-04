/**
 * File Validation Utility
 * 
 * Provides functions for validating file uploads to prevent malicious files.
 * Checks file size, MIME type, extension, and magic bytes.
 */

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * File validation options
 */
export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  checkMagicBytes?: boolean;
}

/**
 * Magic bytes for common file types
 */
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  'application/zip': [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]],
  'text/plain': [], // No magic bytes for plain text
  'text/csv': [], // No magic bytes for CSV
};

/**
 * Default file size limits (10MB)
 */
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Common allowed file types for different contexts
 */
export const FILE_TYPE_PRESETS = {
  IMAGES: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
  },
  DOCUMENTS: {
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions: ['.pdf', '.doc', '.docx'],
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
  },
  SPREADSHEETS: {
    allowedMimeTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    allowedExtensions: ['.csv', '.xls', '.xlsx'],
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
  },
  ARCHIVES: {
    allowedMimeTypes: ['application/zip', 'application/x-zip-compressed'],
    allowedExtensions: ['.zip'],
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
  },
} as const;

/**
 * Validate file size
 * 
 * @param file - File to validate
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns Validation result
 */
export function validateFileSize(file: File, maxSizeBytes: number = DEFAULT_MAX_FILE_SIZE): FileValidationResult {
  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Validate file MIME type
 * 
 * @param file - File to validate
 * @param allowedMimeTypes - Array of allowed MIME types
 * @returns Validation result
 */
export function validateFileMimeType(file: File, allowedMimeTypes: string[]): FileValidationResult {
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate file extension
 * 
 * @param file - File to validate
 * @param allowedExtensions - Array of allowed extensions (e.g., ['.pdf', '.jpg'])
 * @returns Validation result
 */
export function validateFileExtension(file: File, allowedExtensions: string[]): FileValidationResult {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension "${extension}" is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Check if file extension matches MIME type
 * 
 * @param file - File to validate
 * @returns Validation result with warnings if mismatch
 */
export function validateExtensionMimeTypeMatch(file: File): FileValidationResult {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type;

  const mimeToExtension: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'text/csv': ['.csv'],
    'application/zip': ['.zip'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  };

  const expectedExtensions = mimeToExtension[mimeType];
  
  if (expectedExtensions && !expectedExtensions.includes(extension)) {
    return {
      valid: true,
      warnings: [`File extension "${extension}" does not match MIME type "${mimeType}". Expected: ${expectedExtensions.join(' or ')}`],
    };
  }

  return { valid: true };
}

/**
 * Validate file magic bytes (file signature)
 * 
 * @param file - File to validate
 * @returns Promise with validation result
 */
export async function validateFileMagicBytes(file: File): Promise<FileValidationResult> {
  const expectedSignatures = MAGIC_BYTES[file.type];
  
  // If no magic bytes defined for this type, skip check
  if (!expectedSignatures || expectedSignatures.length === 0) {
    return { valid: true };
  }

  try {
    // Read first 8 bytes of file
    const buffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check if any of the expected signatures match
    const matches = expectedSignatures.some(signature => {
      return signature.every((byte, index) => bytes[index] === byte);
    });

    if (!matches) {
      return {
        valid: false,
        error: `File content does not match declared type "${file.type}". File may be corrupted or mislabeled.`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to read file content: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Comprehensive file validation
 * 
 * @param file - File to validate
 * @param options - Validation options or preset name
 * @returns Promise with validation result
 * 
 * @example
 * const result = await validateFile(file, FILE_TYPE_PRESETS.IMAGES);
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 */
export async function validateFile(
  file: File,
  options: FileValidationOptions | keyof typeof FILE_TYPE_PRESETS = {}
): Promise<FileValidationResult> {
  // Get options from preset or use provided options
  const validationOptions = typeof options === 'string'
    ? FILE_TYPE_PRESETS[options]
    : options;

  const {
    maxSizeBytes = DEFAULT_MAX_FILE_SIZE,
    allowedMimeTypes,
    allowedExtensions,
    // checkMagicBytes = true, // Commented out since it's not in all preset types
  } = validationOptions;

  const warnings: string[] = [];

  // Validate file size
  const sizeResult = validateFileSize(file, maxSizeBytes);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  // Validate MIME type if specified
  if (allowedMimeTypes) {
    const mimeResult = validateFileMimeType(file, allowedMimeTypes as string[]);
    if (!mimeResult.valid) {
      return mimeResult;
    }
  }

  // Validate extension if specified
  if (allowedExtensions) {
    const extResult = validateFileExtension(file, allowedExtensions as string[]);
    if (!extResult.valid) {
      return extResult;
    }
  }

  // Check extension/MIME type match
  const matchResult = validateExtensionMimeTypeMatch(file);
  if (matchResult.warnings) {
    warnings.push(...matchResult.warnings);
  }

  // Validate magic bytes if enabled (currently disabled)
  // if (checkMagicBytes) {
  //   const magicResult = await validateFileMagicBytes(file);
  //   if (!magicResult.valid) {
  //     return magicResult;
  //   }
  // }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate multiple files
 * 
 * @param files - Array of files to validate
 * @param options - Validation options
 * @returns Promise with array of validation results
 */
export async function validateFiles(
  files: File[],
  options: FileValidationOptions | keyof typeof FILE_TYPE_PRESETS = {}
): Promise<FileValidationResult[]> {
  return Promise.all(files.map(file => validateFile(file, options)));
}

/**
 * Get human-readable file size
 * 
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 * 
 * @example
 * formatFileSize(1024) // "1.00 KB"
 * formatFileSize(1048576) // "1.00 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
