import { useTripCreationStore } from '../stores/tripCreationStore';
import { TripDetailsStep } from './trip-creation/TripDetailsStep';
import { ExperienceSelectionStep } from './trip-creation/ExperienceSelectionStep';
import { StudentSelectionStep } from './trip-creation/StudentSelectionStep';
import { ReviewAndSubmitStep } from './trip-creation/ReviewAndSubmitStep';
import { Progress } from '@tripslip/ui/components/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Button } from '@tripslip/ui/components/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

const STEPS = [
  { number: 1, title: 'Trip Details', description: 'Basic information about the trip' },
  { number: 2, title: 'Select Experience', description: 'Choose from available experiences' },
  { number: 3, title: 'Add Students', description: 'Select students for this trip' },
  { number: 4, title: 'Review & Submit', description: 'Review and create the trip' },
];

export function TripCreationWizard() {
  const navigate = useNavigate();
  const { currentStep, prevStep, reset } = useTripCreationStore();
  
  const currentStepInfo = STEPS[currentStep - 1];
  const progress = (currentStep / STEPS.length) * 100;
  
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
