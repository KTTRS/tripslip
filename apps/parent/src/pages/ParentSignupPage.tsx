import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';

type SignupMethod = 'choose' | 'email' | 'phone';

export function ParentSignupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const slipId = searchParams.get('slip');
  const token = searchParams.get('token');

  const [method, setMethod] = useState<SignupMethod>('choose');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  useEffect(() => {
    if (slipId && token) {
      loadSlipData();
    }
  }, [slipId, token]);

  const loadSlipData = async () => {
    const { data } = await supabase
      .from('permission_slips')
      .select('form_data')
      .eq('id', slipId!)
      .eq('magic_link_token', token!)
      .single();

    if (data?.form_data) {
      const fd = data.form_data as Record<string, string>;
      if (fd.parentName) setParentName(fd.parentName);
      if (fd.parentEmail) {
        setParentEmail(fd.parentEmail);
        setEmail(fd.parentEmail);
      }
      if (fd.parentPhone) {
        setParentPhone(fd.parentPhone);
        setPhone(fd.parentPhone);
      }
    }
  };

  const linkParentRecord = async (userId: string) => {
    const effectiveEmail = parentEmail || email;
    const effectivePhone = parentPhone || phone;
    if (!effectiveEmail && !effectivePhone) return;

    const lookupField = effectiveEmail ? 'email' : 'phone';
    const lookupValue = effectiveEmail || effectivePhone;

    const { data: parent } = await supabase
      .from('parents')
      .select('id, user_id')
      .eq(lookupField, lookupValue)
      .is('user_id', null)
      .limit(1)
      .single();

    if (parent) {
      await supabase
        .from('parents')
        .update({ user_id: userId })
        .eq('id', parent.id);
    } else {
      const nameParts = parentName ? parentName.split(' ') : [];
      const firstName = nameParts[0] || effectiveEmail?.split('@')[0] || 'Parent';
      const lastName = nameParts.slice(1).join(' ') || '';

      await supabase.from('parents').insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        email: effectiveEmail || `${effectivePhone}@phone.tripslip.local`,
        phone: effectivePhone || '',
      });
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in both fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: parentName.split(' ')[0] || '',
            last_name: parentName.split(' ').slice(1).join(' ') || '',
          },
        },
      });

      if (authError) throw authError;
      if (data.user) {
        await linkParentRecord(data.user.id);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError(null);
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (otpError) throw otpError;
      setOtpSent(true);
      setPhone(formattedPhone);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp.trim() || otp.length < 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: otp.trim(),
        type: 'sms',
      });

      if (verifyError) throw verifyError;
      if (data.user) {
        await linkParentRecord(data.user.id);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold text-[#0A0A0A] mb-2">Account Created!</h1>
          <p className="text-gray-600 mb-6">
            Next time you receive a permission slip, your info will be pre-filled. You can also sign in to view all your children's trips.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-4 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold rounded-lg border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all"
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6 py-12">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-display font-bold text-[#0A0A0A]">Create Your Account</h1>
          <p className="text-gray-600 mt-2">
            Save time on future permission slips — your info will be pre-filled
          </p>
        </div>

        {method === 'choose' && (
          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 space-y-4">
            <button
              onClick={() => setMethod('email')}
              className="w-full flex items-center gap-4 px-4 py-4 bg-white border-2 border-[#0A0A0A] rounded-lg hover:shadow-[4px_4px_0px_#0A0A0A] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <div className="w-12 h-12 bg-[#F5C518] rounded-lg border-2 border-[#0A0A0A] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[#0A0A0A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-bold text-[#0A0A0A]">Sign up with Email</p>
                <p className="text-sm text-gray-500">Use your email and create a password</p>
              </div>
            </button>

            <button
              onClick={() => setMethod('phone')}
              className="w-full flex items-center gap-4 px-4 py-4 bg-white border-2 border-[#0A0A0A] rounded-lg hover:shadow-[4px_4px_0px_#0A0A0A] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <div className="w-12 h-12 bg-[#E8F5E9] rounded-lg border-2 border-[#0A0A0A] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[#0A0A0A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-bold text-[#0A0A0A]">Sign up with Phone</p>
                <p className="text-sm text-gray-500">We'll send you a verification code</p>
              </div>
            </button>

            <p className="text-center text-sm text-gray-500 pt-2">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-[#0A0A0A] font-bold underline">
                Sign in
              </button>
            </p>
          </div>
        )}

        {method === 'email' && (
          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#0A0A0A] mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-[#0A0A0A] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#0A0A0A] mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-[#0A0A0A] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold rounded-lg border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-60"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
              <button
                type="button"
                onClick={() => { setMethod('choose'); setError(null); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Back to options
              </button>
            </form>
          </div>
        )}

        {method === 'phone' && !otpSent && (
          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#0A0A0A] mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border-2 border-[#0A0A0A] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                placeholder="(312) 555-1234"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full px-4 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold rounded-lg border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-60"
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
            <button
              onClick={() => { setMethod('choose'); setError(null); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Back to options
            </button>
          </div>
        )}

        {method === 'phone' && otpSent && (
          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-gray-600 mb-2">
                We sent a 6-digit code to <span className="font-bold">{phone}</span>
              </p>
              <div>
                <label className="block text-sm font-bold text-[#0A0A0A] mb-1">Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full border-2 border-[#0A0A0A] rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold rounded-lg border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-60"
              >
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(''); setError(null); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Use a different number
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
