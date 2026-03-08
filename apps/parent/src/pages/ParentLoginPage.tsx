import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';

export function ParentLoginPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please fill in both fields');
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
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
      const { error: otpError } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
      if (otpError) throw otpError;
      setOtpSent(true);
      setPhone(formattedPhone);
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
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
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: otp.trim(),
        type: 'sms',
      });
      if (verifyError) throw verifyError;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6 py-12">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#F5C518] rounded-full border-2 border-[#0A0A0A] flex items-center justify-center">
              <span className="text-[#0A0A0A] font-bold text-lg">T</span>
            </div>
            <span className="text-2xl font-bold text-[#0A0A0A]">TripSlip</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-[#0A0A0A]">Parent Sign In</h1>
          <p className="text-gray-600 mt-2">View your children's trips and permission slips</p>
        </div>

        <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setMethod('email'); setError(null); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg border-2 border-[#0A0A0A] transition-all ${
                method === 'email' ? 'bg-[#F5C518] text-[#0A0A0A]' : 'bg-white text-gray-500'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => { setMethod('phone'); setError(null); setOtpSent(false); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg border-2 border-[#0A0A0A] transition-all ${
                method === 'phone' ? 'bg-[#F5C518] text-[#0A0A0A]' : 'bg-white text-gray-500'
              }`}
            >
              Phone
            </button>
          </div>

          {method === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold rounded-lg border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-60"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          {method === 'phone' && !otpSent && (
            <div className="space-y-4">
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
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          )}

          {method === 'phone' && otpSent && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-gray-600">
                Code sent to <span className="font-bold">{phone}</span>
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
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(''); setError(null); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Use a different number
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')} className="text-[#0A0A0A] font-bold underline">
            Sign up free
          </button>
        </p>
      </div>
    </div>
  );
}
