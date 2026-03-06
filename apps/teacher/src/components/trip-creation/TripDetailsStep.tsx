import { useState, useMemo } from 'react';
import { useTripCreationStore } from '../../stores/tripCreationStore';
import type { TransportationDetails, FundingModel } from '../../stores/tripCreationStore';
import { Button } from '@tripslip/ui/components/button';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import { Textarea } from '@tripslip/ui/components/textarea';
import { toast } from 'sonner';
import { MapPin, Phone, Mail, Globe, FileText, Calendar, Clock, AlertCircle, Bus, DollarSign, Gift, School, Building2 } from 'lucide-react';

const TRANSPORTATION_TYPES = [
  { value: 'district_bus', label: 'District Bus' },
  { value: 'charter_bus', label: 'Charter Bus' },
  { value: 'parent_dropoff', label: 'Parent Drop-off' },
  { value: 'walking', label: 'Walking' },
  { value: 'public_transit', label: 'Public Transit' },
  { value: 'other', label: 'Other' },
] as const;

const DEFAULT_TRANSPORTATION: TransportationDetails = {
  type: '',
  departureTime: '',
  returnTime: '',
  pickupLocation: '',
  companyName: '',
  companyPhone: '',
  estimatedCostCents: 0,
  notes: '',
  estimatedBuses: 0,
};

const FUNDING_MODELS: { value: FundingModel; label: string; description: string; icon: typeof DollarSign }[] = [
  { value: 'parents_pay', label: 'Parents Pay Individually', description: 'Each parent pays for their child', icon: DollarSign },
  { value: 'school_funded', label: 'School Funded', description: 'School covers all costs — no payment from parents', icon: School },
  { value: 'school_upfront', label: 'School Pays Upfront', description: 'School pays first, then collects from parents', icon: Building2 },
  { value: 'sponsored', label: 'Sponsored', description: 'A sponsor covers the trip costs', icon: Gift },
];

export function TripDetailsStep() {
  const { tripDetails, setTripDetails, nextStep, saveDraft, venueInfo, venueForms, selectedStudents } = useTripCreationStore();
  
  const [formData, setFormData] = useState({
    name: tripDetails?.name || '',
    date: tripDetails?.date || '',
    time: tripDetails?.time || '',
    description: tripDetails?.description || '',
    specialRequirements: tripDetails?.specialRequirements || '',
  });

  const [transportation, setTransportation] = useState<TransportationDetails>(
    tripDetails?.transportation || { ...DEFAULT_TRANSPORTATION }
  );

  const [isFree, setIsFree] = useState(tripDetails?.isFree ?? false);
  const [fundingModel, setFundingModel] = useState<FundingModel>(tripDetails?.fundingModel || 'parents_pay');
  const [sponsorName, setSponsorName] = useState(tripDetails?.sponsorName || '');
  
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
  
  const estimatedBuses = useMemo(() => {
    const studentCount = selectedStudents.length;
    if (studentCount === 0) return 0;
    return Math.ceil(studentCount / 48);
  }, [selectedStudents.length]);

  const handleTransportationChange = (field: keyof TransportationDetails, value: string | number) => {
    setTransportation((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'type' && (value === 'district_bus' || value === 'charter_bus')) {
        updated.estimatedBuses = estimatedBuses;
      }
      return updated;
    });
  };

  const getFormDataWithTransportation = () => {
    const hasTransportation = transportation.type !== '';
    return {
      ...formData,
      transportation: hasTransportation ? { ...transportation, estimatedBuses: (transportation.type === 'district_bus' || transportation.type === 'charter_bus') ? estimatedBuses : 0 } : undefined,
      isFree,
      fundingModel: isFree ? 'school_funded' as FundingModel : fundingModel,
      sponsorName: fundingModel === 'sponsored' && !isFree ? sponsorName : undefined,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Please fix the errors before continuing');
      return;
    }
    
    setTripDetails(getFormDataWithTransportation());
    nextStep();
  };
  
  const handleSaveDraft = async () => {
    setTripDetails(getFormDataWithTransportation());
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
      
      {/* Funding Model */}
      <div className="space-y-4 p-4 bg-gray-50 border-2 border-[#0A0A0A] rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-[#0A0A0A]" />
          <h3 className="text-lg font-semibold text-[#0A0A0A]">How is this trip funded?</h3>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white border-2 border-[#0A0A0A] rounded-lg">
          <input
            type="checkbox"
            id="isFree"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
            className="w-5 h-5 accent-[#F5C518] cursor-pointer"
            aria-label="Free trip toggle"
          />
          <Label htmlFor="isFree" className="text-[#0A0A0A] font-semibold cursor-pointer flex-1">
            This is a free trip
            <span className="block text-sm font-normal text-gray-600">
              No cost to parents — skip all payment steps
            </span>
          </Label>
        </div>

        {!isFree && (
          <div className="space-y-3 pt-2">
            <Label className="text-[#0A0A0A] font-semibold">Funding Model</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FUNDING_MODELS.map((model) => {
                const Icon = model.icon;
                const isSelected = fundingModel === model.value;
                return (
                  <button
                    key={model.value}
                    type="button"
                    onClick={() => setFundingModel(model.value)}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-[#F5C518] bg-[#FFFDE7] shadow-[3px_3px_0px_#0A0A0A]'
                        : 'border-[#0A0A0A] bg-white hover:bg-gray-50'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isSelected ? 'text-[#0A0A0A]' : 'text-gray-500'}`} />
                    <div>
                      <p className={`text-sm font-semibold ${isSelected ? 'text-[#0A0A0A]' : 'text-gray-800'}`}>
                        {model.label}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">{model.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {fundingModel === 'sponsored' && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="sponsorName" className="text-[#0A0A0A] font-semibold">
                  Sponsor Name <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="sponsorName"
                  type="text"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="e.g., PTA, Local Business Name"
                  className="border-2 border-[#0A0A0A] focus:border-[#F5C518]"
                />
              </div>
            )}

            {(fundingModel === 'school_funded' || fundingModel === 'sponsored') && (
              <div className="p-3 bg-[#FFFDE7] border-2 border-[#F5C518] rounded-lg">
                <p className="text-sm text-[#0A0A0A]">
                  <strong>Note:</strong> Parents will only need to sign the permission slip — no payment will be collected from them.
                </p>
              </div>
            )}

            {fundingModel === 'school_upfront' && (
              <div className="p-3 bg-[#FFFDE7] border-2 border-[#F5C518] rounded-lg">
                <p className="text-sm text-[#0A0A0A]">
                  <strong>Note:</strong> The school pays the venue upfront. Parents will be billed individually to reimburse the school.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transportation */}
      <div className="space-y-4 p-4 bg-gray-50 border-2 border-[#0A0A0A] rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Bus className="w-5 h-5 text-[#0A0A0A]" />
          <h3 className="text-lg font-semibold text-[#0A0A0A]">Transportation</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transportationType" className="text-[#0A0A0A] font-semibold">
            Transportation Type
          </Label>
          <select
            id="transportationType"
            value={transportation.type}
            onChange={(e) => handleTransportationChange('type', e.target.value)}
            className="w-full h-10 px-3 border-2 border-[#0A0A0A] rounded-md bg-white text-sm focus:border-[#F5C518] focus:outline-none"
            aria-label="Transportation type"
          >
            <option value="">Select transportation type...</option>
            {TRANSPORTATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {transportation.type && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departureTime" className="text-[#0A0A0A] font-semibold">
                  Departure Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input
                    id="departureTime"
                    type="time"
                    value={transportation.departureTime}
                    onChange={(e) => handleTransportationChange('departureTime', e.target.value)}
                    className="pl-10 border-2 border-[#0A0A0A] focus:border-[#F5C518]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnTime" className="text-[#0A0A0A] font-semibold">
                  Return Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input
                    id="returnTime"
                    type="time"
                    value={transportation.returnTime}
                    onChange={(e) => handleTransportationChange('returnTime', e.target.value)}
                    className="pl-10 border-2 border-[#0A0A0A] focus:border-[#F5C518]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupLocation" className="text-[#0A0A0A] font-semibold">
                Pickup Location
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <Input
                  id="pickupLocation"
                  type="text"
                  value={transportation.pickupLocation}
                  onChange={(e) => handleTransportationChange('pickupLocation', e.target.value)}
                  placeholder="e.g., School front entrance"
                  className="pl-10 border-2 border-[#0A0A0A] focus:border-[#F5C518]"
                />
              </div>
            </div>

            {(transportation.type === 'charter_bus') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-[#0A0A0A] font-semibold">
                    Bus Company Name
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={transportation.companyName}
                    onChange={(e) => handleTransportationChange('companyName', e.target.value)}
                    placeholder="e.g., ABC Bus Lines"
                    className="border-2 border-[#0A0A0A] focus:border-[#F5C518]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone" className="text-[#0A0A0A] font-semibold">
                    Company Phone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <Input
                      id="companyPhone"
                      type="tel"
                      value={transportation.companyPhone}
                      onChange={(e) => handleTransportationChange('companyPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="pl-10 border-2 border-[#0A0A0A] focus:border-[#F5C518]"
                    />
                  </div>
                </div>
              </div>
            )}

            {(transportation.type === 'district_bus' || transportation.type === 'charter_bus') && selectedStudents.length > 0 && (
              <div className="p-3 bg-[#FFFDE7] border-2 border-[#F5C518] rounded-lg">
                <p className="text-sm font-semibold text-[#0A0A0A]">
                  <Bus className="w-4 h-4 inline mr-1" />
                  Estimated buses needed: <span className="text-lg">{estimatedBuses}</span>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Based on {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} at 48 per bus
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="estimatedCost" className="text-[#0A0A0A] font-semibold">
                Estimated Transportation Cost
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none font-medium">$</span>
                <Input
                  id="estimatedCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={transportation.estimatedCostCents ? (transportation.estimatedCostCents / 100).toFixed(2) : ''}
                  onChange={(e) => handleTransportationChange('estimatedCostCents', Math.round(parseFloat(e.target.value || '0') * 100))}
                  placeholder="0.00"
                  className="pl-8 border-2 border-[#0A0A0A] focus:border-[#F5C518]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportationNotes" className="text-[#0A0A0A] font-semibold">
                Notes <span className="text-gray-500 font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="transportationNotes"
                value={transportation.notes}
                onChange={(e) => handleTransportationChange('notes', e.target.value)}
                placeholder="Any additional transportation details or instructions..."
                rows={2}
                className="border-2 border-[#0A0A0A] focus:border-[#F5C518]"
              />
            </div>
          </div>
        )}
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
