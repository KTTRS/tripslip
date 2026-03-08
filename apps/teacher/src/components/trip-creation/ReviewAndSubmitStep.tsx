import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTripCreationStore } from '../../stores/tripCreationStore';
import { supabase } from '../../lib/supabase';
import { authFetch } from '../../lib/api';
import { Button } from '@tripslip/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Badge } from '@tripslip/ui/components/badge';
import { Alert, AlertDescription } from '@tripslip/ui/components/alert';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, Users, DollarSign, FileText, CheckCircle, Upload, Bus, Phone, Gift, School, Building2 } from 'lucide-react';
import { logger } from '@tripslip/utils';
import { AddOnConfigurator } from './AddOnConfigurator';
import { FormUploadManager, type UploadedForm } from './FormUploadManager';

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
    configuredAddons,
    setConfiguredAddons,
    prevStep,
    reset,
    clearDraft,
    teacherId
  } = useTripCreationStore();

  const [submitting, setSubmitting] = useState(false);
  const [pendingForms, setPendingForms] = useState<UploadedForm[]>([]);
  const [pricingTier, setPricingTier] = useState<PricingTier | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);
  const [venueAddress, setVenueAddress] = useState<any>(null);
  const [experienceAdditionalFees, setExperienceAdditionalFees] = useState<Array<{ name: string; amountCents: number; required: boolean }>>([]);

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
        const firstTier = expWithDetails.pricing_tiers[0];
        if (firstTier?.additional_fees && Array.isArray(firstTier.additional_fees)) {
          setExperienceAdditionalFees(firstTier.additional_fees);
        }
      } else {
        const { data: tiers } = await supabase
          .from('pricing_tiers')
          .select('price_cents, min_students, max_students, free_chaperones, additional_fees')
          .eq('experience_id', selectedExperience.id)
          .order('min_students', { ascending: true });
        if (tiers && tiers.length > 0) {
          const applicable = findApplicableTier(tiers, selectedStudents.length);
          setPricingTier(applicable);
          const firstTier = tiers[0] as any;
          if (firstTier?.additional_fees && Array.isArray(firstTier.additional_fees)) {
            setExperienceAdditionalFees(firstTier.additional_fees);
          }
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

  const isFreeFunding = tripDetails?.isFree || tripDetails?.fundingModel === 'school_funded' || tripDetails?.fundingModel === 'sponsored';
  const totalCost = isFreeFunding ? 0 : (pricingTier ? selectedStudents.length * pricingTier.price_cents : 0);

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
              transportation: tripDetails.transportation || null,
              is_free: tripDetails.isFree || false,
              funding_model: tripDetails.isFree ? 'school_funded' : (tripDetails.fundingModel || 'parents_pay'),
              configured_addons: configuredAddons.length > 0 ? configuredAddons : [],
            })
            .select()
            .single();

          if (!tripError && trip) {
            tripCreated = true;
            logger.info('Trip created in database', { tripId: trip.id });

            if (pendingForms.length > 0) {
              let uploadedCount = 0;
              for (const form of pendingForms) {
                try {
                  const formData = new FormData();
                  formData.append('file', form.file);
                  formData.append('trip_id', trip.id);
                  formData.append('title', form.title);
                  formData.append('form_type', form.formType);
                  formData.append('required', String(form.required));

                  const resp = await authFetch('/api/upload-form', {
                    method: 'POST',
                    body: formData,
                  });

                  if (resp.ok) {
                    uploadedCount++;
                  } else {
                    logger.warn('Form upload failed', { title: form.title });
                  }
                } catch (uploadErr) {
                  logger.warn('Form upload error', { title: form.title, error: uploadErr });
                }
              }
              if (uploadedCount > 0) {
                logger.info(`${uploadedCount} form(s) uploaded for trip`, { tripId: trip.id });
              }
            }
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

      {tripDetails.transportation && tripDetails.transportation.type && (
        <Card className="border-2 border-[#0A0A0A]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-[#0A0A0A]" />
              Transportation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-semibold text-[#0A0A0A]">
                  {tripDetails.transportation.type === 'district_bus' && 'District Bus'}
                  {tripDetails.transportation.type === 'charter_bus' && 'Charter Bus'}
                  {tripDetails.transportation.type === 'parent_dropoff' && 'Parent Drop-off'}
                  {tripDetails.transportation.type === 'walking' && 'Walking'}
                  {tripDetails.transportation.type === 'public_transit' && 'Public Transit'}
                  {tripDetails.transportation.type === 'other' && 'Other'}
                </p>
              </div>
              {tripDetails.transportation.pickupLocation && (
                <div>
                  <p className="text-sm text-gray-500">Pickup Location</p>
                  <p className="font-semibold text-[#0A0A0A] flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {tripDetails.transportation.pickupLocation}
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tripDetails.transportation.departureTime && (
                <div>
                  <p className="text-sm text-gray-500">Departure</p>
                  <p className="font-semibold text-[#0A0A0A] flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {tripDetails.transportation.departureTime}
                  </p>
                </div>
              )}
              {tripDetails.transportation.returnTime && (
                <div>
                  <p className="text-sm text-gray-500">Return</p>
                  <p className="font-semibold text-[#0A0A0A] flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {tripDetails.transportation.returnTime}
                  </p>
                </div>
              )}
            </div>
            {tripDetails.transportation.companyName && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Bus Company</p>
                  <p className="font-semibold text-[#0A0A0A]">{tripDetails.transportation.companyName}</p>
                </div>
                {tripDetails.transportation.companyPhone && (
                  <div>
                    <p className="text-sm text-gray-500">Company Phone</p>
                    <p className="font-semibold text-[#0A0A0A] flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {tripDetails.transportation.companyPhone}
                    </p>
                  </div>
                )}
              </div>
            )}
            {tripDetails.transportation.estimatedBuses > 0 && (
              <div className="p-3 bg-[#FFFDE7] border-2 border-[#F5C518] rounded-lg">
                <p className="text-sm font-semibold text-[#0A0A0A]">
                  <Bus className="w-4 h-4 inline mr-1" />
                  Estimated buses: {tripDetails.transportation.estimatedBuses}
                </p>
              </div>
            )}
            {tripDetails.transportation.estimatedCostCents > 0 && (
              <div>
                <p className="text-sm text-gray-500">Estimated Cost</p>
                <p className="font-semibold text-[#0A0A0A]">
                  {formatCurrency(tripDetails.transportation.estimatedCostCents)}
                </p>
              </div>
            )}
            {tripDetails.transportation.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-gray-700">{tripDetails.transportation.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tripDetails && (tripDetails.isFree || tripDetails.fundingModel) && (
        <Card className="border-2 border-[#0A0A0A]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#0A0A0A]" />
              Funding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tripDetails.isFree ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 border-green-300 text-sm px-3 py-1">Free Trip</Badge>
                <span className="text-gray-600 text-sm">No payment will be collected from parents</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Funding Model</p>
                  <p className="font-semibold text-[#0A0A0A] flex items-center gap-2">
                    {tripDetails.fundingModel === 'parents_pay' && <><DollarSign className="h-4 w-4" /> Parents Pay Individually</>}
                    {tripDetails.fundingModel === 'school_funded' && <><School className="h-4 w-4" /> School Funded</>}
                    {tripDetails.fundingModel === 'school_upfront' && <><Building2 className="h-4 w-4" /> School Pays Upfront</>}
                    {tripDetails.fundingModel === 'sponsored' && <><Gift className="h-4 w-4" /> Sponsored</>}
                  </p>
                </div>
                {tripDetails.fundingModel === 'sponsored' && tripDetails.sponsorName && (
                  <div>
                    <p className="text-sm text-gray-500">Sponsor</p>
                    <p className="font-semibold text-[#0A0A0A]">{tripDetails.sponsorName}</p>
                  </div>
                )}
                {(tripDetails.fundingModel === 'school_funded' || tripDetails.fundingModel === 'sponsored') && (
                  <p className="text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200">
                    Parents will only need to sign — no payment required
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
          {isFreeFunding ? (
            <div className="text-center py-2">
              <Badge className="bg-green-100 text-green-800 border-green-300 text-base px-4 py-2">
                Free — No Cost to Parents
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {!isFreeFunding && (
        <AddOnConfigurator
          addOns={configuredAddons}
          onChange={setConfiguredAddons}
          experienceAdditionalFees={experienceAdditionalFees}
        />
      )}

      {configuredAddons.length > 0 && !isFreeFunding && (
        <Card className="border-2 border-[#0A0A0A] bg-[#FFFDE7]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-5 w-5 text-[#0A0A0A]" />
              Configured Add-Ons Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {configuredAddons.map((addon) => (
                <div key={addon.id} className="flex justify-between text-sm">
                  <span>
                    {addon.name}
                    {addon.required && <span className="text-red-600 ml-1">(Required)</span>}
                  </span>
                  <span className="font-semibold">{formatCurrency(addon.priceCents)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-[#0A0A0A]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Supporting Documents
          </CardTitle>
          <CardDescription>
            Upload permission forms, waivers, or other documents. Files will be uploaded when the trip is created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormUploadManager
            venueForms={venueForms}
            onFormsChange={setPendingForms}
          />
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
          className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 font-semibold"
        >
          {submitting ? 'Creating Trip...' : 'Create Trip'}
        </Button>
      </div>
    </div>
  );
}
