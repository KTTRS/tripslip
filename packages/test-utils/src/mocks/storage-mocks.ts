import { vi } from 'vitest';

/**
 * Mock storage services for testing
 * Provides comprehensive mocking for file storage operations
 */

// Mock file data
export const mockFiles = {
  pdf: {
    name: 'permission-slip.pdf',
    type: 'application/pdf',
    size: 1024 * 50, // 50KB
    lastModified: Date.now(),
  },
  image: {
    name: 'venue-photo.jpg',
    type: 'image/jpeg',
    size: 1024 * 200, // 200KB
    lastModified: Date.now(),
  },
  document: {
    name: 'trip-itinerary.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 1024 * 30, // 30KB
    lastModified: Date.now(),
  },
};

// Mock storage responses
export const mockStorageResponses = {
  upload: {
    success: (path: string = 'test-file.pdf') => ({
      data: {
        path,
        id: 'file-123',
        fullPath: `bucket/${path}`,
      },
      error: null,
    }),
    error: (message: string = 'Upload failed') => ({
      data: null,
      error: {
        message,
        statusCode: '400',
      },
    }),
  },
  
  download: {
    success: (data: Blob = new Blob(['test content'], { type: 'text/plain' })) => ({
      data,
      error: null,
    }),
    error: (message: string = 'File not found') => ({
      data: null,
      error: {
        message,
        statusCode: '404',
      },
    }),
  },
  
  list: {
    success: (files: any[] = []) => ({
      data: files,
      error: null,
    }),
    error: (message: string = 'Failed to list files') => ({
      data: null,
      error: {
        message,
        statusCode: '400',
      },
    }),
  },
  
  remove: {
    success: (files: any[] = []) => ({
      data: files,
      error: null,
    }),
    error: (message: string = 'Failed to delete file') => ({
      data: null,
      error: {
        message,
        statusCode: '400',
      },
    }),
  },
  
  signedUrl: {
    success: (url: string = 'https://storage.example.com/signed-url') => ({
      data: {
        signedUrl: url,
      },
      error: null,
    }),
    error: (message: string = 'Failed to create signed URL') => ({
      data: null,
      error: {
        message,
        statusCode: '400',
      },
    }),
  },
  
  publicUrl: {
    success: (url: string = 'https://storage.example.com/public-url') => ({
      data: {
        publicUrl: url,
      },
    }),
  },
};

// Mock Supabase Storage bucket
export const mockStorageBucket = {
  upload: vi.fn(),
  download: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  move: vi.fn(),
  copy: vi.fn(),
  remove: vi.fn(),
  createSignedUrl: vi.fn(),
  createSignedUrls: vi.fn(),
  getPublicUrl: vi.fn(),
};

// Mock Supabase Storage client
export const mockStorageClient = {
  from: vi.fn(() => mockStorageBucket),
  listBuckets: vi.fn(),
  getBucket: vi.fn(),
  createBucket: vi.fn(),
  updateBucket: vi.fn(),
  deleteBucket: vi.fn(),
  emptyBucket: vi.fn(),
};

// Helper to set up storage mocks
export const setupStorageMocks = () => {
  // Clear all mocks
  Object.values(mockStorageBucket).forEach(mock => {
    if (typeof mock === 'function') {
      mock.mockClear();
    }
  });
  
  // Set up default successful responses
  mockStorageBucket.upload.mockResolvedValue(
    mockStorageResponses.upload.success()
  );
  
  mockStorageBucket.download.mockResolvedValue(
    mockStorageResponses.download.success()
  );
  
  mockStorageBucket.list.mockResolvedValue(
    mockStorageResponses.list.success([
      {
        name: 'test-file.pdf',
        id: 'file-123',
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        metadata: {
          size: 1024,
          mimetype: 'application/pdf',
        },
      },
    ])
  );
  
  mockStorageBucket.remove.mockResolvedValue(
    mockStorageResponses.remove.success([{ name: 'test-file.pdf' }])
  );
  
  mockStorageBucket.createSignedUrl.mockResolvedValue(
    mockStorageResponses.signedUrl.success()
  );
  
  mockStorageBucket.getPublicUrl.mockReturnValue(
    mockStorageResponses.publicUrl.success()
  );
  
  return mockStorageBucket;
};

// Helper to simulate storage operations
export const simulateStorageOperations = {
  upload: {
    success: (path?: string) => {
      mockStorageBucket.upload.mockResolvedValueOnce(
        mockStorageResponses.upload.success(path)
      );
    },
    
    failure: (error?: string) => {
      mockStorageBucket.upload.mockResolvedValueOnce(
        mockStorageResponses.upload.error(error)
      );
    },
    
    fileTooLarge: () => {
      mockStorageBucket.upload.mockResolvedValueOnce(
        mockStorageResponses.upload.error('File too large')
      );
    },
    
    invalidFileType: () => {
      mockStorageBucket.upload.mockResolvedValueOnce(
        mockStorageResponses.upload.error('Invalid file type')
      );
    },
  },
  
  download: {
    success: (content?: string) => {
      const blob = new Blob([content || 'test content'], { type: 'text/plain' });
      mockStorageBucket.download.mockResolvedValueOnce(
        mockStorageResponses.download.success(blob)
      );
    },
    
    notFound: () => {
      mockStorageBucket.download.mockResolvedValueOnce(
        mockStorageResponses.download.error('File not found')
      );
    },
    
    accessDenied: () => {
      mockStorageBucket.download.mockResolvedValueOnce(
        mockStorageResponses.download.error('Access denied')
      );
    },
  },
  
  list: {
    success: (files?: any[]) => {
      mockStorageBucket.list.mockResolvedValueOnce(
        mockStorageResponses.list.success(files)
      );
    },
    
    empty: () => {
      mockStorageBucket.list.mockResolvedValueOnce(
        mockStorageResponses.list.success([])
      );
    },
    
    failure: (error?: string) => {
      mockStorageBucket.list.mockResolvedValueOnce(
        mockStorageResponses.list.error(error)
      );
    },
  },
  
  remove: {
    success: (files?: any[]) => {
      mockStorageBucket.remove.mockResolvedValueOnce(
        mockStorageResponses.remove.success(files)
      );
    },
    
    notFound: () => {
      mockStorageBucket.remove.mockResolvedValueOnce(
        mockStorageResponses.remove.error('File not found')
      );
    },
    
    accessDenied: () => {
      mockStorageBucket.remove.mockResolvedValueOnce(
        mockStorageResponses.remove.error('Access denied')
      );
    },
  },
  
  signedUrl: {
    success: (url?: string) => {
      mockStorageBucket.createSignedUrl.mockResolvedValueOnce(
        mockStorageResponses.signedUrl.success(url)
      );
    },
    
    failure: (error?: string) => {
      mockStorageBucket.createSignedUrl.mockResolvedValueOnce(
        mockStorageResponses.signedUrl.error(error)
      );
    },
    
    expired: () => {
      mockStorageBucket.createSignedUrl.mockResolvedValueOnce(
        mockStorageResponses.signedUrl.error('URL has expired')
      );
    },
  },
};

// Mock file generators
export const createMockFile = (
  name: string = 'test-file.pdf',
  type: string = 'application/pdf',
  size: number = 1024,
  content: string = 'test content'
): File => {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, {
    type,
    lastModified: Date.now(),
  });
  
  // Mock the size property
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  });
  
  return file;
};

// Mock FileList for input elements
export const createMockFileList = (files: File[]): FileList => {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    [Symbol.iterator]: function* () {
      for (const file of files) {
        yield file;
      }
    },
  };
  
  // Add files as indexed properties
  files.forEach((file, index) => {
    (fileList as any)[index] = file;
  });
  
  return fileList as FileList;
};

// Storage bucket configurations for testing
export const mockBucketConfigs = {
  'permission-slips': {
    public: false,
    allowedMimeTypes: ['application/pdf'],
    fileSizeLimit: 1024 * 1024 * 10, // 10MB
  },
  'venue-media': {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 1024 * 1024 * 5, // 5MB
  },
  'trip-documents': {
    public: false,
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    fileSizeLimit: 1024 * 1024 * 20, // 20MB
  },
};