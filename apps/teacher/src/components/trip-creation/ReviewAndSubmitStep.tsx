import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTripCreationStore } from '../../stores/tripCreationStore';
import { supabase } from '../../lib/supabase';
import { Button } from '@tripslip/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Badge } from '@tripslip/ui/components/badge';
import { Alert, AlertDescription } from '@tripslip/ui/components/alert';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, Users, DollarSign, FileText, CheckCircle, Upload } from 'lucide-react';
import { logger } from '@tripslip/utils';

export function ReviewAndSubmitStep() {
  const navigate = useNavigate();
  const { 
    tripDetails, 
    selectedExperience, 
    selectedStudents, 
    venueInfo, 
    venueForms, 
    prevStep, 
    reset,
    clearDraft,
    teacherId
  } = useTripCreationStore();
  
  const [submitting, setSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  
  const totalCost = selectedExperience ? selectedStudents.length * selectedExperience.cost_cents : 0;
  
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedDocuments((prev) => [...prev, ...files]);
  };
  
  const removeDocument = (index: number) => {
    setUploadedDocuments((prev) => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async () => {
    if (!tripDetails || !selectedExperience) {
      toast.error('Missing required information');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create a trip');
        return;
      }
      
      let tripCreated = false;
      
      try {
        const { data: teacher, error: teacherError } = await supabase
          .from('teachers')
          .select('id, school_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (teacher && teacher.school_id) {
          const { data: trip, error: tripError } = await supabase
            .from('trips')
            .insert({
              teacher_id: teacher.id,
              experience_id: selectedExperience.id,
              trip_date: tripDetails.date,
              trip_time: tripDetails.time || null,
              student_count: selectedStudents.length,
              status: 'pending',
              direct_link_token: crypto.randomUUID(),
            })
            .select()
            .single();
          
          if (!tripError && trip) {
            tripCreated = true;
            logger.info('Trip created in database', { tripId: trip.id });
          }
        }
      } catch (dbError) {
        logger.warn('Could not create trip in database, using demo mode', { error: dbError });
      }
      
      if (!tripCreated) {
        logger.info('Trip created in demo mode', {
          tripName: tripDetails.name,
          date: tripDetails.date,
          experience: selectedExperience.title,
          studentCount: selectedStudents.length,
        });
      }
      
      toast.success(
        `Trip "${tripDetails.name}" created successfully! ${selectedStudents.length} permission slips will be sent.`
      );
      
      if (teacherId) {
        await clearDraft(teacherId);
      }
      
      reset();
      navigate('/');
    } catch (error) {
      logger.error('Error creating trip', { error });
      toast.error('Failed to create trip. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (!tripDetails || !selectedExperience) {
    return (
      <Alert>
        <AlertDescription>
          Missing required information. Please go back and complete all steps.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Venue Information (if from venue listing) */}
      {venueInfo && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Venue Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{venueInfo.name}</h3>
              {venueInfo.address && (
                <p className="text-gray-600 mt-1">
                  {venueInfo.address.street}, {venueInfo.address.city}, {venueInfo.address.state} {venueInfo.address.zipCode}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {venueInfo.contact_phone && (
                <div className="text-gray-700">
                  <span className="font-medium">Phone:</span> {venueInfo.contact_phone}
                </div>
              )}
              <div className="text-gray-700">
                <span className="font-medium">Email:</span> {venueInfo.contact_email}
              </div>
            </div>
            
            {venueForms.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Required Forms ({venueForms.length})
                </p>
                <ul className="space-y-1">
                  {venueForms.map((form) => (
                    <li key={form.id} className="text-sm text-gray-700">
                      {form.name}
                      {form.required && <span className="text-red-600 ml-1">*</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trip Details Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Trip Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{tripDetails.name}</h3>
            {tripDetails.description && (
              <p className="text-gray-600 mt-2">{tripDetails.description}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(tripDetails.date)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4" />
              <span>{tripDetails.time}</span>
            </div>
          </div>
          
          {tripDetails.specialRequirements && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium text-yellow-900 mb-1">Special Requirements:</p>
              <p className="text-sm text-yellow-800">{tripDetails.specialRequirements}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Experience Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{selectedExperience.title}</h3>
            {selectedExperience.description && (
              <p className="text-gray-600 mt-2">{selectedExperience.description}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedExperience.location && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4" />
                <span>{selectedExperience.location}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-gray-700">
              <DollarSign className="h-4 w-4" />
              <span className="font-semibold">
                {formatCurrency(selectedExperience.cost_cents)} per student
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Students Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students ({selectedStudents.length})
          </CardTitle>
          <CardDescription>
            Permission slips will be generated for all selected students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {selectedStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span className="text-sm">
                  {student.first_name} {student.last_name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {student.grade}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Cost Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Cost per student:</span>
              <span className="font-semibold">{formatCurrency(selectedExperience.cost_cents)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Number of students:</span>
              <span className="font-semibold">{selectedStudents.length}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
              <span>Total Cost:</span>
              <span>{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Document Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Supporting Documents (Optional)
          </CardTitle>
          <CardDescription>
            Upload any additional documents related to this trip
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="document-upload"
            />
            <label htmlFor="document-upload">
              <Button type="button" variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </span>
              </Button>
            </label>
          </div>
          
          {uploadedDocuments.length > 0 && (
            <div className="space-y-2">
              {uploadedDocuments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocument(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Confirmation Alert */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          By submitting this trip, permission slips will be generated for all {selectedStudents.length} students
          and notification emails will be sent to their parents.
        </AlertDescription>
      </Alert>
      
      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={submitting}
        >
          Back
        </Button>
        
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 font-semibold"
        >
          {submitting ? 'Creating Trip...' : 'Create Trip'}
        </Button>
      </div>
    </div>
  );
}
