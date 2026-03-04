/**
 * Unit tests for VenueMediaService
 * 
 * Tests file upload validation and service methods
 * Requirements: 7.5, 7.6, 7.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VenueMediaService } from '../venue-media-service';
import type { SupabaseClient } from '../client';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockClient = {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
        remove: vi.fn(),
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(),
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  } as unknown as SupabaseClient;

  return mockClient;
};

describe('VenueMediaService', () => {
  let service: VenueMediaService;
  let mockClient: SupabaseClient;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    service = new VenueMediaService(mockClient);
  });

  describe('Photo Upload Validation', () => {
    it('should reject photos larger than 10MB', async () => {
      // Create a mock file larger than 10MB
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });

      const result = await service.uploadPhoto({
        venueId: 'test-venue-id',
        file: largeFile,
      });

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('exceeds maximum');
      expect(result.data).toBeNull();
    });

    it('should reject invalid photo file types', async () => {
      const invalidFile = new File(['test'], 'test.txt', {
        type: 'text/plain',
      });

      const result = await service.uploadPhoto({
        venueId: 'test-venue-id',
        file: invalidFile,
      });

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Invalid file type');
      expect(result.data).toBeNull();
    });

    it('should accept valid JPEG photos', async () => {
      const validFile = new File(['test'], 'test.jpg', {
        type: 'image/jpeg',
      });

      // Mock successful upload
      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'test-venue-id/test.jpg' },
        error: null,
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.jpg' },
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'photo-id',
              venue_id: 'test-venue-id',
              url: 'https://example.com/test.jpg',
              display_order: 0,
            },
            error: null,
          }),
        }),
      });

      mockClient.storage.from = vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: vi.fn(),
      })) as any;

      mockClient.from = vi.fn(() => ({
        insert: mockInsert,
      })) as any;

      const result = await service.uploadPhoto({
        venueId: 'test-venue-id',
        file: validFile,
      });

      expect(result.error).toBeNull();
      expect(mockUpload).toHaveBeenCalled();
    });

    it('should accept valid PNG photos', async () => {
      const validFile = new File(['test'], 'test.png', {
        type: 'image/png',
      });

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'test-venue-id/test.png' },
        error: null,
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.png' },
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'photo-id',
              venue_id: 'test-venue-id',
              url: 'https://example.com/test.png',
              display_order: 0,
            },
            error: null,
          }),
        }),
      });

      mockClient.storage.from = vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: vi.fn(),
      })) as any;

      mockClient.from = vi.fn(() => ({
        insert: mockInsert,
      })) as any;

      const result = await service.uploadPhoto({
        venueId: 'test-venue-id',
        file: validFile,
      });

      expect(result.error).toBeNull();
    });

    it('should accept valid WebP photos', async () => {
      const validFile = new File(['test'], 'test.webp', {
        type: 'image/webp',
      });

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'test-venue-id/test.webp' },
        error: null,
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.webp' },
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'photo-id',
              venue_id: 'test-venue-id',
              url: 'https://example.com/test.webp',
              display_order: 0,
            },
            error: null,
          }),
        }),
      });

      mockClient.storage.from = vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: vi.fn(),
      })) as any;

      mockClient.from = vi.fn(() => ({
        insert: mockInsert,
      })) as any;

      const result = await service.uploadPhoto({
        venueId: 'test-venue-id',
        file: validFile,
      });

      expect(result.error).toBeNull();
    });
  });

  describe('Video Upload Validation', () => {
    it('should reject videos larger than 100MB', async () => {
      const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.mp4', {
        type: 'video/mp4',
      });

      const result = await service.uploadVideo({
        venueId: 'test-venue-id',
        file: largeFile,
      });

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('exceeds maximum');
      expect(result.data).toBeNull();
    });

    it('should reject invalid video file types', async () => {
      const invalidFile = new File(['test'], 'test.txt', {
        type: 'text/plain',
      });

      const result = await service.uploadVideo({
        venueId: 'test-venue-id',
        file: invalidFile,
      });

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Invalid file type');
      expect(result.data).toBeNull();
    });

    it('should accept valid MP4 videos', async () => {
      const validFile = new File(['test'], 'test.mp4', {
        type: 'video/mp4',
      });

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'test-venue-id/test.mp4' },
        error: null,
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.mp4' },
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'video-id',
              venue_id: 'test-venue-id',
              url: 'https://example.com/test.mp4',
              type: 'upload',
            },
            error: null,
          }),
        }),
      });

      mockClient.storage.from = vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: vi.fn(),
      })) as any;

      mockClient.from = vi.fn(() => ({
        insert: mockInsert,
      })) as any;

      const result = await service.uploadVideo({
        venueId: 'test-venue-id',
        file: validFile,
      });

      expect(result.error).toBeNull();
    });
  });

  describe('Form Upload Validation', () => {
    it('should reject forms larger than 5MB', async () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      });

      const result = await service.uploadForm({
        venueId: 'test-venue-id',
        file: largeFile,
        name: 'Test Form',
        category: 'permission_slip',
      });

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('exceeds maximum');
      expect(result.data).toBeNull();
    });

    it('should reject non-PDF files', async () => {
      const invalidFile = new File(['test'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const result = await service.uploadForm({
        venueId: 'test-venue-id',
        file: invalidFile,
        name: 'Test Form',
        category: 'permission_slip',
      });

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Invalid file type');
      expect(result.data).toBeNull();
    });

    it('should accept valid PDF files', async () => {
      const validFile = new File(['test'], 'test.pdf', {
        type: 'application/pdf',
      });

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'test-venue-id/test.pdf' },
        error: null,
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.pdf' },
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'form-id',
              venue_id: 'test-venue-id',
              name: 'Test Form',
              category: 'permission_slip',
              file_url: 'https://example.com/test.pdf',
              file_size_bytes: validFile.size,
              required: false,
            },
            error: null,
          }),
        }),
      });

      mockClient.storage.from = vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: vi.fn(),
      })) as any;

      mockClient.from = vi.fn(() => ({
        insert: mockInsert,
      })) as any;

      const result = await service.uploadForm({
        venueId: 'test-venue-id',
        file: validFile,
        name: 'Test Form',
        category: 'permission_slip',
      });

      expect(result.error).toBeNull();
    });
  });

  describe('Video Embed Validation', () => {
    it('should accept valid YouTube URLs', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'video-id',
              venue_id: 'test-venue-id',
              url: 'https://www.youtube.com/watch?v=test',
              type: 'youtube',
            },
            error: null,
          }),
        }),
      });

      mockClient.from = vi.fn(() => ({
        insert: mockInsert,
      })) as any;

      const result = await service.addVideoEmbed({
        venueId: 'test-venue-id',
        url: 'https://www.youtube.com/watch?v=test',
        type: 'youtube',
      });

      expect(result.error).toBeNull();
    });

    it('should accept valid Vimeo URLs', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'video-id',
              venue_id: 'test-venue-id',
              url: 'https://vimeo.com/123456',
              type: 'vimeo',
            },
            error: null,
          }),
        }),
      });

      mockClient.from = vi.fn(() => ({
        insert: mockInsert,
      })) as any;

      const result = await service.addVideoEmbed({
        venueId: 'test-venue-id',
        url: 'https://vimeo.com/123456',
        type: 'vimeo',
      });

      expect(result.error).toBeNull();
    });

    it('should reject invalid YouTube URLs', async () => {
      const result = await service.addVideoEmbed({
        venueId: 'test-venue-id',
        url: 'https://example.com/video',
        type: 'youtube',
      });

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Invalid YouTube URL');
    });

    it('should reject invalid Vimeo URLs', async () => {
      const result = await service.addVideoEmbed({
        venueId: 'test-venue-id',
        url: 'https://example.com/video',
        type: 'vimeo',
      });

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Invalid Vimeo URL');
    });
  });
});
