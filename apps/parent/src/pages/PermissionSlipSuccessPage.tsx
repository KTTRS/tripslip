import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { LanguageSelector } from '../components/LanguageSelector';

interface SlipData {
  id: string;
  signed_at: string;
  form_data: {
    studentFirstName?: string;
    studentLastName?: string;
    parentName?: string;
    parentEmail?: string;
  } | null;
  trips: {
    trip_date: string;
    experience: {
      title: string;
    } | null;
    experiences: {
      title: string;
    } | null;
  };
}

export function PermissionSlipSuccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const slipId = searchParams.get('slip');
  const token = searchParams.get('token');

  const [slip, setSlip] = useState<SlipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showSignup, setShowSignup] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signingUp, setSigningUp] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  useEffect(() => {
    if (!slipId || !token) {
      setError('Invalid link');
      setLoading(false);
      return;
    }
    fetchSlip();
  }, [slipId, token]);

  const fetchSlip = async () => {
    if (!slipId || !token) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('permission_slips')
        .select(`
          id,
          signed_at,
          form_data,
          trips (
            trip_date,
            experience:experiences (
              title
            )
          )
        `)
        .eq('id', slipId)
        .eq('magic_link_token', token)
        .single();

      if (fetchError || !data) {
        throw new Error('Permission slip not found');
      }

      const slipData = data as unknown as SlipData;
      setSlip(slipData);

      if (slipData.form_data?.parentEmail) {
        setSignupEmail(slipData.form_data.parentEmail);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!signupEmail.trim() || !signupPassword.trim()) {
      setSignupError('Please fill in both fields');
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters');
      return;
    }

    setSigningUp(true);

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
      });

      if (authError) {
        throw authError;
      }

      setSignupDone(true);
    } catch (err: any) {
      setSignupError(err.message || 'Failed to create account');
    } finally {
      setSigningUp(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="absolute top-4 right-4"><LanguageSelector /></div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !slip) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
        <div className="absolute top-4 right-4"><LanguageSelector /></div>
        <div className="max-w-md w-full bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h1 className="text-2xl font-bold text-[#0A0A0A] mb-4">Something went wrong</h1>
          <p className="text-gray-600">{error || 'Permission slip not found'}</p>
        </div>
      </div>
    );
  }

  const studentName = slip.form_data?.studentFirstName && slip.form_data?.studentLastName
    ? `${slip.form_data.studentFirstName} ${slip.form_data.studentLastName}`
    : slip.form_data?.parentName
    ? `your child`
    : 'your child';

  const tripTitle = slip.trips?.experience?.title || slip.trips?.experiences?.title || 'the field trip';
  const tripDate = slip.trips?.trip_date
    ? new Date(slip.trips.trip_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="absolute top-4 right-4"><LanguageSelector /></div>
      <div className="max-w-md w-full space-y-6 py-12">
        <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[#0A0A0A] mb-2">
            Permission Slip Signed!
          </h1>

          <p className="text-gray-600 mb-6">
            You've signed the permission slip for {studentName} to attend {tripTitle}.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Trip</span>
              <span className="font-medium text-[#0A0A0A]">{tripTitle}</span>
            </div>
            {tripDate && (
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-[#0A0A0A]">{tripDate}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Student</span>
              <span className="font-medium text-[#0A0A0A]">{studentName}</span>
            </div>
            {slip.signed_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">Signed</span>
                <span className="font-medium text-[#0A0A0A]">{new Date(slip.signed_at).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 text-left">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">What's Next?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>The teacher will be notified automatically</li>
              <li>You may receive reminders as the trip date approaches</li>
              <li>Contact the teacher if you have any questions</li>
            </ul>
          </div>
        </div>

        {!signupDone && (
          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
            {!showSignup ? (
              <div className="text-center">
                <h3 className="font-bold text-[#0A0A0A] mb-2">Save Time Next Time</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create a free account so your information is pre-filled on future permission slips. You'll just need to review and sign.
                </p>
                <button
                  onClick={() => setShowSignup(true)}
                  className="w-full px-4 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold rounded-lg border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Create Free Account
                </button>
                <button
                  onClick={() => setSignupDone(true)}
                  className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  No thanks
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <h3 className="font-bold text-[#0A0A0A]">Create Your Account</h3>
                <div>
                  <label htmlFor="signupEmail" className="block text-sm font-semibold text-[#0A0A0A] mb-1">Email</label>
                  <input
                    id="signupEmail"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full border-2 border-[#0A0A0A] rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label htmlFor="signupPassword" className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                    Create a Password
                  </label>
                  <input
                    id="signupPassword"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full border-2 border-[#0A0A0A] rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                  />
                </div>
                {signupError && (
                  <p className="text-sm text-red-600">{signupError}</p>
                )}
                <button
                  type="submit"
                  disabled={signingUp}
                  className="w-full px-4 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold rounded-lg border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-60"
                >
                  {signingUp ? 'Creating...' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignup(false)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}

        {signupDone && showSignup && (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-green-800 mb-1">Account Created!</h3>
            <p className="text-sm text-green-700">
              Next time you get a permission slip link, your info will be pre-filled. You'll just need to sign!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
