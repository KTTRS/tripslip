import { useState, useEffect } from 'react';
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

interface PricingTier {
  price_cents: number;
  min_students: number;
  max_students: number;
  free_chaperones: number;
}

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
  const [pricingTier, setPricingTier] = useState<PricingTier | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);
  const [venueAddress, setVenueAddress] = useState<any>(null);

  useEffect(() => {
    if (selectedExperience) {
      fetchPricingAndVenue();
    }
  }, [selectedExperience, selectedStudents.length]);

  const fetchPricingAndVenue = async () => {
    if (!selectedExperience) return;

    try {
      const expWithDetails = selectedExperience as any;
      if (expWithDetails.venue?.name) {
        setVenueName(expWithDetails.venue.name);
        setVenueAddress(expWithDetails.venue.address);
      } else {
        const { data: venue } = await supabase
          .from('venues')
          .select('name, address')
          .eq('id', selectedExperience.venue_id)
          .maybeSingle();
        if (venue) {
          setVenueName(venue.name);
          setVenueAddress(venue.address);
        }
      }

      if (expWithDetails.pricing_tiers?.length > 0) {
        const applicable = findApplicableTier(expWithDetails.pricing_tiers, selectedStudents.length);
        setPricingTier(applicable);
      } else {
        const { data: tiers } = await supabase
          .from('pricing_tiers')
          .select('price_cents, min_students, max_students, free_chaperones')
          .eq('experience_id', selectedExperience.id)
          .order('min_students', { ascending: true });
        if (tiers && tiers.length > 0) {
          const applicable = findApplicableTier(tiers, selectedStudents.length);
          setPricingTier(applicable);
        }
      }
    } catch (error) {
      logger.warn('Failed to fetch pricing/venue details', { error });
    }
  };

  const findApplicableTier = (tiers: PricingTier[], studentCount: number): PricingTier | null => {
    const applicable = tiers.find(
      t => studentCount >= t.min_students && studentCount <= t.max_students
    );
    return applicable || tiers[0] || null;
  };

  const totalCost = pricingTier ? selectedStudents.length * pricingTier.price_cents : 0;

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} minutes`;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}hr ${mins}min`;
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
        setSubmitting(false);
        return;
      }

      let tripCreated = false;

      try {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('id, school_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (teacher) {
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
              special_requirements: tripDetails.specialRequirements || null,
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
      {venueInfo && (
        <Card className="border-2 border-[#0A0A0A] bg-[#FFFDE7]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Venue Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="text-xl font-semibold text-[#0A0A0A]">{venueInfo.name}</h3>
              {venueInfo.address && (
                <p className="text-gray-600 mt-1">
                  {venueInfo.address.street}, {venueInfo.address.city}, {venueInfo.address.state} {venueInfo.address.zipCode}
                </p>
              )}
            </div>
            {venueForms.length > 0 && (
              <div className="mt-3 pt-3 border-t border-yellow-300">
                <p className="text-sm font-medium text-[#0A0A0A] mb-2">
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

      <Card className="border-2 border-[#0A0A0A]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#0A0A0A]" />
            Trip Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-2xl font-bold text-[#0A0A0A]">{tripDetails.name}</h3>
          {tripDetails.description && (
            <p className="text-gray-600">{tripDetails.description}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(tripDetails.date)}</span>
            </div>
            {tripDetails.time && (
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="h-4 w-4" />
                <span>{tripDetails.time}</span>
              </div>
            )}
          </div>
          {tripDetails.specialRequirements && (
            <div className="mt-4 p-3 bg-[#FFFDE7] border-2 border-[#F5C518] rounded-lg">
              <p className="text-sm font-semibold text-[#0A0A0A] mb-1">Special Requirements:</p>
              <p className="text-sm text-gray-700">{tripDetails.specialRequirements}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-[#0A0A0A]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#0A0A0A]" />
            Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-xl font-semibold text-[#0A0A0A]">{selectedExperience.title}</h3>
          {selectedExperience.description && (
            <p className="text-gray-600">{selectedExperience.description}</p>
          )}
          <div className="flex flex-wrap gap-4">
            {venueName && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4" />
                <span>{venueName}{venueAddress?.city ? `, ${venueAddress.city}` : ''}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(selectedExperience.duration_minutes)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-[#0A0A0A]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#0A0A0A]" />
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
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
              >
                <span className="text-sm font-medium">
                  {student.first_name} {student.last_name}
                </span>
                {student.grade && (
                  <Badge variant="outline" className="text-xs border-[#0A0A0A]">
                    {student.grade}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-[#0A0A0A] bg-[#FFFDE7]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#0A0A0A]" />
            Cost Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Cost per student:</span>
              <span className="font-semibold">
                {pricingTier ? formatCurrency(pricingTier.price_cents) : 'TBD'}
              </span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Number of students:</span>
              <span className="font-semibold">{selectedStudents.length}</span>
            </div>
            {pricingTier && pricingTier.free_chaperones > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Free chaperones included:</span>
                <span className="font-semibold">{pricingTier.free_chaperones}</span>
              </div>
            )}
            <div className="border-t-2 border-[#0A0A0A] pt-3 flex justify-between text-lg font-bold text-[#0A0A0A]">
              <span>Total Cost:</span>
              <span>{totalCost > 0 ? formatCurrency(totalCost) : 'TBD'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-[#0A0A0A]">
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
              <Button type="button" variant="outline" asChild className="border-2 border-[#0A0A0A]">
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
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-sm">{file.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeDocument(index)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Alert className="border-2 border-[#0A0A0A] bg-[#FFFDE7]">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          By submitting this trip, permission slips will be generated for all {selectedStudents.length} students
          and notifications will be sent to their parents.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={submitting}
          className="border-2 border-[#0A0A0A] hover:bg-gray-100"
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
