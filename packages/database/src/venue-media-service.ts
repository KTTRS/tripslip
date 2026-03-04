/**
 * Venue Media Service
 * 
 * Handles file uploads and management for venue photos, videos, and forms
 * with validation for file types, sizes, and permissions.
 * 
 * Requirements: 1.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.10
 */

import type { SupabaseClient } from './client';

// =====================================================
// TYPES
// =====================================================

export interface VenuePhoto {
  id: string;
  venue_id: string;
  url: string;
  caption?: string;
  display_order: number;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface VenueVideo {
  id: string;
  venue_id: string;
  url: string;
  type: 'upload' | 'youtube' | 'vimeo';
  title?: string;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface VenueForm {
  id: string;
  venue_id: string;
  name: string;
  category: 'permission_slip' | 'waiver' | 'medical' | 'photo_release';
  file_url: string;
  file_size_bytes?: number;
  version: number;
  required: boolean;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface UploadPhotoParams {
  venueId: string;
  file: File;
  caption?: string;
  displayOrder?: number;
}

export interface UploadVideoParams {
  venueId: string;
  file: File;
  title?: string;
}

export interface AddVideoEmbedParams {
  venueId: string;
  url: string;
  type: 'youtube' | 'vimeo';
  title?: string;
}

export interface UploadFormParams {
  venueId: string;
  file: File;
  name: string;
  category: 'permission_slip' | 'waiver' | 'medical' | 'photo_release';
  required?: boolean;
}

export interface FileValidationError {
  field: string;
  message: string;
}

// =====================================================
// VALIDATION CONSTANTS
// =====================================================

const PHOTO_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const VIDEO_MAX_SIZE = 100 * 1024 * 1024; // 100MB
const FORM_MAX_SIZE = 5 * 1024 * 1024; // 5MB

const PHOTO_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const FORM_ALLOWED_TYPES = ['application/pdf'];

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * Validates photo file upload
 * Requirements: 7.5
 */
function validatePhotoFile(file: File): FileValidationError[] {
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

/**
 * Validates video file upload
 * Requirements: 7.6
 */
function validateVideoFile(file: File): FileValidationError[] {
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

/**
 * Validates form/document file upload
 * Requirements: 7.10
 */
function validateFormFile(file: File): FileValidationError[] {
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

/**
 * Validates YouTube or Vimeo embed URL
 */
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
// VENUE MEDIA SERVICE
// =====================================================

export class VenueMediaService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Uploads a photo for a venue
   * Requirements: 7.2, 7.5
   */
  async uploadPhoto(params: UploadPhotoParams): Promise<{ data: VenuePhoto | null; error: Error | null }> {
    try {
      // Validate file
      const validationErrors = validatePhotoFile(params.file);
      if (validationErrors.length > 0) {
        return {
          data: null,
          error: new Error(validationErrors.map(e => e.message).join(', ')),
        };
      }

      // Generate unique filename
      const fileExt = params.file.name.split('.').pop();
      const fileName = `${params.venueId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('venue-photos')
        .upload(fileName, params.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return { data: null, error: uploadError };
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('venue-photos')
        .getPublicUrl(uploadData.path);

      // Create database record
      const { data: photoData, error: dbError } = await this.supabase
        .from('venue_photos')
        .insert({
          venue_id: params.venueId,
          url: urlData.publicUrl,
          caption: params.caption,
          display_order: params.displayOrder ?? 0,
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await this.supabase.storage.from('venue-photos').remove([uploadData.path]);
        return { data: null, error: dbError };
      }

      return { data: photoData as VenuePhoto, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Uploads a video file for a venue
   * Requirements: 7.3, 7.6
   */
  async uploadVideo(params: UploadVideoParams): Promise<{ data: VenueVideo | null; error: Error | null }> {
    try {
      // Validate file
      const validationErrors = validateVideoFile(params.file);
      if (validationErrors.length > 0) {
        return {
          data: null,
          error: new Error(validationErrors.map(e => e.message).join(', ')),
        };
      }

      // Generate unique filename
      const fileExt = params.file.name.split('.').pop();
      const fileName = `${params.venueId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('venue-videos')
        .upload(fileName, params.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return { data: null, error: uploadError };
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('venue-videos')
        .getPublicUrl(uploadData.path);

      // Create database record
      const { data: videoData, error: dbError } = await this.supabase
        .from('venue_videos')
        .insert({
          venue_id: params.venueId,
          url: urlData.publicUrl,
          type: 'upload',
          title: params.title,
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await this.supabase.storage.from('venue-videos').remove([uploadData.path]);
        return { data: null, error: dbError };
      }

      return { data: videoData as VenueVideo, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Adds a YouTube or Vimeo embed URL for a venue
   * Requirements: 7.3
   */
  async addVideoEmbed(params: AddVideoEmbedParams): Promise<{ data: VenueVideo | null; error: Error | null }> {
    try {
      // Validate URL
      const validationErrors = validateVideoEmbedUrl(params.url, params.type);
      if (validationErrors.length > 0) {
        return {
          data: null,
          error: new Error(validationErrors.map(e => e.message).join(', ')),
        };
      }

      // Create database record
      const { data: videoData, error: dbError } = await this.supabase
        .from('venue_videos')
        .insert({
          venue_id: params.venueId,
          url: params.url,
          type: params.type,
          title: params.title,
        })
        .select()
        .single();

      if (dbError) {
        return { data: null, error: dbError };
      }

      return { data: videoData as VenueVideo, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Uploads a form/document for a venue
   * Requirements: 7.10
   */
  async uploadForm(params: UploadFormParams): Promise<{ data: VenueForm | null; error: Error | null }> {
    try {
      // Validate file
      const validationErrors = validateFormFile(params.file);
      if (validationErrors.length > 0) {
        return {
          data: null,
          error: new Error(validationErrors.map(e => e.message).join(', ')),
        };
      }

      // Generate unique filename
      const fileExt = params.file.name.split('.').pop();
      const fileName = `${params.venueId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('venue-forms')
        .upload(fileName, params.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return { data: null, error: uploadError };
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('venue-forms')
        .getPublicUrl(uploadData.path);

      // Create database record
      const { data: formData, error: dbError } = await this.supabase
        .from('venue_forms')
        .insert({
          venue_id: params.venueId,
          name: params.name,
          category: params.category,
          file_url: urlData.publicUrl,
          file_size_bytes: params.file.size,
          required: params.required ?? false,
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await this.supabase.storage.from('venue-forms').remove([uploadData.path]);
        return { data: null, error: dbError };
      }

      return { data: formData as VenueForm, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Gets all photos for a venue
   * Requirements: 1.3
   */
  async getVenuePhotos(venueId: string): Promise<{ data: VenuePhoto[] | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('venue_photos')
        .select('*')
        .eq('venue_id', venueId)
        .order('display_order', { ascending: true });

      if (error) {
        return { data: null, error };
      }

      return { data: data as VenuePhoto[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Gets all videos for a venue
   * Requirements: 1.3
   */
  async getVenueVideos(venueId: string): Promise<{ data: VenueVideo[] | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('venue_videos')
        .select('*')
        .eq('venue_id', venueId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        return { data: null, error };
      }

      return { data: data as VenueVideo[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Gets all forms for a venue
   * Requirements: 1.7
   */
  async getVenueForms(venueId: string): Promise<{ data: VenueForm[] | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('venue_forms')
        .select('*')
        .eq('venue_id', venueId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        return { data: null, error };
      }

      return { data: data as VenueForm[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Deletes a photo and its storage file
   * Requirements: 7.2
   */
  async deletePhoto(photoId: string): Promise<{ error: Error | null }> {
    try {
      // Get photo record to find storage path
      const { data: photo, error: fetchError } = await this.supabase
        .from('venue_photos')
        .select('url, venue_id')
        .eq('id', photoId)
        .single();

      if (fetchError) {
        return { error: fetchError };
      }

      // Extract storage path from URL
      const url = new URL(photo.url);
      const pathParts = url.pathname.split('/');
      const storagePath = pathParts.slice(pathParts.indexOf('venue-photos') + 1).join('/');

      // Delete from database
      const { error: dbError } = await this.supabase
        .from('venue_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) {
        return { error: dbError };
      }

      // Delete from storage
      const { error: storageError } = await this.supabase.storage
        .from('venue-photos')
        .remove([storagePath]);

      if (storageError) {
        console.error('Failed to delete photo from storage:', storageError);
        // Don't return error since database record is already deleted
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Deletes a video and its storage file (if uploaded)
   * Requirements: 7.3
   */
  async deleteVideo(videoId: string): Promise<{ error: Error | null }> {
    try {
      // Get video record
      const { data: video, error: fetchError } = await this.supabase
        .from('venue_videos')
        .select('url, type, venue_id')
        .eq('id', videoId)
        .single();

      if (fetchError) {
        return { error: fetchError };
      }

      // Delete from database
      const { error: dbError } = await this.supabase
        .from('venue_videos')
        .delete()
        .eq('id', videoId);

      if (dbError) {
        return { error: dbError };
      }

      // Delete from storage only if it's an uploaded video
      if (video.type === 'upload') {
        const url = new URL(video.url);
        const pathParts = url.pathname.split('/');
        const storagePath = pathParts.slice(pathParts.indexOf('venue-videos') + 1).join('/');

        const { error: storageError } = await this.supabase.storage
          .from('venue-videos')
          .remove([storagePath]);

        if (storageError) {
          console.error('Failed to delete video from storage:', storageError);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Deletes a form and its storage file
   * Requirements: 7.10
   */
  async deleteForm(formId: string): Promise<{ error: Error | null }> {
    try {
      // Get form record
      const { data: form, error: fetchError } = await this.supabase
        .from('venue_forms')
        .select('file_url, venue_id')
        .eq('id', formId)
        .single();

      if (fetchError) {
        return { error: fetchError };
      }

      // Extract storage path from URL
      const url = new URL(form.file_url);
      const pathParts = url.pathname.split('/');
      const storagePath = pathParts.slice(pathParts.indexOf('venue-forms') + 1).join('/');

      // Delete from database
      const { error: dbError } = await this.supabase
        .from('venue_forms')
        .delete()
        .eq('id', formId);

      if (dbError) {
        return { error: dbError };
      }

      // Delete from storage
      const { error: storageError } = await this.supabase.storage
        .from('venue-forms')
        .remove([storagePath]);

      if (storageError) {
        console.error('Failed to delete form from storage:', storageError);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Updates photo display order
   * Requirements: 7.2
   */
  async updatePhotoOrder(photoId: string, displayOrder: number): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('venue_photos')
        .update({ display_order: displayOrder })
        .eq('id', photoId);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Updates photo caption
   * Requirements: 7.2
   */
  async updatePhotoCaption(photoId: string, caption: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('venue_photos')
        .update({ caption })
        .eq('id', photoId);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }
}

/**
 * Creates a VenueMediaService instance
 */
export function createVenueMediaService(supabase: SupabaseClient): VenueMediaService {
  return new VenueMediaService(supabase);
}
