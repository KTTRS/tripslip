import { useState } from 'react';
import { useTripCreationStore } from '../../stores/tripCreationStore';
import { Button } from '@tripslip/ui/components/button';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import { Textarea } from '@tripslip/ui/components/textarea';
import { toast } from 'sonner';
import { MapPin, Phone, Mail, Globe, FileText, Calendar, Clock, AlertCircle } from 'lucide-react';

export function TripDetailsStep() {
  const { tripDetails, setTripDetails, nextStep, saveDraft, venueInfo, venueForms } = useTripCreationStore();
  
  const [formData, setFormData] = useState({
    name: tripDetails?.name || '',
    date: tripDetails?.date || '',
    time: tripDetails?.time || '',
    description: tripDetails?.description || '',
    specialRequirements: tripDetails?.specialRequirements || '',
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
  
  // Validate form
  // Validate form
    const validate = () => {
      const newErrors: Record<string, string> = {};

      if (!formData.name.trim()) {
        newErrors.name = 'Trip name is required';
      } else if (formData.name.trim().length < 3) {
        newErrors.name = 'Trip name must be at least 3 characters';
      }

      if (!formData.date) {
        newErrors.date = 'Trip date is required';
      } else {
        const selectedDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          newErrors.date = 'Trip date must be in the future';
        } else {
          // Check if date is at least 2 weeks in the future
          const twoWeeksFromNow = new Date(today);
          twoWeeksFromNow.setDate(today.getDate() + 14);

          if (selectedDate < twoWeeksFromNow) {
            newErrors.date = 'Trip date must be at least 2 weeks in the future';
          }
        }
      }

      if (!formData.time) {
        newErrors.time = 'Trip time is required';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Please fix the errors before continuing');
      return;
    }
    
    setTripDetails(formData);
    nextStep();
  };
  
  const handleSaveDraft = async () => {
    setTripDetails(formData);
    await saveDraft();
    toast.success('Draft saved successfully');
  };
  
  const handleChange = (field: string, value: string) => {
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

  // Handle field blur for validation
  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    // Validate field on blur
    const value = formData[field as keyof typeof formData] as string;
    const newErrors: Record<string, string> = {};
    
    if (field === 'name') {
      if (!value.trim()) {
        newErrors.name = 'Trip name is required';
      } else if (value.trim().length < 3) {
        newErrors.name = 'Trip name must be at least 3 characters';
      }
    } else if (field === 'date') {
      if (!value) {
        newErrors.date = 'Trip date is required';
      } else {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          newErrors.date = 'Trip date must be in the future';
        } else {
          const twoWeeksFromNow = new Date(today);
          twoWeeksFromNow.setDate(today.getDate() + 14);
          
          if (selectedDate < twoWeeksFromNow) {
            newErrors.date = 'Trip date must be at least 2 weeks in the future';
          }
        }
      }
    } else if (field === 'time') {
      if (!value) {
        newErrors.time = 'Trip time is required';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Venue Information (if pre-populated) */}
      {venueInfo && (
        <div className="bg-[#F5C518] border-2 border-[#0A0A0A] rounded-lg p-4 shadow-[4px_4px_0px_#0A0A0A] space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-[#0A0A0A] text-lg">{venueInfo.name}</h3>
              <div className="mt-2 space-y-1 text-sm text-[#0A0A0A]">
                {venueInfo.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {venueInfo.address.street}, {venueInfo.address.city}, {venueInfo.address.state} {venueInfo.address.zipCode}
                    </span>
                  </div>
                )}
                {venueInfo.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${venueInfo.contact_phone}`} className="hover:underline">
                      {venueInfo.contact_phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${venueInfo.contact_email}`} className="hover:underline">
                    {venueInfo.contact_email}
                  </a>
                </div>
                {venueInfo.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a
                      href={venueInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Visit website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Venue Forms */}
          {venueForms.length > 0 && (
            <div className="mt-4 pt-4 border-t-2 border-[#0A0A0A]">
              <h4 className="font-medium text-[#0A0A0A] mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Required Forms ({venueForms.length})
              </h4>
              <ul className="space-y-1">
                {venueForms.map((form) => (
                  <li key={form.id} className="text-sm text-[#0A0A0A] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#0A0A0A] rounded-full"></span>
                    <a
                      href={form.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline font-medium"
                    >
                      {form.name}
                      {form.required && <span className="text-red-600 ml-1">*</span>}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[#0A0A0A] mt-2 font-medium">
                These forms will be automatically included in the permission slips sent to parents.
              </p>
            </div>
          )}
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
      
      {/* Description */}
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
        />
        <p className="text-sm text-gray-600">
          Provide information that will help parents understand the trip
        </p>
      </div>
      
      {/* Special Requirements */}
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
        />
        <p className="text-sm text-gray-600">
          Any special requirements or accommodations needed for this trip
        </p>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveDraft}
          className="border-2 border-[#0A0A0A] hover:bg-gray-100"
        >
          Save as Draft
        </Button>
        
        <Button 
          type="submit"
          className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 font-semibold"
        >
          Next: Select Experience
        </Button>
      </div>
    </form>
  );
}
