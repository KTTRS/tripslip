import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTripCreationStore } from '../../stores/tripCreationStore';
import { createSupabaseClient } from '@tripslip/database';
import { Button } from '@tripslip/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Badge } from '@tripslip/ui/components/badge';
import { Alert, AlertDescription } from '@tripslip/ui/components/alert';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, Users, DollarSign, FileText, CheckCircle, Upload } from 'lucide-react';

const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function ReviewAndSubmitStep() {
  const navigate = useNavigate();
  const { tripDetails, selectedExperience, selectedStudents, prevStep, reset } = useTripCreationStore();
  
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
  
  const uploadDocuments = async (tripId: string) => {
    const uploadPromises = uploadedDocuments.map(async (file) => {
      const fileName = `${tripId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('documents')
        .upload(fileName, file);
      
      if (error) throw error;
      return fileName;
    });
    
    return Promise.all(uploadPromises);
  };
  
  const generatePermissionSlips = async (invitationId: string) => {
    // Create permission slips for each student
    const slips = selectedStudents.map((student) => ({
      student_id: student.id,
      invitation_id: invitationId,
      token: crypto.randomUUID(),
      status: 'pending',
    }));
    
    const { data, error } = await supabase
      .from('permission_slips')
      .insert(slips)
      .select();
    
    if (error) throw error;
    return data;
  };
  
  const sendNotificationEmails = async (invitationId: string) => {
    // TODO: Call Edge Function to send emails to parents
    // For now, just log
    console.log('Sending notification emails for invitation:', invitationId);
    
    // In production, this would call:
    // await supabase.functions.invoke('send-permission-slip-emails', {
    //   body: { invitationId }
    // });
  };
  
  const handleSubmit = async () => {
    if (!tripDetails || !selectedExperience) {
      toast.error('Missing required information');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Get current user (teacher)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create a trip');
        return;
      }
      
      // Create invitation (trip)
      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .insert({
          teacher: tripDetails.name, // Using trip name as teacher name for now
          teacher_email: user.email || '',
          school: 'Default School', // TODO: Get from teacher profile
          experience_id: selectedExperience.id,
          status: 'active',
        })
        .select()
        .single();
      
      if (invitationError) throw invitationError;
      
      // Upload documents if any
      if (uploadedDocuments.length > 0) {
        await uploadDocuments(invitation.id);
      }
      
      // Generate permission slips for each student
      await generatePermissionSlips(invitation.id);
      
      // Send notification emails to parents
      await sendNotificationEmails(invitation.id);
      
      toast.success('Trip created successfully!');
      
      // Reset form and navigate to dashboard
      reset();
      navigate('/');
    } catch (error) {
      console.error('Error creating trip:', error);
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
        >
          {submitting ? 'Creating Trip...' : 'Create Trip'}
        </Button>
      </div>
    </div>
  );
}
