import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '@tripslip/ui/components/button';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import { Card, CardContent, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Switch } from '@tripslip/ui/components/switch';
import { toast } from 'sonner';
import { MapPin, Building2, Phone, Mail, Globe, Clock, DollarSign, ArrowLeft, Loader2 } from 'lucide-react';

interface CustomVenueFormProps {
  onCreated: (experience: any) => void;
  onCancel: () => void;
}

export function CustomVenueForm({ onCreated, onCancel }: CustomVenueFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [isFree, setIsFree] = useState(false);

  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueCity, setVenueCity] = useState('');
  const [venueState, setVenueState] = useState('');
  const [venueZip, setVenueZip] = useState('');
  const [venuePhone, setVenuePhone] = useState('');
  const [venueEmail, setVenueEmail] = useState('');
  const [venueWebsite, setVenueWebsite] = useState('');
  const [venueDescription, setVenueDescription] = useState('');

  const [expName, setExpName] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expDuration, setExpDuration] = useState('60');
  const [expGradeLevels, setExpGradeLevels] = useState('');
  const [costPerStudent, setCostPerStudent] = useState('');

  const handleSubmit = async () => {
    if (!venueName.trim()) {
      toast.error('Venue name is required');
      return;
    }
    if (!venueAddress.trim()) {
      toast.error('Venue address is required');
      return;
    }
    if (!expName.trim()) {
      toast.error('Experience name is required');
      return;
    }

    const duration = parseInt(expDuration) || 60;
    if (duration < 1 || duration > 1440) {
      toast.error('Duration must be between 1 and 1440 minutes');
      return;
    }

    const priceCents = isFree ? 0 : Math.round((parseFloat(costPerStudent) || 0) * 100);
    if (!isFree && priceCents < 0) {
      toast.error('Cost per student cannot be negative');
      return;
    }

    setSubmitting(true);

    try {
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .insert({
          name: venueName.trim(),
          address: {
            street: venueAddress.trim(),
            city: venueCity.trim(),
            state: venueState.trim(),
            zip: venueZip.trim(),
          },
          contact_phone: venuePhone.trim() || null,
          contact_email: venueEmail.trim() || 'noreply@tripslip.co',
          website: venueWebsite.trim() || null,
          description: venueDescription.trim() || null,
          verified: false,
        })
        .select()
        .single();

      if (venueError) throw venueError;

      const gradeLevels = expGradeLevels
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);

      const { data: expData, error: expError } = await supabase
        .from('experiences')
        .insert({
          venue_id: venueData.id,
          title: expName.trim(),
          description: expDescription.trim() || null,
          duration_minutes: duration,
          capacity: 200,
          min_students: 1,
          max_students: 200,
          grade_levels: gradeLevels.length > 0 ? gradeLevels : null,
          active: true,
          published: true,
        })
        .select('*, venue:venues(name, address)')
        .single();

      if (expError) throw expError;

      const { error: pricingError } = await supabase.from('pricing_tiers').insert({
        experience_id: expData.id,
        price_cents: priceCents,
        min_students: 1,
        max_students: 200,
      });

      if (pricingError) throw pricingError;

      const experienceWithPricing = {
        ...expData,
        pricing_tiers: [{ price_cents: priceCents, min_students: 1, max_students: 200 }],
      };

      toast.success('Custom destination added!');
      onCreated(experienceWithPricing);
    } catch (error: any) {
      console.error('Error creating custom venue:', error);
      toast.error(error?.message || 'Failed to create custom destination');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        className="text-gray-600 hover:text-[#0A0A0A] -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to experience list
      </Button>

      <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#F5C518]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0A0A0A]">
            <Building2 className="h-5 w-5" />
            Venue Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venueName" className="text-sm font-semibold">
              Venue Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="venueName"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g. City Science Museum"
              className="border-2 border-[#0A0A0A] focus:ring-[#F5C518] focus:border-[#F5C518]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venueAddress" className="text-sm font-semibold">
              Street Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="venueAddress"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="123 Main Street"
                className="pl-10 border-2 border-[#0A0A0A] focus:ring-[#F5C518] focus:border-[#F5C518]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="venueCity" className="text-sm font-semibold">City</Label>
              <Input
                id="venueCity"
                value={venueCity}
                onChange={(e) => setVenueCity(e.target.value)}
                placeholder="Chicago"
                className="border-2 border-[#0A0A0A] focus:ring-[#F5C518] focus:border-[#F5C518]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueState" className="text-sm font-semibold">State</Label>
              <Input
                id="venueState"
                value={venueState}
                onChange={(e) => setVenueState(e.target.value)}
                placeholder="IL"
                className="border-2 border-[#0A0A0A] focus:ring-[#F5C518] focus:border-[#F5C518]"
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="venueZip" className="text-sm font-semibold">ZIP</Label>
              <Input
                id="venueZip"
                value={venueZip}
                onChange={(e) => setVenueZip(e.target.value)}
                placeholder="60601"
                className="border-2 border-[#0A0A0A] focus:ring-[#F5C518] focus:border-[#F5C518]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="venuePhone" className="text-sm font-semibold flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> Phone
              </Label>
              <Input
                id="venuePhone"
                value={venuePhone}
                onChange={(e) => setVenuePhone(e.target.value)}
                placeholder="(312) 555-0100"
                className="border-2 border-[#0A0A0A] focus:ring-[#F5C518] focus:border-[#F5C518]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueEmail" className="text-sm font-semibold flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Email
              </Label>
              <Input
                id="venueEmail"
                type="email"
                value={venueEmail}
                onChange={(e) => setVenueEmail(e.target.value)}
                placeholder="info@venue.org"
                className="border-2 border-[#0A0A0A] focus:ring-[#F5C518] focus:border-[#F5C518]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueWebsite" className="text-sm font-semibold flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> Website
              </Label>
              <Input
                id="venueWebsite"
                value={venueWebsite}
                onChange={(e) => setVenueWebsite(e.target.value)}
                placeholder="https://venue.org"
                className="border-2 border-[#0A0A0A] focus:ring-[#F5C518] focus:border-[#F5C518]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venueDescription" className="text-sm font-semibold">Description</Label>
            <textarea
              id="venueDescription"
              value={venueDescription}
              onChange={(e) => setVenueDescription(e.target.value)}
              placeholder="Brief description of the venue..."
              rows={2}
              className="w-full rounded-md border-2 border-[#0A0A0A] px-3 py-2 text-sm focus:ring-[#F5C518] focus:border-[#F5C518] focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#F5C518]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0A0A0A]">
            <Clock className="h-5 w-5" />
            Experience Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expName" className="text-sm font-semibold">
              Experience Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="expName"
              value={expName}
              onChange={(e) => setExpName(e.target.value)}
              placeholder="e.g. Guided Museum Tour"
              className="border-2 border-[#0A0A0A] focus:ring-[#F5C518] focus:border-[#F5C518]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expDescription" className="text-sm font-semibold">Description</Label>
            <textarea
              id="expDescription"
              value={expDescription}
              onChange={(e) => setExpDescription(e.target.value)}
              placeholder="What will students experience?"
              rows={2}
              className="w-full rounded-md border-2 border-[#0A0A0A] px-3 py-2 text-sm focus:ring-[#F5C518] focus:border-[#F5C518] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expDuration" className="text-sm font-semibold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Duration (minutes)
              </Label>
              <Input
                id="expDuration"
                type="number"
                min="1"
                max="1440"
                value={expDuration}
                onChange={(e) => setExpDuration(e.target.value)}
                className="border-2 border-[#0A0A0A] focus:ring-[#F5C518] focus:border-[#F5C518]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expGradeLevels" className="text-sm font-semibold">
                Grade Levels
              </Label>
              <Input
                id="expGradeLevels"
                value={expGradeLevels}
                onChange={(e) => setExpGradeLevels(e.target.value)}
                placeholder="K, 1st, 2nd, 3rd..."
                className="border-2 border-[#0A0A0A] focus:ring-[#F5C518] focus:border-[#F5C518]"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border-2 border-[#0A0A0A] p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <Label htmlFor="isFree" className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Free Trip
              </Label>
              <Switch
                id="isFree"
                checked={isFree}
                onCheckedChange={setIsFree}
              />
            </div>
            {isFree ? (
              <p className="text-sm text-green-700 font-medium">No cost — parents will only need to sign the permission slip.</p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="costPerStudent" className="text-sm font-semibold">
                  Cost per Student ($)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="costPerStudent"
                    type="number"
                    min="0"
                    step="0.01"
                    value={costPerStudent}
                    onChange={(e) => setCostPerStudent(e.target.value)}
                    placeholder="0.00"
                    className="pl-10 border-2 border-[#0A0A0A] focus:ring-[#F5C518] focus:border-[#F5C518]"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-2 border-[#0A0A0A] hover:bg-gray-100"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 font-semibold disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Add Destination & Continue'
          )}
        </Button>
      </div>
    </div>
  );
}
