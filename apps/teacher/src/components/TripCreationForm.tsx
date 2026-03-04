import { useState } from 'react';
import { Button } from '@tripslip/ui/components/button';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import { Textarea } from '@tripslip/ui/components/textarea';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

export interface TripFormData {
  name: string;
  date: string;
  time: string;
  venueId?: string;
  experienceId?: string;
  description?: string;
  specialRequirements?: string;
}

export interface TripCreationFormProps {
  initialData?: Partial<TripFormData>;
  onSubmit: (data: TripFormData) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  venueName?: string;
  experienceName?: string;
}

/**
 * TripCreationForm - Standalone form component for creating trips
 * 
 * Features:
 * - All required fields (date, venue, experience)
 * - Validates trip date is at least 2 weeks in future
 * - Follows TripSlip design system (Yellow #F5C518, Black #0A0A0A, bounce animations)
 * - Can be used standalone or within a wizard
 * 
 * @example
 * ```tsx
 * <TripCreationForm
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   venueName="Science Museum"
 *   experienceName="Space Exploration"
 * />
 * ```
 */
export function TripCreationForm({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  venueName,
  experienceName,
}: TripCreationFormProps) {
  const [formData, setFormData] = useState<TripFormData>({
    name: initialData.name || '',
    date: initialData.date || '',
    time: initialData.time || '',
    venueId: initialData.venueId,
    experienceId: initialData.experienceId,
    description: initialData.description || '',
    specialRequirements: initialData.specialRequirements || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Calculate minimum date (2 weeks from today)
  const getMinimumDate = () => {
    const today = new Date();
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);
    return twoWeeksFromNow.toISOString().split('T')[0];
  };

  const minimumDate = getMinimumDate();

  // Validate a single field
  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'name':
        if (!value.trim()) {
          return 'Trip name is required';
        }
        if (value.trim().length < 3) {
          return 'Trip name must be at least 3 characters';
        }
        return null;

      case 'date':
        if (!value) {
          return 'Trip date is required';
        }
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          return 'Trip date must be in the future';
        }
        
        // Check if date is at least 2 weeks in the future
        const twoWeeksFromNow = new Date(today);
        twoWeeksFromNow.setDate(today.getDate() + 14);
        
        if (selectedDate < twoWeeksFromNow) {
          return 'Trip date must be at least 2 weeks in the future';
        }
        return null;

      case 'time':
        if (!value) {
          return 'Trip time is required';
        }
        return null;

      default:
        return null;
    }
  };

  // Validate all required fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameError = validateField('name', formData.name);
    if (nameError) newErrors.name = nameError;

    const dateError = validateField('date', formData.date);
    if (dateError) newErrors.date = dateError;

    const timeError = validateField('time', formData.time);
    if (timeError) newErrors.time = timeError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field change
  const handleChange = (field: keyof TripFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle field blur
  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    // Validate field on blur
    const value = formData[field as keyof TripFormData] as string;
    const error = validateField(field, value);
    
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      date: true,
      time: true,
    });

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Venue/Experience Info (if provided) */}
      {(venueName || experienceName) && (
        <div className="bg-[#F5C518] border-2 border-[#0A0A0A] rounded-lg p-4 shadow-[4px_4px_0px_#0A0A0A]">
          <div className="space-y-1">
            {venueName && (
              <p className="text-sm font-medium text-[#0A0A0A]">
                Venue: <span className="font-bold">{venueName}</span>
              </p>
            )}
            {experienceName && (
              <p className="text-sm font-medium text-[#0A0A0A]">
                Experience: <span className="font-bold">{experienceName}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Trip Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-[#0A0A0A] font-semibold">
          Trip Name <span className="text-red-600">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="e.g., Science Museum Field Trip"
          className={`border-2 ${
            errors.name && touched.name
              ? 'border-red-600 focus:border-red-600'
              : 'border-[#0A0A0A] focus:border-[#F5C518]'
          }`}
          disabled={isSubmitting}
          aria-invalid={errors.name && touched.name ? 'true' : 'false'}
          aria-describedby={errors.name && touched.name ? 'name-error' : undefined}
        />
        {errors.name && touched.name && (
          <div id="name-error" className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.name}</span>
          </div>
        )}
      </div>

      {/* Trip Date */}
      <div className="space-y-2">
        <Label htmlFor="date" className="text-[#0A0A0A] font-semibold">
          Trip Date <span className="text-red-600">*</span>
        </Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            onBlur={() => handleBlur('date')}
            min={minimumDate}
            className={`pl-10 border-2 ${
              errors.date && touched.date
                ? 'border-red-600 focus:border-red-600'
                : 'border-[#0A0A0A] focus:border-[#F5C518]'
            }`}
            disabled={isSubmitting}
            aria-invalid={errors.date && touched.date ? 'true' : 'false'}
            aria-describedby={errors.date && touched.date ? 'date-error' : 'date-help'}
          />
        </div>
        {errors.date && touched.date ? (
          <div id="date-error" className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.date}</span>
          </div>
        ) : (
          <p id="date-help" className="text-sm text-gray-600">
            Trip must be scheduled at least 2 weeks in advance
          </p>
        )}
      </div>

      {/* Trip Time */}
      <div className="space-y-2">
        <Label htmlFor="time" className="text-[#0A0A0A] font-semibold">
          Trip Time <span className="text-red-600">*</span>
        </Label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => handleChange('time', e.target.value)}
            onBlur={() => handleBlur('time')}
            className={`pl-10 border-2 ${
              errors.time && touched.time
                ? 'border-red-600 focus:border-red-600'
                : 'border-[#0A0A0A] focus:border-[#F5C518]'
            }`}
            disabled={isSubmitting}
            aria-invalid={errors.time && touched.time ? 'true' : 'false'}
            aria-describedby={errors.time && touched.time ? 'time-error' : undefined}
          />
        </div>
        {errors.time && touched.time && (
          <div id="time-error" className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.time}</span>
          </div>
        )}
      </div>

      {/* Description (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-[#0A0A0A] font-semibold">
          Description <span className="text-gray-500 font-normal">(Optional)</span>
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Add any additional details about the trip..."
          rows={4}
          className="border-2 border-[#0A0A0A] focus:border-[#F5C518]"
          disabled={isSubmitting}
        />
        <p className="text-sm text-gray-600">
          Provide information that will help parents understand the trip
        </p>
      </div>

      {/* Special Requirements (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="specialRequirements" className="text-[#0A0A0A] font-semibold">
          Special Requirements <span className="text-gray-500 font-normal">(Optional)</span>
        </Label>
        <Textarea
          id="specialRequirements"
          value={formData.specialRequirements}
          onChange={(e) => handleChange('specialRequirements', e.target.value)}
          placeholder="e.g., Dietary restrictions, accessibility needs, special equipment..."
          rows={3}
          className="border-2 border-[#0A0A0A] focus:border-[#F5C518]"
          disabled={isSubmitting}
        />
        <p className="text-sm text-gray-600">
          Any special requirements or accommodations needed for this trip
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="border-2 border-[#0A0A0A] hover:bg-gray-100"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="ml-auto bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 font-semibold"
        >
          {isSubmitting ? 'Creating Trip...' : 'Create Trip'}
        </Button>
      </div>
    </form>
  );
}
