import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { LanguageSelector } from '../components/LanguageSelector';

interface TripInfo {
  id: string;
  trip_date: string;
  trip_time?: string;
  status: string;
  experience: {
    title: string;
    venue: {
      name: string;
    };
  };
}

export function TripLookupPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ first?: string; last?: string }>({});

  useEffect(() => {
    if (!token) {
      setError('No trip link provided.');
      setLoading(false);
      return;
    }
    loadTrip();
  }, [token]);

  const loadTrip = async () => {
    try {
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select(`
          id,
          trip_date,
          trip_time,
          status,
          experience:experiences (
            title,
            venue:venues (
              name
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
    } catch (err) {
      console.error('Error loading trip:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errors: { first?: string; last?: string } = {};
    if (!studentFirstName.trim()) errors.first = 'Required';
    if (!studentLastName.trim()) errors.last = 'Required';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    try {
      const first = studentFirstName.trim().toLowerCase();
      const last = studentLastName.trim().toLowerCase();

      const { data: slips } = await supabase
        .from('permission_slips')
        .select('id, student_id, magic_link_token, status')
        .eq('trip_id', trip!.id);

      if (!slips || slips.length === 0) {
        setError('No permission slips have been set up for this trip yet. Please contact the teacher.');
        setSubmitting(false);
        return;
      }

      const studentIds = slips.map(s => s.student_id);

      const { data: students } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .in('id', studentIds);

      const match = (students || []).find(s =>
        s.first_name.toLowerCase() === first &&
        s.last_name.toLowerCase() === last
      );

      if (!match) {
        setError('We couldn\'t find a student with that name on this trip. Please check the spelling and try again, or contact the teacher.');
        setSubmitting(false);
        return;
      }

      const slip = slips.find(s => s.student_id === match.id);

      if (!slip) {
        setError('No permission slip found for this student. Please contact the teacher.');
        setSubmitting(false);
        return;
      }

      if (slip.status === 'signed' || slip.status === 'paid') {
        setError(`The permission slip for ${match.first_name} ${match.last_name} has already been signed.`);
        setSubmitting(false);
        return;
      }

      let slipToken = slip.magic_link_token;
      if (!slipToken) {
        slipToken = crypto.randomUUID();
        await supabase
          .from('permission_slips')
          .update({ magic_link_token: slipToken })
          .eq('id', slip.id);
      }

      navigate(`/slip/${slip.id}?token=${slipToken}`);
    } catch (err) {
      console.error('Error looking up student:', err);
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
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
            <p className="mt-4 text-gray-600">Loading trip information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !trip) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-8 text-center">
            <div className="text-5xl mb-4">🔗</div>
            <h1 className="text-2xl font-bold text-[#0A0A0A] mb-4">
              Link Not Found
            </h1>
            <p className="text-gray-600">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tripDate = trip ? new Date(trip.trip_date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }) : '';

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="inline-block bg-[#F5C518] border-2 border-[#0A0A0A] rounded-lg px-4 py-1 mb-4 shadow-[2px_2px_0px_#0A0A0A]">
            <span className="font-bold text-[#0A0A0A] text-sm tracking-wide">TRIPSLIP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] mb-2">
            Permission Slip
          </h1>
          {trip && (
            <div className="space-y-1">
              <p className="text-lg font-semibold text-[#0A0A0A]">
                {trip.experience?.title}
              </p>
              <p className="text-gray-600">
                {trip.experience?.venue?.name}
              </p>
              <p className="text-sm text-gray-500">{tripDate}</p>
            </div>
          )}
        </div>

        <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
          <h2 className="text-lg font-bold text-[#0A0A0A] mb-1">
            Enter Your Child's Name
          </h2>
          <p className="text-sm text-gray-600 mb-5">
            Please enter your child's name exactly as it appears on the class roster.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={studentFirstName}
                onChange={(e) => { setStudentFirstName(e.target.value); setFieldErrors(prev => ({ ...prev, first: undefined })); setError(null); }}
                placeholder="e.g. Sofia"
                autoFocus
                autoComplete="off"
                className={`w-full border-2 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] ${
                  fieldErrors.first ? 'border-red-400' : 'border-[#0A0A0A]'
                }`}
              />
              {fieldErrors.first && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.first}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={studentLastName}
                onChange={(e) => { setStudentLastName(e.target.value); setFieldErrors(prev => ({ ...prev, last: undefined })); setError(null); }}
                placeholder="e.g. Garcia"
                autoComplete="off"
                className={`w-full border-2 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] ${
                  fieldErrors.last ? 'border-red-400' : 'border-[#0A0A0A]'
                }`}
              />
              {fieldErrors.last && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.last}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-lg px-4 py-3 text-base font-bold shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-60 disabled:cursor-wait"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                  Looking up...
                </span>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Having trouble? Contact your child's teacher for help.
        </p>
      </div>
    </div>
  );
}
