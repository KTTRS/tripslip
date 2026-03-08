import { useState, useRef, useCallback } from 'react';
import { authFetch } from '../../lib/api';
import { Button } from '@tripslip/ui/components/button';
import { Card, CardContent } from '@tripslip/ui/components/card';
import { Badge } from '@tripslip/ui/components/badge';
import { toast } from 'sonner';
import {
  Upload,
  Camera,
  FileText,
  X,
  Loader2,
  GripVertical,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const FORM_TYPES = [
  { value: 'school_permission', label: 'School Permission' },
  { value: 'venue_waiver', label: 'Venue Waiver' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'medical', label: 'Medical' },
  { value: 'photo_release', label: 'Photo Release' },
  { value: 'custom', label: 'Custom' },
] as const;

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface UploadedForm {
  id: string;
  file: File;
  title: string;
  formType: string;
  required: boolean;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  errorMessage?: string;
  serverRecord?: any;
}

interface FormUploadManagerProps {
  tripId?: string;
  venueForms?: Array<{ id: string; name: string; category: string; file_url: string; required: boolean }>;
  onFormsChange?: (forms: UploadedForm[]) => void;
}

export function FormUploadManager({ tripId, venueForms = [], onFormsChange }: FormUploadManagerProps) {
  const [forms, setForms] = useState<UploadedForm[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const updateForms = useCallback((updater: (prev: UploadedForm[]) => UploadedForm[]) => {
    setForms(prev => {
      const next = updater(prev);
      onFormsChange?.(next);
      return next;
    });
  }, [onFormsChange]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" is not a supported file type. Please upload PDF, JPEG, or PNG files.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" exceeds the 10MB size limit.`;
    }
    return null;
  };

  const addFiles = useCallback((files: File[]) => {
    const newForms: UploadedForm[] = [];

    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }

      const isPdf = file.type === 'application/pdf';
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

      newForms.push({
        id: crypto.randomUUID(),
        file,
        title: baseName,
        formType: isPdf ? 'school_permission' : 'custom',
        required: false,
        status: 'pending',
        progress: 0,
      });
    }

    if (newForms.length > 0) {
      updateForms(prev => [...prev, ...newForms]);
    }
  }, [updateForms]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, [addFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    if (e.target) e.target.value = '';
  }, [addFiles]);

  const removeForm = useCallback((id: string) => {
    updateForms(prev => prev.filter(f => f.id !== id));
  }, [updateForms]);

  const updateFormField = useCallback((id: string, field: Partial<UploadedForm>) => {
    updateForms(prev => prev.map(f => f.id === id ? { ...f, ...field } : f));
  }, [updateForms]);

  const uploadForm = useCallback(async (form: UploadedForm) => {
    if (!tripId) {
      toast.error('Trip must be created before uploading forms. Forms will be uploaded on submit.');
      return;
    }

    updateFormField(form.id, { status: 'uploading', progress: 30 });

    try {
      const formData = new FormData();
      formData.append('file', form.file);
      formData.append('trip_id', tripId);
      formData.append('title', form.title);
      formData.append('form_type', form.formType);
      formData.append('required', String(form.required));

      const response = await authFetch('/api/upload-form', {
        method: 'POST',
        body: formData,
      });

      updateFormField(form.id, { progress: 80 });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
      }

      const result = await response.json();
      updateFormField(form.id, {
        status: 'uploaded',
        progress: 100,
        serverRecord: result.form,
      });
      toast.success(`"${form.title}" uploaded successfully`);
    } catch (err: any) {
      updateFormField(form.id, {
        status: 'error',
        progress: 0,
        errorMessage: err.message || 'Upload failed',
      });
      toast.error(`Failed to upload "${form.title}": ${err.message}`);
    }
  }, [tripId, updateFormField]);

  const uploadAllPending = useCallback(async () => {
    const pending = forms.filter(f => f.status === 'pending');
    if (pending.length === 0) {
      toast.info('No pending forms to upload');
      return;
    }

    for (const form of pending) {
      await uploadForm(form);
    }
  }, [forms, uploadForm]);

  const pendingCount = forms.filter(f => f.status === 'pending').length;
  const uploadedCount = forms.filter(f => f.status === 'uploaded').length;
  const errorCount = forms.filter(f => f.status === 'error').length;

  return (
    <div className="space-y-4">
      {venueForms.length > 0 && (
        <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-sm font-semibold text-blue-800 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Venue-Required Forms ({venueForms.length})
          </p>
          <ul className="space-y-1">
            {venueForms.map(form => (
              <li key={form.id} className="text-sm text-blue-700 flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                {form.name}
                {form.required && (
                  <Badge variant="outline" className="text-xs border-red-300 text-red-600">
                    Required
                  </Badge>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-blue-600 mt-2">
            These forms will be automatically included with the trip.
          </p>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${isDragging
            ? 'border-[#F5C518] bg-[#FFFDE7] scale-[1.01]'
            : 'border-gray-300 bg-gray-50 hover:border-[#F5C518] hover:bg-[#FFFDE7]/50'
          }
        `}
      >
        <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
        <p className="text-sm font-medium text-gray-700 mb-1">
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-xs text-gray-500 mb-3">
          PDF, JPEG, or PNG up to 10MB
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-[#0A0A0A]"
          >
            <Upload className="w-4 h-4 mr-2" />
            Browse Files
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => cameraInputRef.current?.click()}
            className="border-2 border-[#0A0A0A] sm:inline-flex"
          >
            <Camera className="w-4 h-4 mr-2" />
            Take Photo
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFileInput}
          className="hidden"
          aria-label="Browse files to upload"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
          aria-label="Take a photo to upload"
        />
      </div>

      {forms.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0A0A0A]">
              Uploaded Forms ({forms.length})
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {uploadedCount > 0 && (
                <span className="text-green-600">{uploadedCount} uploaded</span>
              )}
              {pendingCount > 0 && (
                <span className="text-yellow-600">{pendingCount} pending</span>
              )}
              {errorCount > 0 && (
                <span className="text-red-600">{errorCount} failed</span>
              )}
            </div>
          </div>

          {forms.map(form => (
            <Card key={form.id} className="border border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <GripVertical className="w-4 h-4 text-gray-300" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs text-gray-500 truncate">{form.file.name}</span>
                      <span className="text-xs text-gray-400">
                        ({(form.file.size / 1024).toFixed(0)} KB)
                      </span>
                      {form.status === 'uploaded' && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                      {form.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 text-[#F5C518] animate-spin flex-shrink-0" />
                      )}
                      {form.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Title</label>
                        <input
                          type="text"
                          value={form.title}
                          onChange={e => updateFormField(form.id, { title: e.target.value })}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                          placeholder="Form title"
                          disabled={form.status === 'uploading'}
                          aria-label="Form title"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Type</label>
                        <select
                          value={form.formType}
                          onChange={e => updateFormField(form.id, { formType: e.target.value })}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent bg-white"
                          disabled={form.status === 'uploading'}
                          aria-label="Form type"
                        >
                          {FORM_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.required}
                            onChange={e => updateFormField(form.id, { required: e.target.checked })}
                            className="rounded border-gray-300 text-[#F5C518] focus:ring-[#F5C518]"
                            disabled={form.status === 'uploading'}
                          />
                          <span className="text-sm text-gray-700">Required</span>
                        </label>
                      </div>
                    </div>

                    {form.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-[#F5C518] h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${form.progress}%` }}
                        />
                      </div>
                    )}

                    {form.status === 'error' && form.errorMessage && (
                      <p className="text-xs text-red-600">{form.errorMessage}</p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeForm(form.id)}
                    disabled={form.status === 'uploading'}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500"
                    aria-label={`Remove ${form.title}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {tripId && pendingCount > 0 && (
            <Button
              type="button"
              onClick={uploadAllPending}
              className="w-full bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 font-semibold"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload {pendingCount} Form{pendingCount > 1 ? 's' : ''}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
