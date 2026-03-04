import { useState } from 'react';
import { Button } from '@tripslip/ui/components/button';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import { Textarea } from '@tripslip/ui/components/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Alert, AlertDescription } from '@tripslip/ui/components/alert';
import { Save, AlertCircle } from 'lucide-react';
import { getSupportedCurrencies, getCurrencyConfig, formatCurrency } from '@tripslip/utils';

export interface PricingTier {
  id?: string;
  min_students: number;
  max_students: number;
  price_cents: number;
  free_chaperones: number;
}

export interface ExperienceFormData {
  title: string;
  description: string;
  description_es?: string;
  duration_minutes: number;
  capacity: number;
  min_students: number;
  max_students: number;
  grade_levels: string;
  subjects: string;
  currency?: string;
  pricing_tiers: PricingTier[];
}

export interface ExperienceCreationFormProps {
  initialData?: Partial<ExperienceFormData>;
  onSubmit: (data: ExperienceFormData) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

/**
 * ExperienceCreationForm - Standalone form component for creating/editing experiences
 * 
 * Features:
 * - All required fields (title, description, duration, capacity, pricing)
 * - Validates min/max students
 * - Supports multiple pricing tiers
 * - Follows TripSlip design system (Yellow #F5C518, Black #0A0A0A, 2px borders, offset shadows)
 * - Multi-language support (English/Spanish descriptions)
 * 
 * @example
 * ```tsx
 * <ExperienceCreationForm
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   isSubmitting={false}
 * />
 * ```
 */
export function ExperienceCreationForm({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ExperienceCreationFormProps) {
  const [formData, setFormData] = useState<ExperienceFormData>({
    title: initialData.title || '',
    description: initialData.description || '',
    description_es: initialData.description_es || '',
    duration_minutes: initialData.duration_minutes || 60,
    capacity: initialData.capacity || 30,
    min_students: initialData.min_students || 10,
    max_students: initialData.max_students || 30,
    grade_levels: initialData.grade_levels || '',
    subjects: initialData.subjects || '',
    currency: initialData.currency || 'usd',
    pricing_tiers: initialData.pricing_tiers || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate a single field
  const validateField = (field: string, value: string | number): string | null => {
    switch (field) {
      case 'title':
        if (!String(value).trim()) {
          return 'Experience title is required';
        }
        if (String(value).trim().length < 3) {
          return 'Title must be at least 3 characters';
        }
        return null;

      case 'description':
        if (!String(value).trim()) {
          return 'Description is required';
        }
        if (String(value).trim().length < 20) {
          return 'Description must be at least 20 characters';
        }
        return null;

      case 'duration_minutes':
        const duration = Number(value);
        if (!duration || duration < 15) {
          return 'Duration must be at least 15 minutes';
        }
        if (duration > 480) {
          return 'Duration cannot exceed 8 hours (480 minutes)';
        }
        return null;

      case 'capacity':
        const capacity = Number(value);
        if (!capacity || capacity < 1) {
          return 'Capacity must be at least 1 student';
        }
        return null;

      case 'min_students':
        const minStudents = Number(value);
        if (!minStudents || minStudents < 1) {
          return 'Minimum students must be at least 1';
        }
        if (minStudents > formData.max_students) {
          return 'Minimum students cannot exceed maximum students';
        }
        return null;

      case 'max_students':
        const maxStudents = Number(value);
        if (!maxStudents || maxStudents < 1) {
          return 'Maximum students must be at least 1';
        }
        if (maxStudents < formData.min_students) {
          return 'Maximum students cannot be less than minimum students';
        }
        return null;

      default:
        return null;
    }
  };

  // Validate all required fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const titleError = validateField('title', formData.title);
    if (titleError) newErrors.title = titleError;

    const descriptionError = validateField('description', formData.description);
    if (descriptionError) newErrors.description = descriptionError;

    const durationError = validateField('duration_minutes', formData.duration_minutes);
    if (durationError) newErrors.duration_minutes = durationError;

    const capacityError = validateField('capacity', formData.capacity);
    if (capacityError) newErrors.capacity = capacityError;

    const minStudentsError = validateField('min_students', formData.min_students);
    if (minStudentsError) newErrors.min_students = minStudentsError;

    const maxStudentsError = validateField('max_students', formData.max_students);
    if (maxStudentsError) newErrors.max_students = maxStudentsError;

    // Validate pricing tiers
    if (formData.pricing_tiers.length === 0) {
      newErrors.pricing_tiers = 'At least one pricing tier is required';
    } else {
      // Validate each pricing tier
      const tierErrors = formData.pricing_tiers.some(tier => 
        tier.price_cents < 0 || 
        tier.min_students < 1 || 
        tier.max_students < tier.min_students
      );
      if (tierErrors) {
        newErrors.pricing_tiers = 'Invalid pricing tier configuration';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field change
  const handleChange = (field: keyof ExperienceFormData, value: string | number) => {
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
  const handleBlur = (field: keyof ExperienceFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    const value = formData[field];
    const error = validateField(field, value as string | number);
    
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  // Handle pricing tier changes
  const addPricingTier = () => {
    const newTier: PricingTier = {
      min_students: formData.min_students,
      max_students: formData.max_students,
      price_cents: 0,
      free_chaperones: 2,
    };
    setFormData((prev) => ({
      ...prev,
      pricing_tiers: [...prev.pricing_tiers, newTier],
    }));
    
    // Clear pricing tier error
    if (errors.pricing_tiers) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.pricing_tiers;
        return newErrors;
      });
    }
  };

  const updatePricingTier = (index: number, field: keyof PricingTier, value: number) => {
    setFormData((prev) => ({
      ...prev,
      pricing_tiers: prev.pricing_tiers.map((tier, i) =>
        i === index ? { ...tier, [field]: value } : tier
      ),
    }));
  };

  const removePricingTier = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pricing_tiers: prev.pricing_tiers.filter((_, i) => i !== index),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      title: true,
      description: true,
      duration_minutes: true,
      capacity: true,
      min_students: true,
      max_students: true,
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Submit form
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
        <CardHeader>
          <CardTitle className="font-['Fraunces'] text-2xl font-bold">
            Basic Information
          </CardTitle>
          <CardDescription className="font-['Plus_Jakarta_Sans']">
            Provide the essential details about your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-['Plus_Jakarta_Sans'] font-semibold">
              Experience Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              onBlur={() => handleBlur('title')}
              placeholder="e.g., Interactive Museum Tour"
              className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518]"
            />
            {touched.title && errors.title && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.title}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-['Plus_Jakarta_Sans'] font-semibold">
              Description (English) <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              placeholder="Describe what students will learn and experience..."
              rows={5}
              className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518]"
            />
            {touched.description && errors.description && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.description}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_es" className="font-['Plus_Jakarta_Sans'] font-semibold">
              Description (Spanish)
            </Label>
            <Textarea
              id="description_es"
              value={formData.description_es}
              onChange={(e) => handleChange('description_es', e.target.value)}
              placeholder="Describe lo que los estudiantes aprenderán y experimentarán..."
              rows={5}
              className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518]"
            />
            <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
              Optional: Provide a Spanish translation for bilingual support
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_minutes" className="font-['Plus_Jakarta_Sans'] font-semibold">
                Duration (minutes) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="duration_minutes"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value) || 0)}
                onBlur={() => handleBlur('duration_minutes')}
                min={15}
                max={480}
                className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518] font-['Space_Mono']"
              />
              {touched.duration_minutes && errors.duration_minutes && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.duration_minutes}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity" className="font-['Plus_Jakarta_Sans'] font-semibold">
                Total Capacity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 0)}
                onBlur={() => handleBlur('capacity')}
                min={1}
                className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518] font-['Space_Mono']"
              />
              {touched.capacity && errors.capacity && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.capacity}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="font-['Plus_Jakarta_Sans'] font-semibold">
              Currency
            </Label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full px-3 py-2 border-2 border-black rounded-md focus:ring-[#F5C518] focus:border-[#F5C518] font-['Plus_Jakarta_Sans']"
            >
              {getSupportedCurrencies().map((curr) => {
                const config = getCurrencyConfig(curr);
                return (
                  <option key={curr} value={curr}>
                    {config.symbol} {config.code} - {config.name}
                  </option>
                );
              })}
            </select>
            <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
              Select the currency for pricing this experience
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Student Capacity */}
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
        <CardHeader>
          <CardTitle className="font-['Fraunces'] text-2xl font-bold">
            Student Capacity
          </CardTitle>
          <CardDescription className="font-['Plus_Jakarta_Sans']">
            Set minimum and maximum student limits for bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_students" className="font-['Plus_Jakarta_Sans'] font-semibold">
                Minimum Students <span className="text-red-500">*</span>
              </Label>
              <Input
                id="min_students"
                type="number"
                value={formData.min_students}
                onChange={(e) => handleChange('min_students', parseInt(e.target.value) || 0)}
                onBlur={() => handleBlur('min_students')}
                min={1}
                className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518] font-['Space_Mono']"
              />
              {touched.min_students && errors.min_students && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.min_students}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_students" className="font-['Plus_Jakarta_Sans'] font-semibold">
                Maximum Students <span className="text-red-500">*</span>
              </Label>
              <Input
                id="max_students"
                type="number"
                value={formData.max_students}
                onChange={(e) => handleChange('max_students', parseInt(e.target.value) || 0)}
                onBlur={() => handleBlur('max_students')}
                min={1}
                className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518] font-['Space_Mono']"
              />
              {touched.max_students && errors.max_students && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.max_students}</span>
                </div>
              )}
            </div>
          </div>

          {formData.min_students > formData.max_students && (
            <Alert className="border-2 border-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600 font-['Plus_Jakarta_Sans']">
                Minimum students cannot be greater than maximum students
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Educational Details */}
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
        <CardHeader>
          <CardTitle className="font-['Fraunces'] text-2xl font-bold">
            Educational Details
          </CardTitle>
          <CardDescription className="font-['Plus_Jakarta_Sans']">
            Help teachers find your experience by grade level and subject
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grade_levels" className="font-['Plus_Jakarta_Sans'] font-semibold">
              Grade Levels (comma-separated)
            </Label>
            <Input
              id="grade_levels"
              value={formData.grade_levels}
              onChange={(e) => handleChange('grade_levels', e.target.value)}
              placeholder="e.g., K, 1, 2, 3, 4, 5"
              className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518]"
            />
            <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
              Enter grade levels separated by commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjects" className="font-['Plus_Jakarta_Sans'] font-semibold">
              Subjects (comma-separated)
            </Label>
            <Input
              id="subjects"
              value={formData.subjects}
              onChange={(e) => handleChange('subjects', e.target.value)}
              placeholder="e.g., Science, History, Art"
              className="border-2 border-black focus:ring-[#F5C518] focus:border-[#F5C518]"
            />
            <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
              Enter subjects separated by commas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Tiers */}
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
        <CardHeader>
          <CardTitle className="font-['Fraunces'] text-2xl font-bold">
            Pricing Tiers <span className="text-red-500">*</span>
          </CardTitle>
          <CardDescription className="font-['Plus_Jakarta_Sans']">
            Set pricing for different group sizes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.pricing_tiers.map((tier, index) => (
            <div
              key={index}
              className="p-4 border-2 border-black rounded-md bg-white space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-['Plus_Jakarta_Sans'] font-semibold">
                  Tier {index + 1}
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removePricingTier(index)}
                  className="border-2 border-black hover:bg-red-50"
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-['Plus_Jakarta_Sans']">Min Students</Label>
                  <Input
                    type="number"
                    value={tier.min_students}
                    onChange={(e) =>
                      updatePricingTier(index, 'min_students', parseInt(e.target.value) || 0)
                    }
                    min={1}
                    className="border-2 border-black font-['Space_Mono'] text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-['Plus_Jakarta_Sans']">Max Students</Label>
                  <Input
                    type="number"
                    value={tier.max_students}
                    onChange={(e) =>
                      updatePricingTier(index, 'max_students', parseInt(e.target.value) || 0)
                    }
                    min={1}
                    className="border-2 border-black font-['Space_Mono'] text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-['Plus_Jakarta_Sans']">Price (cents)</Label>
                  <Input
                    type="number"
                    value={tier.price_cents}
                    onChange={(e) =>
                      updatePricingTier(index, 'price_cents', parseInt(e.target.value) || 0)
                    }
                    min={0}
                    className="border-2 border-black font-['Space_Mono'] text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-['Plus_Jakarta_Sans']">Free Chaperones</Label>
                  <Input
                    type="number"
                    value={tier.free_chaperones}
                    onChange={(e) =>
                      updatePricingTier(index, 'free_chaperones', parseInt(e.target.value) || 0)
                    }
                    min={0}
                    className="border-2 border-black font-['Space_Mono'] text-sm"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addPricingTier}
            className="w-full border-2 border-black hover:bg-[#F5C518] hover:shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] transition-all duration-200"
          >
            Add Pricing Tier
          </Button>

          {errors.pricing_tiers && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.pricing_tiers}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="border-2 border-black hover:bg-gray-100 font-['Plus_Jakarta_Sans'] font-semibold"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all duration-200 font-['Plus_Jakarta_Sans'] font-bold"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save Experience'}
        </Button>
      </div>
    </form>
  );
}
