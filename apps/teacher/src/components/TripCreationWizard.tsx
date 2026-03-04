import { useEffect } from 'react';
import { useTripCreationStore } from '../stores/tripCreationStore';
import { useAutoSave } from '../hooks/useAutoSave';
import { useAuth } from '@tripslip/auth';
import { TripDetailsStep } from './trip-creation/TripDetailsStep';
import { ExperienceSelectionStep } from './trip-creation/ExperienceSelectionStep';
import { StudentSelectionStep } from './trip-creation/StudentSelectionStep';
import { ReviewAndSubmitStep } from './trip-creation/ReviewAndSubmitStep';
import { Progress } from '@tripslip/ui/components/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Button } from '@tripslip/ui/components/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  createVenueProfileService,
  createExperienceService,
} from '@tripslip/database';
import { supabase } from '../lib/supabase';

const STEPS = [
  { number: 1, title: 'Trip Details', description: 'Basic information about the trip' },
  { number: 2, title: 'Select Experience', description: 'Choose from available experiences' },
  { number: 3, title: 'Add Students', description: 'Select students for this trip' },
  { number: 4, title: 'Review & Submit', description: 'Review and create the trip' },
];

export function TripCreationWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { 
    currentStep, 
    prevStep, 
    reset, 
    prePopulateFromVenue, 
    venueInfo,
    setTeacherId,
    loadDraft,
    lastSaved,
    isDraft
  } = useTripCreationStore();
  
  // Enable auto-save
  useAutoSave(30000); // Auto-save every 30 seconds
  
  const currentStepInfo = STEPS[currentStep - 1];
  const progress = (currentStep / STEPS.length) * 100;
  
  // Load teacher ID and draft on mount
  useEffect(() => {
    const loadTeacherData = async () => {
      if (!user) return;
      
      try {
        // Fetch teacher profile
        const { data: teacher } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (teacher) {
          setTeacherId(teacher.id);
          // Try to load existing draft
          await loadDraft(teacher.id);
        }
      } catch (error) {
        console.error('Error loading teacher data:', error);
      }
    };
    
    loadTeacherData();
  }, [user, setTeacherId, loadDraft]);
  
  // Load venue and experience data from URL parameters
  useEffect(() => {
    const venueId = searchParams.get('venueId');
    const experienceId = searchParams.get('experienceId');
    
    if (venueId && experienceId && !venueInfo) {
      loadVenueAndExperience(venueId, experienceId);
    }
  }, [searchParams, venueInfo]);
  
  const loadVenueAndExperience = async (venueId: string, experienceId: string) => {
    try {
      const venueService = createVenueProfileService(supabase);
      const experienceService = createExperienceService(supabase);
      
      // Load venue profile
      const { data: venue, error: venueError } = await venueService.getVenueProfile(venueId);
      if (venueError) throw venueError;
      
      // Load experience
      const experience = await experienceService.getExperience(experienceId);
      if (!experience) throw new Error('Experience not found');
      
      // Load venue forms associated with the experience
      const { data: forms } = await supabase
        .from('experience_forms')
        .select(`
          form:venue_forms (
            id,
            name,
            category,
            file_url,
            required
          )
        `)
        .eq('experience_id', experienceId);
      
      const venueForms = forms?.map((f: any) => f.form).filter(Boolean) || [];
      
      // Pre-populate the store
      prePopulateFromVenue(
        {
          id: venue.id,
          name: venue.name,
          address: venue.address,
          contact_email: venue.contact_email,
          contact_phone: venue.contact_phone,
          website: venue.website,
        },
        experience,
        venueForms
      );
    } catch (error) {
      console.error('Error loading venue/experience:', error);
      // Continue with normal flow if loading fails
    }
  };
  
  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      reset();
      navigate('/');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => currentStep === 1 ? handleCancel() : prevStep()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Trip
          </h1>
          <p className="text-gray-600">
            Step {currentStep} of {STEPS.length}: {currentStepInfo.title}
          </p>
          
          {/* Draft indicator */}
          {isDraft && lastSaved && (
            <p className="text-sm text-gray-500 mt-2">
              Draft saved at {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className={`text-sm ${
                  step.number === currentStep
                    ? 'text-blue-600 font-semibold'
                    : step.number < currentStep
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              >
                {step.number}. {step.title}
              </div>
            ))}
          </div>
        </div>
        
        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{currentStepInfo.title}</CardTitle>
            <p className="text-sm text-gray-600">{currentStepInfo.description}</p>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && <TripDetailsStep />}
            {currentStep === 2 && <ExperienceSelectionStep />}
            {currentStep === 3 && <StudentSelectionStep />}
            {currentStep === 4 && <ReviewAndSubmitStep />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
