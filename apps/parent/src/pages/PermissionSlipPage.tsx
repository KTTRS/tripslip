import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { getSession } from '../lib/session';
import { TripDetails } from '../components/permission-slip/TripDetails';
import { StudentInfo } from '../components/permission-slip/StudentInfo';
import { PermissionSlipForm } from '../components/permission-slip/PermissionSlipForm';
import { LanguageSelector } from '../components/LanguageSelector';

interface PricingTier {
  price_cents: number;
  min_students: number;
  max_students: number;
}

interface TripData {
  id: string;
  trip_date: string;
  trip_time?: string;
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
      address: string;
    };
    pricing_tiers?: PricingTier[];
  };
}

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  grade: string;
  medical_info?: string;
}

interface SlipData {
  id: string;
  status: string;
  magic_link_token: string;
  student_id: string;
  trip_id: string;
  financial_assistance_requested?: boolean;
  students: StudentData;
  trips: TripData;
}

interface TripForm {
  id: string;
  title: string;
  form_type: string;
  file_url: string;
  required: boolean;
}

interface FormData {
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  signature: string | null;
}

interface FormErrors {
  parentFirstName?: string;
  parentLastName?: string;
  parentEmail?: string;
  parentPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  signature?: string;
}

export function PermissionSlipPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { slipId: paramSlipId } = useParams<{ slipId: string }>();

  const [slip, setSlip] = useState<SlipData | null>(null);
  const [tripForms, setTripForms] = useState<TripForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [assistanceRequested, setAssistanceRequested] = useState(false);
  const [agreedForms, setAgreedForms] = useState<Set<string>>(new Set());
  const [formAgreementErrors, setFormAgreementErrors] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    parentPhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    signature: null,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    loadPermissionSlip();
  }, []);

  const getTokenAndSlipId = (): { token: string | null; slipId: string | null } => {
    const token = searchParams.get('token');
    const slipIdFromQuery = searchParams.get('slip');

    if (token && slipIdFromQuery) {
      return { token, slipId: slipIdFromQuery };
    }

    if (paramSlipId) {
      const session = getSession();
      if (session) {
        return { token: session.authToken, slipId: session.permissionSlipId };
      }
    }

    if (token) {
      return { token, slipId: null };
    }

    return { token: null, slipId: null };
  };

  const loadPermissionSlip = async () => {
    try {
      const { token, slipId } = getTokenAndSlipId();

      if (!token && !slipId) {
        setError(t('permissionSlip.invalidLink'));
        setLoading(false);
        return;
      }

      let query = supabase
        .from('permission_slips')
        .select(`
          id,
          status,
          magic_link_token,
          student_id,
          trip_id,
          financial_assistance_requested,
          students (
            id,
            first_name,
            last_name,
            grade,
            medical_info
          ),
          trips (
            id,
            trip_date,
            trip_time,
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
                price_cents,
                min_students,
                max_students
              )
            )
          )
        `);

      if (slipId && token) {
        query = query.eq('id', slipId).eq('magic_link_token', token);
      } else if (token) {
        query = query.eq('magic_link_token', token);
      } else if (slipId) {
        query = query.eq('id', slipId);
      }

      const { data, error: fetchError } = await query.single();

      if (fetchError || !data) {
        setError(t('permissionSlip.notFound'));
        setLoading(false);
        return;
      }

      const slipData = data as unknown as SlipData;

      if (slipData.status === 'signed' || slipData.status === 'paid' || slipData.status === 'signed_pending_payment') {
        if (slipData.status === 'signed_pending_payment') {
          navigate(`/payment?slip=${slipData.id}&token=${slipData.magic_link_token}`);
          return;
        }
        setError(t('permissionSlip.alreadySigned'));
        setLoading(false);
        return;
      }

      setSlip(slipData);

      try {
        const { data: forms } = await (supabase as any)
          .from('trip_forms')
          .select('id, title, form_type, file_url, required')
          .eq('trip_id', slipData.trip_id);

        if (forms && Array.isArray(forms) && forms.length > 0) {
          setTripForms(forms as TripForm[]);
        }
      } catch {
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('permissionSlip.notFound'));
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSignatureChange = (signature: string | null) => {
    setFormData(prev => ({ ...prev, signature }));
    if (formErrors.signature) {
      setFormErrors(prev => ({ ...prev, signature: undefined }));
    }
  };

  const handleFormAgreement = (formId: string) => {
    setAgreedForms(prev => {
      const next = new Set(prev);
      if (next.has(formId)) {
        next.delete(formId);
      } else {
        next.add(formId);
      }
      return next;
    });
    setFormAgreementErrors(null);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.parentFirstName.trim()) {
      errors.parentFirstName = t('errors.required');
    }
    if (!formData.parentLastName.trim()) {
      errors.parentLastName = t('errors.required');
    }
    if (!formData.parentEmail.trim()) {
      errors.parentEmail = t('errors.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      errors.parentEmail = t('errors.invalidEmail');
    }
    if (!formData.parentPhone.trim()) {
      errors.parentPhone = t('errors.required');
    } else if (!/^[\d\s\-+()]{7,}$/.test(formData.parentPhone)) {
      errors.parentPhone = t('errors.invalidPhone');
    }
    if (!formData.emergencyContactName.trim()) {
      errors.emergencyContactName = t('errors.required');
    }
    if (!formData.emergencyContactPhone.trim()) {
      errors.emergencyContactPhone = t('errors.required');
    } else if (!/^[\d\s\-+()]{7,}$/.test(formData.emergencyContactPhone)) {
      errors.emergencyContactPhone = t('errors.invalidPhone');
    }
    if (!formData.signature) {
      errors.signature = t('errors.signatureRequired');
    }

    const requiredForms = tripForms.filter(f => f.required);
    const allRequiredAgreed = requiredForms.every(f => agreedForms.has(f.id));
    if (!allRequiredAgreed && requiredForms.length > 0) {
      setFormAgreementErrors(t('youMustAgree'));
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0 && (requiredForms.length === 0 || allRequiredAgreed);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!validateForm() || !slip) return;

    setSubmitting(true);

    try {
      const costForPayment = slip.trips.experience?.pricing_tiers?.[0]?.price_cents || 0;
      const requiresPayment = !slip.trips.is_free &&
        slip.trips.funding_model !== 'school_funded' &&
        slip.trips.funding_model !== 'sponsored' &&
        costForPayment > 0 &&
        !assistanceRequested;

      const newStatus = requiresPayment ? 'signed_pending_payment' : 'signed';

      const { error: updateError } = await supabase
        .from('permission_slips')
        .update({
          status: newStatus,
          signed_at: new Date().toISOString(),
          signature_data: formData.signature,
          form_data: {
            parentName: `${formData.parentFirstName} ${formData.parentLastName}`,
            parentEmail: formData.parentEmail,
            parentPhone: formData.parentPhone,
            emergencyContactName: formData.emergencyContactName,
            emergencyContactPhone: formData.emergencyContactPhone,
            financialAssistanceRequested: assistanceRequested,
          },
        })
        .eq('id', slip.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (requiresPayment) {
        navigate(`/payment?slip=${slip.id}&token=${slip.magic_link_token}`);
      } else {
        navigate(`/permission-slip/success?slip=${slip.id}&token=${slip.magic_link_token}`);
      }
    } catch (err) {
      setSubmissionError(
        err instanceof Error ? err.message : t('errors.submissionFailed')
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
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('permissionSlip.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !slip) {
    const isExpired = error?.toLowerCase().includes('expired') || error?.toLowerCase().includes('not found');
    const isAlreadySigned = error?.toLowerCase().includes('already been signed') || error?.toLowerCase().includes('already signed');

    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-8 text-center">
            <div className="text-5xl mb-4">{isAlreadySigned ? '✅' : isExpired ? '⏰' : '📋'}</div>
            <h1 className="text-2xl font-bold text-[#0A0A0A] mb-4">
              {isAlreadySigned
                ? t('permissionSlip.alreadySignedTitle', 'Already Signed')
                : isExpired
                  ? t('permissionSlip.linkExpiredTitle', 'Link Expired')
                  : t('permissionSlip.errorTitle')}
            </h1>
            <p className="text-gray-600 mb-6">
              {isExpired
                ? t('permissionSlip.linkExpiredMessage', 'This permission slip link has expired or is no longer valid. Please contact your child\'s teacher to receive a new link.')
                : error || t('permissionSlip.notFound')}
            </p>
            {isExpired && (
              <div className="mb-4 p-4 bg-[#FFF8E1] border-2 border-[#F5C518] rounded-lg">
                <p className="text-sm text-gray-700 font-medium mb-1">Need a new link?</p>
                <p className="text-sm text-gray-600">
                  Ask your child's teacher to resend the permission slip link, or check your email/text messages for a more recent link.
                </p>
              </div>
            )}
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-[#0A0A0A] text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              {t('common.goHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const costCents = slip.trips.experience?.pricing_tiers?.[0]?.price_cents || 0;
  const tripHasCost = !slip.trips.is_free &&
    slip.trips.funding_model !== 'school_funded' &&
    slip.trips.funding_model !== 'sponsored' &&
    costCents > 0;

  const requiresPayment = tripHasCost && !assistanceRequested;

  const rawTransport = slip.trips.transportation as Record<string, unknown> | null;
  const transportation = rawTransport ? {
    type: (rawTransport.type as string) || undefined,
    departure_time: (rawTransport.departure_time || rawTransport.departureTime) as string | undefined,
    return_time: (rawTransport.return_time || rawTransport.returnTime) as string | undefined,
    pickup_location: (rawTransport.pickup_location || rawTransport.pickupLocation) as string | undefined,
    company_name: (rawTransport.company_name || rawTransport.companyName) as string | undefined,
    notes: (rawTransport.notes) as string | undefined,
  } : null;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="inline-block bg-[#F5C518] border-2 border-[#0A0A0A] rounded-lg px-4 py-1 mb-4 shadow-[2px_2px_0px_#0A0A0A]">
            <span className="font-bold text-[#0A0A0A] text-sm tracking-wide">TRIPSLIP</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0A0A0A] mb-2">
            {t('permissionSlip.title')}
          </h1>
          <p className="text-gray-600">
            {t('permissionSlip.subtitle', {
              studentName: `${slip.students.first_name} ${slip.students.last_name}`,
              tripTitle: slip.trips.experience?.title || 'Field Trip',
            })}
          </p>
        </div>

        <div className="space-y-6">
          <TripDetails trip={slip.trips} />

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
                {transportation.company_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Company</p>
                    <p className="text-[#0A0A0A]">{transportation.company_name}</p>
                  </div>
                )}
                {transportation.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="text-[#0A0A0A]">{transportation.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <StudentInfo student={slip.students} />

          {tripForms.length > 0 && (
            <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 space-y-4">
              <h2 className="text-xl font-bold text-[#0A0A0A]">{t('schoolRequirements')}</h2>
              <div className="space-y-3">
                {tripForms.map((form) => (
                  <div key={form.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <input
                      type="checkbox"
                      id={`form-${form.id}`}
                      checked={agreedForms.has(form.id)}
                      onChange={() => handleFormAgreement(form.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-[#F5C518] focus:ring-[#F5C518]"
                    />
                    <div className="flex-1">
                      <label htmlFor={`form-${form.id}`} className="block text-sm font-semibold text-[#0A0A0A] cursor-pointer">
                        {form.title}
                        {form.required && (
                          <span className="ml-1 text-red-500 text-xs">({t('required')})</span>
                        )}
                      </label>
                      <p className="text-xs text-gray-500 capitalize">{form.form_type.replace(/_/g, ' ')}</p>
                      {form.file_url && (
                        <a
                          href={form.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          📄 Download & Review
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {formAgreementErrors && (
                <p className="text-sm text-red-600">{formAgreementErrors}</p>
              )}
            </div>
          )}

          {tripHasCost && (
            <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 space-y-4">
              <h2 className="text-xl font-bold text-[#0A0A0A]">{t('cost')}</h2>
              <div className="flex items-center justify-between p-4 bg-[#F5C518]/10 rounded-lg border border-[#F5C518]/30">
                <span className="font-medium text-[#0A0A0A]">Trip Cost</span>
                <span className="text-2xl font-bold text-[#0A0A0A]">
                  {formatCurrency(costCents)}
                </span>
              </div>

              {requiresPayment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    {t('permissionSlip.paymentNotice', {
                      amount: formatCurrency(costCents),
                    })}
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
                    <p className="font-semibold text-[#0A0A0A]">{t('needAssistance')}</p>
                    <p className="text-sm text-gray-600 mt-1">{t('needAssistanceDesc')}</p>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center italic">
                  {t('noStudentLeftOut')}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 space-y-4">
            <h2 className="text-xl font-bold text-[#0A0A0A]">{t('permissionWaiver')}</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>{t('permissionSlip.legalNotice')}</p>
              <ul className="space-y-1 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-[#F5C518] mt-0.5">✓</span>
                  <span>{t('permissionSlip.parentalConsent')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F5C518] mt-0.5">✓</span>
                  <span>{t('permissionSlip.emergencyTreatment')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F5C518] mt-0.5">✓</span>
                  <span>{t('permissionSlip.liabilityWaiver')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F5C518] mt-0.5">✓</span>
                  <span>{t('permissionSlip.dataPrivacy')}</span>
                </li>
              </ul>
            </div>
          </div>

          <PermissionSlipForm
            formData={formData}
            formErrors={formErrors}
            onInputChange={handleInputChange}
            onSignatureChange={handleSignatureChange}
            onSubmit={handleSubmit}
            submitting={submitting}
            requiresPayment={requiresPayment}
          />

          {submissionError && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <div>
                  <h3 className="text-sm font-semibold text-red-800">
                    {t('permissionSlip.submissionError')}
                  </h3>
                  <p className="text-sm text-red-700 mt-1">{submissionError}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
