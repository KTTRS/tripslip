import { useState } from 'react';
import { useTripCreationStore } from '../../stores/tripCreationStore';
import { Button } from '@tripslip/ui/components/button';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import { Textarea } from '@tripslip/ui/components/textarea';
import { toast } from 'sonner';

export function TripDetailsStep() {
  const { tripDetails, setTripDetails, nextStep, saveDraft } = useTripCreationStore();
  
  const [formData, setFormData] = useState({
    name: tripDetails?.name || '',
    date: tripDetails?.date || '',
    time: tripDetails?.time || '',
    description: tripDetails?.description || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Validate form
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Trip name is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Trip date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'Trip date must be in the future';
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
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Trip Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Trip Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Science Museum Field Trip"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name}</p>
        )}
      </div>
      
      {/* Trip Date */}
      <div className="space-y-2">
        <Label htmlFor="date">
          Trip Date <span className="text-red-500">*</span>
        </Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          className={errors.date ? 'border-red-500' : ''}
        />
        {errors.date && (
          <p className="text-sm text-red-500">{errors.date}</p>
        )}
      </div>
      
      {/* Trip Time */}
      <div className="space-y-2">
        <Label htmlFor="time">
          Trip Time <span className="text-red-500">*</span>
        </Label>
        <Input
          id="time"
          type="time"
          value={formData.time}
          onChange={(e) => handleChange('time', e.target.value)}
          className={errors.time ? 'border-red-500' : ''}
        />
        {errors.time && (
          <p className="text-sm text-red-500">{errors.time}</p>
        )}
      </div>
      
      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description (Optional)
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Add any additional details about the trip..."
          rows={4}
        />
        <p className="text-sm text-gray-500">
          Provide any additional information that will help parents understand the trip
        </p>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveDraft}
        >
          Save as Draft
        </Button>
        
        <Button type="submit">
          Next: Select Experience
        </Button>
      </div>
    </form>
  );
}
