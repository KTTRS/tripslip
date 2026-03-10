import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Layout } from '../components/Layout';
import { PhotoUpload } from '../components/PhotoUpload';
import { PricingConfiguration, PricingTier } from '../components/PricingConfiguration';
import { AvailabilityConfiguration, AvailabilitySlot, BlackoutDate } from '../components/AvailabilityConfiguration';
import { Button } from '@tripslip/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import { Textarea } from '@tripslip/ui/components/textarea';
import { Alert, AlertDescription } from '@tripslip/ui/components/alert';
import { supabase } from '../lib/supabase';
import { useVenue } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

interface ExperienceFormData {
  title: string;
  description: string;
  description_es: string;
  duration_minutes: number;
  capacity: number;
  min_students: number;
  max_students: number;
  grade_levels: string;
  subjects: string;
}

interface Photo {
  id: string;
  url: string;
  file?: File;
  order: number;
}

export default function ExperienceEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { venueId: contextVenueId } = useVenue();
  const [loading, setLoading] = useState(false);
  const venueId = contextVenueId;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ExperienceFormData>({
    defaultValues: {
      title: '',
      description: '',
      description_es: '',
      duration_minutes: 60,
      capacity: 30,
      min_students: 10,
      max_students: 30,
      grade_levels: '',
      subjects: ''
    }
  });
  
  const minStudents = watch('min_students');
  const maxStudents = watch('max_students');
  
  useEffect(() => {
    if (id) {
      loadExperience();
    }
  }, [id]);
  
  const loadExperience = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setValue('title', data.title);
        setValue('description', data.description || '');
        setValue('duration_minutes', data.duration_minutes);
        setValue('capacity', data.capacity);
        setValue('min_students', data.min_students || 10);
        setValue('max_students', data.max_students || 30);
        setValue('grade_levels', (data.grade_levels || []).join(', '));
        setValue('subjects', (data.subjects || []).join(', '));
      }
      
      // Load pricing tiers
      const { data: pricingData, error: pricingError } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('experience_id', id);
      
      if (!pricingError && pricingData) {
        setPricingTiers(pricingData.map(tier => ({
          ...tier,
          type: 'per_student' as const // Default type, adjust based on your logic
        })));
      }
      
      // Load availability slots
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('experience_id', id);
      
      if (!availabilityError && availabilityData) {
        // Group by day_of_week and create slots
        // Note: This is simplified - adjust based on your actual schema
        setAvailabilitySlots(availabilityData.map(slot => ({
          id: slot.id,
          day_of_week: new Date(slot.available_date).getDay(),
          start_time: slot.start_time || '09:00',
          end_time: slot.end_time || '15:00',
          capacity: slot.capacity
        })));
      }
    } catch (error) {
      console.error('Error loading experience:', error);
      toast.error('Failed to load experience');
    } finally {
      setLoading(false);
    }
  };
  
  const onSubmit = async (data: ExperienceFormData) => {
    if (!venueId) {
      toast.error('Venue ID not found');
      return;
    }
    
    // Validate min/max students
    if (data.min_students > data.max_students) {
      toast.error('Minimum students cannot be greater than maximum students');
      return;
    }
    
    try {
      setLoading(true);
      
      const experienceData = {
        venue_id: venueId,
        title: data.title,
        description: data.description,
        duration_minutes: data.duration_minutes,
        capacity: data.capacity,
        min_students: data.min_students,
        max_students: data.max_students,
        grade_levels: data.grade_levels.split(',').map(g => g.trim()).filter(Boolean),
        subjects: data.subjects.split(',').map(s => s.trim()).filter(Boolean),
        published: false,
        updated_at: new Date().toISOString()
      };
      
      let experienceId = id;
      
      if (id) {
        // Update existing experience
        const { error } = await supabase
          .from('experiences')
          .update(experienceData)
          .eq('id', id);
        
        if (error) throw error;
      } else {
        // Create new experience
        const { data: newExperience, error } = await supabase
          .from('experiences')
          .insert(experienceData)
          .select()
          .single();
        
        if (error) throw error;
        experienceId = newExperience.id;
      }
      
      // Save pricing tiers
      if (experienceId && pricingTiers.length > 0) {
        // Delete existing tiers
        await supabase
          .from('pricing_tiers')
          .delete()
          .eq('experience_id', experienceId);
        
        // Insert new tiers
        const tiersToInsert = pricingTiers.map(tier => ({
          experience_id: experienceId,
          min_students: tier.min_students,
          max_students: tier.max_students,
          price_cents: tier.price_cents,
          free_chaperones: tier.free_chaperones
        }));
        
        const { error: tierError } = await supabase
          .from('pricing_tiers')
          .insert(tiersToInsert);
        
        if (tierError) throw tierError;
      }
      
      // Note: Availability slots would need a more complex implementation
      // as the current schema uses specific dates rather than recurring patterns
      // This is a simplified version
      
      toast.success(id ? 'Experience updated successfully' : 'Experience created successfully');
      navigate('/experiences');
    } catch (error) {
      console.error('Error saving experience:', error);
      toast.error('Failed to save experience');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && id) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading experience...</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/experiences')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold">
              {id ? 'Edit Experience' : 'Create Experience'}
            </h2>
            <p className="text-gray-600 mt-1">
              {id ? 'Update your experience details' : 'Add a new educational experience'}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide the essential details about your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Experience Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  placeholder="e.g., Interactive Museum Tour"
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description (English) <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  {...register('description', { required: 'Description is required' })}
                  placeholder="Describe what students will learn and experience..."
                  rows={5}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description_es">
                  Description (Spanish)
                </Label>
                <Textarea
                  id="description_es"
                  {...register('description_es')}
                  placeholder="Describe lo que los estudiantes aprenderán y experimentarán..."
                  rows={5}
                />
                <p className="text-sm text-gray-500">
                  Optional: Provide a Spanish translation for bilingual support
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    {...register('duration_minutes', {
                      required: 'Duration is required',
                      min: { value: 15, message: 'Minimum 15 minutes' },
                      valueAsNumber: true
                    })}
                  />
                  {errors.duration_minutes && (
                    <p className="text-sm text-red-500">{errors.duration_minutes.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="capacity">
                    Total Capacity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    {...register('capacity', {
                      required: 'Capacity is required',
                      min: { value: 1, message: 'Minimum 1 student' },
                      valueAsNumber: true
                    })}
                  />
                  {errors.capacity && (
                    <p className="text-sm text-red-500">{errors.capacity.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Capacity Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Student Capacity</CardTitle>
              <CardDescription>
                Set minimum and maximum student limits for bookings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_students">
                    Minimum Students <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="min_students"
                    type="number"
                    {...register('min_students', {
                      required: 'Minimum students is required',
                      min: { value: 1, message: 'Minimum 1 student' },
                      valueAsNumber: true
                    })}
                  />
                  {errors.min_students && (
                    <p className="text-sm text-red-500">{errors.min_students.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_students">
                    Maximum Students <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="max_students"
                    type="number"
                    {...register('max_students', {
                      required: 'Maximum students is required',
                      min: { value: 1, message: 'Minimum 1 student' },
                      valueAsNumber: true
                    })}
                  />
                  {errors.max_students && (
                    <p className="text-sm text-red-500">{errors.max_students.message}</p>
                  )}
                </div>
              </div>
              
              {minStudents > maxStudents && (
                <Alert variant="error">
                  <AlertDescription>
                    Minimum students cannot be greater than maximum students
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          {/* Educational Details */}
          <Card>
            <CardHeader>
              <CardTitle>Educational Details</CardTitle>
              <CardDescription>
                Help teachers find your experience by grade level and subject
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="grade_levels">
                  Grade Levels (comma-separated)
                </Label>
                <Input
                  id="grade_levels"
                  {...register('grade_levels')}
                  placeholder="e.g., K, 1, 2, 3, 4, 5"
                />
                <p className="text-sm text-gray-500">
                  Enter grade levels separated by commas
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subjects">
                  Subjects (comma-separated)
                </Label>
                <Input
                  id="subjects"
                  {...register('subjects')}
                  placeholder="e.g., Science, History, Art"
                />
                <p className="text-sm text-gray-500">
                  Enter subjects separated by commas
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Photo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                Upload photos to showcase your experience (drag to reorder)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoUpload
                experienceId={id}
                photos={photos}
                onChange={setPhotos}
              />
            </CardContent>
          </Card>
          
          {/* Pricing Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>
                Set pricing tiers for different group sizes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PricingConfiguration
                pricingTiers={pricingTiers}
                onChange={setPricingTiers}
              />
            </CardContent>
          </Card>
          
          {/* Availability Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
              <CardDescription>
                Configure available days, time slots, and blackout dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvailabilityConfiguration
                availabilitySlots={availabilitySlots}
                blackoutDates={blackoutDates}
                onSlotsChange={setAvailabilitySlots}
                onBlackoutDatesChange={setBlackoutDates}
              />
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/experiences')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : id ? 'Update Experience' : 'Create Experience'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
