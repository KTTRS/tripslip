# Venue Media Service

The Venue Media Service provides file upload and management capabilities for venue photos, videos, and forms with built-in validation.

## Features

- **Photo Management**: Upload, retrieve, and manage venue photos with captions and ordering
- **Video Management**: Upload videos or add YouTube/Vimeo embeds
- **Form Management**: Upload and manage venue forms (PDFs)
- **File Validation**: Automatic validation of file types and sizes
- **Storage Integration**: Seamless integration with Supabase Storage

## File Size Limits

- **Photos**: 10MB maximum (JPEG, PNG, WebP)
- **Videos**: 100MB maximum (MP4, WebM, QuickTime)
- **Forms**: 5MB maximum (PDF only)

## Usage

### Initialize the Service

```typescript
import { createSupabaseClient, createVenueMediaService } from '@tripslip/database';

const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const mediaService = createVenueMediaService(supabase);
```

### Upload a Photo

```typescript
const { data, error } = await mediaService.uploadPhoto({
  venueId: 'venue-uuid',
  file: photoFile, // File object from input
  caption: 'Main entrance',
  displayOrder: 0,
});

if (error) {
  console.error('Upload failed:', error.message);
} else {
  console.log('Photo uploaded:', data);
}
```

### Upload a Video

```typescript
const { data, error } = await mediaService.uploadVideo({
  venueId: 'venue-uuid',
  file: videoFile,
  title: 'Virtual Tour',
});
```

### Add YouTube/Vimeo Embed

```typescript
const { data, error } = await mediaService.addVideoEmbed({
  venueId: 'venue-uuid',
  url: 'https://www.youtube.com/watch?v=example',
  type: 'youtube',
  title: 'Venue Overview',
});
```

### Upload a Form

```typescript
const { data, error } = await mediaService.uploadForm({
  venueId: 'venue-uuid',
  file: pdfFile,
  name: 'Permission Slip',
  category: 'permission_slip',
  required: true,
});
```

### Get Venue Media

```typescript
// Get all photos
const { data: photos, error } = await mediaService.getVenuePhotos('venue-uuid');

// Get all videos
const { data: videos, error } = await mediaService.getVenueVideos('venue-uuid');

// Get all forms
const { data: forms, error } = await mediaService.getVenueForms('venue-uuid');
```

### Delete Media

```typescript
// Delete a photo
await mediaService.deletePhoto('photo-uuid');

// Delete a video
await mediaService.deleteVideo('video-uuid');

// Delete a form
await mediaService.deleteForm('form-uuid');
```

### Update Photo Metadata

```typescript
// Update display order
await mediaService.updatePhotoOrder('photo-uuid', 5);

// Update caption
await mediaService.updatePhotoCaption('photo-uuid', 'Updated caption');
```

## Validation

The service automatically validates:

- **File Types**: Only allowed MIME types are accepted
- **File Sizes**: Files exceeding limits are rejected
- **Video URLs**: YouTube and Vimeo URLs are validated

Validation errors are returned in the error object:

```typescript
const { data, error } = await mediaService.uploadPhoto({
  venueId: 'venue-uuid',
  file: invalidFile,
});

if (error) {
  // error.message contains validation error details
  console.error(error.message);
}
```

## Storage Structure

Files are organized in Supabase Storage buckets:

- `venue-photos/{venueId}/{timestamp}-{random}.{ext}`
- `venue-videos/{venueId}/{timestamp}-{random}.{ext}`
- `venue-forms/{venueId}/{timestamp}-{random}.pdf`

## Security

- Row Level Security (RLS) policies ensure only venue employees can upload/modify media
- Public read access for all venue media
- Administrators and editors can manage media
- Viewers have read-only access

## Requirements Satisfied

- **1.3**: Store media assets including photos, videos, and virtual tour links
- **7.1**: Allow venue employees to modify venue information
- **7.2**: Allow venue employees to upload photos with captions and display order
- **7.3**: Allow venue employees to upload videos or embed video links
- **7.4**: Allow venue employees to add virtual tour links
- **7.5**: Validate uploaded images are in supported formats (JPEG, PNG, WebP) and under 10MB
- **7.6**: Validate uploaded videos are under 100MB or are valid embed URLs
- **7.10**: Allow venue employees to upload Venue_Form documents in PDF format under 5MB

## Testing

Run the test suite:

```bash
npm test
```

The test suite validates:
- File size limits for photos, videos, and forms
- File type validation
- Accepted file formats (JPEG, PNG, WebP, MP4, WebM, QuickTime, PDF)
- YouTube and Vimeo URL validation
