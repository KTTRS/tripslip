import { useState, useRef } from 'react';
import { Button } from '@tripslip/ui/components/button';
import { Card, CardContent } from '@tripslip/ui/components/card';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Upload, X, GripVertical } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  file?: File;
  order: number;
}

interface PhotoUploadProps {
  experienceId?: string;
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}

export function PhotoUpload({ experienceId, photos, onChange }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Validate file types
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    // If experience exists, upload immediately
    if (experienceId) {
      await uploadPhotos(validFiles);
    } else {
      // Otherwise, store files for later upload
      const newPhotos: Photo[] = validFiles.map((file, index) => ({
        id: `temp-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        file,
        order: photos.length + index
      }));
      onChange([...photos, ...newPhotos]);
    }
  };
  
  const uploadPhotos = async (files: File[]) => {
    if (!experienceId) return;
    
    try {
      setUploading(true);
      
      const uploadPromises = files.map(async (file, index) => {
        const fileName = `${experienceId}/${Date.now()}-${index}-${file.name}`;
        const { error } = await supabase.storage
          .from('experience-photos')
          .upload(fileName, file, {
            contentType: file.type,
            cacheControl: '3600'
          });
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('experience-photos')
          .getPublicUrl(fileName);
        
        return {
          id: `photo-${Date.now()}-${index}`,
          url: publicUrl,
          order: photos.length + index
        };
      });
      
      const uploadedPhotos = await Promise.all(uploadPromises);
      onChange([...photos, ...uploadedPhotos]);
      toast.success(`${files.length} photo(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };
  
  const removePhoto = async (index: number) => {
    const photo = photos[index];
    
    // If photo is already uploaded, delete from storage
    if (experienceId && !photo.file) {
      try {
        const fileName = photo.url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('experience-photos')
            .remove([`${experienceId}/${fileName}`]);
        }
      } catch (error) {
        console.error('Error deleting photo:', error);
      }
    }
    
    // Remove from local state
    const newPhotos = photos.filter((_, i) => i !== index);
    // Update order
    newPhotos.forEach((photo, i) => {
      photo.order = i;
    });
    onChange(newPhotos);
  };
  
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newPhotos = [...photos];
    const draggedPhoto = newPhotos[draggedIndex];
    newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(index, 0, draggedPhoto);
    
    // Update order
    newPhotos.forEach((photo, i) => {
      photo.order = i;
    });
    
    onChange(newPhotos);
    setDraggedIndex(index);
  };
  
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Photos'}
        </Button>
        <p className="text-sm text-gray-500">
          Max 5MB per photo. Drag to reorder.
        </p>
      </div>
      
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <Card
              key={photo.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative cursor-move border-2 ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  <img
                    src={photo.url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute top-1 left-1 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-1 right-1 bg-black/50 text-white p-1 rounded">
                    <GripVertical className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {photos.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">No photos uploaded yet</p>
            <p className="text-sm text-gray-500">
              Click "Upload Photos" to add images
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
