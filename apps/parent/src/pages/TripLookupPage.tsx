import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { LanguageSelector } from '../components/LanguageSelector';
import { TripDetails } from '../components/permission-slip/TripDetails';
import { SignatureCapture } from '../components/permission-slip/SignatureCapture';
import { useTranslation } from 'react-i18next';

interface TripInfo {
  id: string;
  trip_date: string;
  trip_time?: string;
  status: string;
  is_free?: boolean;
  funding_model?: string;
  transportation?: Record<string, unknown>;
  configured_addons?: Array<{
    name: string;
    description?: string;
    price_cents?: number;
    priceCents?: number;
    required?: boolean;
    category?: string;
  }>;
  special_requirements?: string;
  experience: {
    title: string;
    description: string;
    duration_minutes?: number;
    venue: {
      name: string;
      address: any;
    };
    pricing_tiers?: Array<{ price_cents: number }>;
  };
}

interface TripForm {
  id: string;
  title: string;
  form_type: string;
  file_url: string;
  required: boolean;
}

interface FormState {
  studentFirstName: string;
  studentLastName: string;
  studentGrade: string;
  studentAllergies: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  signature: string | null;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

export function TripLookupPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [tripForms, setTripForms] = useState<TripForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [assistanceRequested, setAssistanceRequested] = useState(false);
  const [agreedForms, setAgreedForms] = useState<Set<string>>(new Set());
  const [formAgreementError, setFormAgreementError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    studentFirstName: '',
    studentLastName: '',
    studentGrade: '',
    studentAllergies: '',
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    parentPhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    signature: null,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!token) {
      setError('No trip link provided.');
      setLoading(false);
      return;
    }
    loadTrip();
    loadSavedParentInfo();
  }, [token]);

  const loadSavedParentInfo = () => {
    try {
      const saved = localStorage.getItem('tripslip_parent_info');
      if (saved) {
        const data = JSON.parse(saved);
        setForm(prev => ({
          ...prev,
          parentFirstName: data.parentFirstName || '',
          parentLastName: data.parentLastName || '',
          parentEmail: data.parentEmail || '',
          parentPhone: data.parentPhone || '',
          emergencyContactName: data.emergencyContactName || '',
          emergencyContactPhone: data.emergencyContactPhone || '',
          studentFirstName: data.studentFirstName || '',
          studentLastName: data.studentLastName || '',
          studentGrade: data.studentGrade || '',
          studentAllergies: data.studentAllergies || '',
        }));
      }
    } catch {}
  };

  const loadTrip = async () => {
    try {
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select(`
          id,
          trip_date,
          trip_time,
          status,
          is_free,
          funding_model,
          transportation,
          configured_addons,
          special_requirements,
          experience:experiences (
            title,
            description,
            duration_minutes,
            venue:venues (
              name,
              address
            ),
            pricing_tiers (
              price_cents
            )
          )
        `)
        .eq('direct_link_token', token)
        .single();

      if (tripError || !tripData) {
        setError('This link is invalid or has expired. Please contact your child\'s teacher for a new link.');
        setLoading(false);
        return;
      }

      setTrip(tripData as unknown as TripInfo);

      try {
        const { data: forms } = await (supabase as any)
          .from('trip_forms')
          .select('id, title, form_type, file_url, required')
          .eq('trip_id', tripData.id);

        if (forms && Array.isArray(forms) && forms.length > 0) {
          setTripForms(forms as TripForm[]);
        }
      } catch {}
    } catch (err) {
      console.error('Error loading trip:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isFieldValid = (field: keyof FormState): boolean => {
    const v = form[field];
    if (typeof v !== 'string' || !v.trim()) return false;
    if (field === 'parentEmail') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (field === 'parentPhone' || field === 'emergencyContactPhone') return /^[\d\s\-+()]{7,}$/.test(v);
    return true;
  };

  const formSections = [
    { label: 'Trip Details', done: true },
    { label: 'Student Info', done: isFieldValid('studentFirstName') && isFieldValid('studentLastName') },
    { label: 'Parent Info', done: isFieldValid('parentFirstName') && isFieldValid('parentLastName') && isFieldValid('parentEmail') && isFieldValid('parentPhone') },
    { label: 'Emergency', done: isFieldValid('emergencyContactName') && isFieldValid('emergencyContactPhone') },
    { label: 'Sign', done: !!form.signature },
  ];
  const completedSections = formSections.filter(s => s.done).length;
  const progressPercent = Math.round((completedSections / formSections.length) * 100);

  const handleSignatureChange = (sig: string | null) => {
    setForm(prev => ({ ...prev, signature: sig }));
    if (fieldErrors.signature) {
      setFieldErrors(prev => ({ ...prev, signature: undefined }));
    }
  };

  const handleFormAgreement = (formId: string) => {
    setAgreedForms(prev => {
      const next = new Set(prev);
      if (next.has(formId)) next.delete(formId);
      else next.add(formId);
      return next;
    });
    setFormAgreementError(null);
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!form.studentFirstName.trim()) errors.studentFirstName = 'Required';
    if (!form.studentLastName.trim()) errors.studentLastName = 'Required';
    if (!form.parentFirstName.trim()) errors.parentFirstName = 'Required';
    if (!form.parentLastName.trim()) errors.parentLastName = 'Required';
    if (!form.parentEmail.trim()) {
      errors.parentEmail = 'Required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail)) {
      errors.parentEmail = 'Please enter a valid email';
    }
    if (!form.parentPhone.trim()) {
      errors.parentPhone = 'Required';
    } else if (!/^[\d\s\-+()]{7,}$/.test(form.parentPhone)) {
      errors.parentPhone = 'Please enter a valid phone number';
    }
    if (!form.emergencyContactName.trim()) errors.emergencyContactName = 'Required';
    if (!form.emergencyContactPhone.trim()) {
      errors.emergencyContactPhone = 'Required';
    } else if (!/^[\d\s\-+()]{7,}$/.test(form.emergencyContactPhone)) {
      errors.emergencyContactPhone = 'Please enter a valid phone number';
    }
    if (!form.signature) errors.signature = 'Please sign above';

    const requiredForms = tripForms.filter(f => f.required);
    const allAgreed = requiredForms.every(f => agreedForms.has(f.id));
    if (!allAgreed && requiredForms.length > 0) {
      setFormAgreementError('You must agree to all required forms');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0 && (requiredForms.length === 0 || allAgreed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!validate() || !trip) return;

    setSubmitting(true);

    try {
      const magicToken = crypto.randomUUID();

      const { data: slip, error: slipError } = await supabase
        .from('permission_slips')
        .insert({
          trip_id: trip.id,
          status: 'pending',
          magic_link_token: magicToken,
        })
        .select('id')
        .single();

      if (slipError || !slip) {
        throw new Error(slipError?.message || 'Failed to create permission slip');
      }

      const costCents = trip.experience?.pricing_tiers?.[0]?.price_cents || 0;
      const requiresPayment = !trip.is_free &&
        trip.funding_model !== 'school_funded' &&
        trip.funding_model !== 'sponsored' &&
        costCents > 0 &&
        !assistanceRequested;

      const newStatus = requiresPayment ? 'signed_pending_payment' : 'signed';

      const { error: updateError } = await supabase
        .from('permission_slips')
        .update({
          status: newStatus,
          signed_at: new Date().toISOString(),
          signature_data: form.signature,
          form_data: {
            studentFirstName: form.studentFirstName.trim(),
            studentLastName: form.studentLastName.trim(),
            studentGrade: form.studentGrade.trim(),
            studentAllergies: form.studentAllergies.trim(),
            parentName: `${form.parentFirstName.trim()} ${form.parentLastName.trim()}`,
            parentEmail: form.parentEmail.trim(),
            parentPhone: form.parentPhone.trim(),
            emergencyContactName: form.emergencyContactName.trim(),
            emergencyContactPhone: form.emergencyContactPhone.trim(),
            financialAssistanceRequested: assistanceRequested,
          },
        })
        .eq('id', slip.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      try {
        localStorage.setItem('tripslip_parent_info', JSON.stringify({
          parentFirstName: form.parentFirstName.trim(),
          parentLastName: form.parentLastName.trim(),
          parentEmail: form.parentEmail.trim(),
          parentPhone: form.parentPhone.trim(),
          emergencyContactName: form.emergencyContactName.trim(),
          emergencyContactPhone: form.emergencyContactPhone.trim(),
          studentFirstName: form.studentFirstName.trim(),
          studentLastName: form.studentLastName.trim(),
          studentGrade: form.studentGrade.trim(),
          studentAllergies: form.studentAllergies.trim(),
        }));
      } catch {}

      if (requiresPayment) {
        navigate(`/payment?slip=${slip.id}&token=${magicToken}`);
      } else {
        navigate(`/permission-slip/success?slip=${slip.id}&token=${magicToken}`);
      }
    } catch (err) {
      setSubmissionError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
      setSubmitting(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="absolute top-4 right-4"><LanguageSelector /></div>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading trip information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !trip) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="absolute top-4 right-4"><LanguageSelector /></div>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-8 text-center">
            <div className="text-5xl mb-4">🔗</div>
            <h1 className="text-2xl font-bold text-[#0A0A0A] mb-4">Link Not Found</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const costCents = trip.experience?.pricing_tiers?.[0]?.price_cents || 0;
  const tripHasCost = !trip.is_free &&
    trip.funding_model !== 'school_funded' &&
    trip.funding_model !== 'sponsored' &&
    costCents > 0;
  const requiresPayment = tripHasCost && !assistanceRequested;

  const rawTransport = trip.transportation as Record<string, unknown> | null;
  const transportation = rawTransport ? {
    type: (rawTransport.type as string) || undefined,
    departure_time: (rawTransport.departure_time || rawTransport.departureTime) as string | undefined,
    return_time: (rawTransport.return_time || rawTransport.returnTime) as string | undefined,
    pickup_location: (rawTransport.pickup_location || rawTransport.pickupLocation) as string | undefined,
    company_name: (rawTransport.company_name || rawTransport.companyName) as string | undefined,
    notes: (rawTransport.notes) as string | undefined,
  } : null;

  const inputClass = (field: keyof FormState | null, hasError: boolean) => `
    w-full border-2 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] transition-all
    ${hasError ? 'border-red-400' : field && isFieldValid(field) ? 'border-green-300' : 'border-gray-200'}
    disabled:bg-gray-100 disabled:cursor-not-allowed
  `;

  const FieldCheck = ({ field }: { field: keyof FormState }) => {
    if (!isFieldValid(field)) return null;
    return (
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
      </span>
    );
  };

  const hasSavedInfo = !!localStorage.getItem('tripslip_parent_info');

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="absolute top-4 right-4 z-10"><LanguageSelector /></div>

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-6 relative">
          <div className="flex items-center justify-center mb-4">
            <img src="/images/tripslip-logo.png" alt="TripSlip" className="h-14 w-auto object-contain" />
          </div>
          <div className="relative inline-block">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0A0A0A] mb-2">
              Permission Slip
            </h1>
            <img
              src="/images/char-pink-heart.png"
              alt=""
              className="absolute -right-16 -top-4 w-14 h-14 object-contain animate-float hidden sm:block drop-shadow-lg"
            />
          </div>
          <p className="text-gray-500 text-sm">
            Please review the trip details and fill out the form below.
          </p>

          <div className="flex items-center justify-center gap-2 mt-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            <span className="text-xs font-semibold text-green-700">Secure form — your information is protected</span>
          </div>
        </div>

        <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[3px_3px_0px_#0A0A0A] p-4 mb-6 sticky top-2 z-20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</span>
            <span className="text-xs font-bold text-[#0A0A0A]">{completedSections} of {formSections.length} sections</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#F5C518] h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {formSections.map((s, i) => (
              <span key={i} className={`text-[10px] font-semibold transition-colors ${s.done ? 'text-green-600' : 'text-gray-400'}`}>
                {s.done ? '✓' : (i + 1)} {s.label}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <TripDetails trip={trip} />

          {transportation && transportation.type && (
            <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 space-y-3">
              <h2 className="text-xl font-bold text-[#0A0A0A]">Transportation</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="text-[#0A0A0A] capitalize">{transportation.type.replace(/_/g, ' ')}</p>
                </div>
                {transportation.pickup_location && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pickup Location</p>
                    <p className="text-[#0A0A0A]">{transportation.pickup_location}</p>
                  </div>
                )}
                {transportation.departure_time && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Departure</p>
                    <p className="text-[#0A0A0A]">{transportation.departure_time}</p>
                  </div>
                )}
                {transportation.return_time && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Return</p>
                    <p className="text-[#0A0A0A]">{transportation.return_time}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-[#F5C518]/10 border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 space-y-4">
            <h2 className="text-xl font-bold text-[#0A0A0A]">Student Information</h2>
            {hasSavedInfo && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                We've filled in your saved info from last time. Please verify and update if needed.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="studentFirstName" className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                  Child's First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                  id="studentFirstName"
                  type="text"
                  value={form.studentFirstName}
                  onChange={(e) => updateField('studentFirstName', e.target.value)}
                  className={inputClass('studentFirstName', !!fieldErrors.studentFirstName)}
                  disabled={submitting}
                  placeholder="e.g. Sofia"
                  autoComplete="off"
                />
                  <FieldCheck field="studentFirstName" />
                </div>
                {fieldErrors.studentFirstName && <p className="text-red-500 text-xs mt-1">{fieldErrors.studentFirstName}</p>}
              </div>
              <div>
                <label htmlFor="studentLastName" className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                  Child's Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                  id="studentLastName"
                  type="text"
                  value={form.studentLastName}
                  onChange={(e) => updateField('studentLastName', e.target.value)}
                  className={inputClass('studentLastName', !!fieldErrors.studentLastName)}
                  disabled={submitting}
                  placeholder="e.g. Garcia"
                  autoComplete="off"
                />
                  <FieldCheck field="studentLastName" />
                </div>
                {fieldErrors.studentLastName && <p className="text-red-500 text-xs mt-1">{fieldErrors.studentLastName}</p>}
              </div>
              <div>
                <label htmlFor="studentGrade" className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                  Grade
                </label>
                <select
                  id="studentGrade"
                  value={form.studentGrade}
                  onChange={(e) => updateField('studentGrade', e.target.value)}
                  className={inputClass(null, false)}
                  disabled={submitting}
                >
                  <option value="">Select grade</option>
                  <option value="Pre-K">Pre-K</option>
                  <option value="K">Kindergarten</option>
                  <option value="1">1st Grade</option>
                  <option value="2">2nd Grade</option>
                  <option value="3">3rd Grade</option>
                  <option value="4">4th Grade</option>
                  <option value="5">5th Grade</option>
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                  <option value="9">9th Grade</option>
                  <option value="10">10th Grade</option>
                  <option value="11">11th Grade</option>
                  <option value="12">12th Grade</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="studentAllergies" className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                  Allergies or Medical Conditions
                </label>
                <textarea
                  id="studentAllergies"
                  value={form.studentAllergies}
                  onChange={(e) => updateField('studentAllergies', e.target.value)}
                  className={inputClass(null, false)}
                  disabled={submitting}
                  rows={2}
                  placeholder="e.g. peanut allergy, asthma inhaler needed"
                />
              </div>
            </div>
          </div>

          {tripForms.length > 0 && (
            <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 space-y-4">
              <h2 className="text-xl font-bold text-[#0A0A0A]">Required Forms</h2>
              <div className="space-y-3">
                {tripForms.map((f) => (
                  <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <input
                      type="checkbox"
                      id={`form-${f.id}`}
                      checked={agreedForms.has(f.id)}
                      onChange={() => handleFormAgreement(f.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-[#F5C518] focus:ring-[#F5C518]"
                    />
                    <div className="flex-1">
                      <label htmlFor={`form-${f.id}`} className="block text-sm font-semibold text-[#0A0A0A] cursor-pointer">
                        {f.title}
                        {f.required && <span className="ml-1 text-red-500 text-xs">(required)</span>}
                      </label>
                      <p className="text-xs text-gray-500 capitalize">{f.form_type.replace(/_/g, ' ')}</p>
                      {f.file_url && (
                        <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                          Download & Review
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {formAgreementError && <p className="text-sm text-red-600">{formAgreementError}</p>}
            </div>
          )}

          {tripHasCost && (
            <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 space-y-4">
              <h2 className="text-xl font-bold text-[#0A0A0A]">Trip Cost</h2>
              <div className="flex items-center justify-between p-4 bg-[#F5C518]/10 rounded-lg border border-[#F5C518]/30">
                <span className="font-medium text-[#0A0A0A]">Cost per Student</span>
                <span className="text-2xl font-bold text-[#0A0A0A]">{formatCurrency(costCents)}</span>
              </div>
              {requiresPayment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    You'll be directed to payment after signing.
                  </p>
                </div>
              )}
              <div className="border-t pt-4">
                <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-dashed border-[#F5C518] bg-[#F5C518]/5">
                  <input
                    type="checkbox"
                    id="financial-assistance"
                    checked={assistanceRequested}
                    onChange={(e) => setAssistanceRequested(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#F5C518] focus:ring-[#F5C518]"
                  />
                  <label htmlFor="financial-assistance" className="cursor-pointer">
                    <p className="font-semibold text-[#0A0A0A]">I need financial assistance</p>
                    <p className="text-sm text-gray-600 mt-1">
                      No worries — we believe no child should miss out on a field trip due to cost. Check this box and we'll handle it.
                    </p>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center italic">No child left behind.</p>
              </div>
            </div>
          )}

          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 space-y-6">
            <h2 className="text-xl font-bold text-[#0A0A0A]">Parent / Guardian Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="parentFirstName" className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                  Your First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                  id="parentFirstName"
                  type="text"
                  value={form.parentFirstName}
                  onChange={(e) => updateField('parentFirstName', e.target.value)}
                  className={inputClass('parentFirstName', !!fieldErrors.parentFirstName)}
                  disabled={submitting}
                  autoComplete="given-name"
                />
                  <FieldCheck field="parentFirstName" />
                </div>
                {fieldErrors.parentFirstName && <p className="text-red-500 text-xs mt-1">{fieldErrors.parentFirstName}</p>}
              </div>
              <div>
                <label htmlFor="parentLastName" className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                  Your Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                  id="parentLastName"
                  type="text"
                  value={form.parentLastName}
                  onChange={(e) => updateField('parentLastName', e.target.value)}
                  className={inputClass('parentLastName', !!fieldErrors.parentLastName)}
                  disabled={submitting}
                  autoComplete="family-name"
                />
                  <FieldCheck field="parentLastName" />
                </div>
                {fieldErrors.parentLastName && <p className="text-red-500 text-xs mt-1">{fieldErrors.parentLastName}</p>}
              </div>
              <div>
                <label htmlFor="parentEmail" className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                  id="parentEmail"
                  type="email"
                  value={form.parentEmail}
                  onChange={(e) => updateField('parentEmail', e.target.value)}
                  className={inputClass('parentEmail', !!fieldErrors.parentEmail)}
                  disabled={submitting}
                  autoComplete="email"
                />
                  <FieldCheck field="parentEmail" />
                </div>
                {fieldErrors.parentEmail && <p className="text-red-500 text-xs mt-1">{fieldErrors.parentEmail}</p>}
              </div>
              <div>
                <label htmlFor="parentPhone" className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                  id="parentPhone"
                  type="tel"
                  value={form.parentPhone}
                  onChange={(e) => updateField('parentPhone', e.target.value)}
                  className={inputClass('parentPhone', !!fieldErrors.parentPhone)}
                  disabled={submitting}
                  autoComplete="tel"
                />
                  <FieldCheck field="parentPhone" />
                </div>
                {fieldErrors.parentPhone && <p className="text-red-500 text-xs mt-1">{fieldErrors.parentPhone}</p>}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-bold text-[#0A0A0A] mb-3">Emergency Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="emergencyContactName" className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                  <input
                    id="emergencyContactName"
                    type="text"
                    value={form.emergencyContactName}
                    onChange={(e) => updateField('emergencyContactName', e.target.value)}
                    className={inputClass('emergencyContactName', !!fieldErrors.emergencyContactName)}
                    disabled={submitting}
                    autoComplete="name"
                  />
                  <FieldCheck field="emergencyContactName" />
                </div>
                  {fieldErrors.emergencyContactName && <p className="text-red-500 text-xs mt-1">{fieldErrors.emergencyContactName}</p>}
                </div>
                <div>
                  <label htmlFor="emergencyContactPhone" className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                  <input
                    id="emergencyContactPhone"
                    type="tel"
                    value={form.emergencyContactPhone}
                    onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                    className={inputClass('emergencyContactPhone', !!fieldErrors.emergencyContactPhone)}
                    disabled={submitting}
                    autoComplete="tel"
                  />
                  <FieldCheck field="emergencyContactPhone" />
                </div>
                  {fieldErrors.emergencyContactPhone && <p className="text-red-500 text-xs mt-1">{fieldErrors.emergencyContactPhone}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 space-y-4">
            <h2 className="text-xl font-bold text-[#0A0A0A]">Permission & Waiver</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>By signing below, I acknowledge and agree to the following:</p>
              <ul className="space-y-1 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-[#F5C518] mt-0.5 font-bold">✓</span>
                  <span>I give permission for my child to participate in this field trip</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F5C518] mt-0.5 font-bold">✓</span>
                  <span>I authorize emergency medical treatment if needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F5C518] mt-0.5 font-bold">✓</span>
                  <span>I understand and accept the trip liability waiver</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F5C518] mt-0.5 font-bold">✓</span>
                  <span>I consent to the collection and use of information provided</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <SignatureCapture
                onSignatureChange={handleSignatureChange}
                value={form.signature}
              />
              {fieldErrors.signature && <p className="mt-1 text-sm text-red-600">{fieldErrors.signature}</p>}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-8 py-4 bg-[#F5C518] text-[#0A0A0A] font-bold text-lg rounded-lg border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 transition-all duration-150"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-5 w-5 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : requiresPayment ? (
                  'Sign & Continue to Payment'
                ) : (
                  'Sign Permission Slip'
                )}
              </button>
            </div>
          </div>

          {submissionError && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-xl">!</span>
                <div>
                  <h3 className="text-sm font-semibold text-red-800">Submission Error</h3>
                  <p className="text-sm text-red-700 mt-1">{submissionError}</p>
                </div>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Having trouble? Contact your child's teacher for help.
        </p>
      </div>
    </div>
  );
}
