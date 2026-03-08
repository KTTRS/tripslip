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
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 relative overflow-hidden">
      <img src="/images/icon-bus.png" alt="" className="absolute top-8 left-8 w-20 h-20 object-contain opacity-60 animate-float hidden sm:block drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
      <img src="/images/icon-backpack.png" alt="" className="absolute bottom-12 right-8 w-24 h-24 object-contain opacity-50 animate-bounce-slow hidden sm:block drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
      <img src="/images/icon-compass.png" alt="" className="absolute top-16 right-20 w-16 h-16 object-contain opacity-40 animate-float-delayed hidden md:block drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />

      <div className="max-w-md w-full py-12 relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-start gap-6 mb-4">
            <div className="hidden sm:block">
              <img
                src="/images/char-pink-heart.png"
                alt=""
                className="w-28 h-28 object-contain animate-float drop-shadow-lg"
              />
              <p className="text-center text-sm font-bold text-gray-400 mt-1">Welcome back, Parent!</p>
              <p className="text-center text-xs text-gray-400">Stay in the loop on your child's trips</p>
            </div>
            <div className="bg-white border-3 border-[#0A0A0A] rounded-2xl shadow-[6px_6px_0px_#0A0A0A] p-8 w-full">
              <div className="flex items-center justify-center mb-4">
                <img src="/images/tripslip-logo.png" alt="TripSlip" className="h-14 w-auto object-contain" />
              </div>
              <h1 className="text-2xl font-display font-bold text-[#0A0A0A] text-center">Parent Sign In</h1>
              <p className="text-gray-500 text-sm text-center mt-1 mb-6">View your children's trips and permission slips</p>

              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => { setMethod('email'); setError(null); }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl border-2 border-[#0A0A0A] transition-all ${
                    method === 'email' ? 'bg-[#F5C518] text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]' : 'bg-white text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  Email
                </button>
                <button
                  onClick={() => { setMethod('phone'); setError(null); setOtpSent(false); }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl border-2 border-[#0A0A0A] transition-all ${
                    method === 'phone' ? 'bg-[#F5C518] text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]' : 'bg-white text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  Phone
                </button>
              </div>

              {method === 'email' && (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-[#0A0A0A] mb-1">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] transition-all"
                      placeholder="your@email.com"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-bold text-[#0A0A0A] mb-1">Password</label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] transition-all"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold rounded-xl border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-60 disabled:hover:shadow-[4px_4px_0px_#0A0A0A] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>
              )}

              {method === 'phone' && !otpSent && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-bold text-[#0A0A0A] mb-1">Phone Number</label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] transition-all"
                      placeholder="(312) 555-1234"
                      autoFocus
                    />
                    <p className="text-xs text-gray-400 mt-1">We'll text you a one-time code</p>
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold rounded-xl border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-60 disabled:hover:shadow-[4px_4px_0px_#0A0A0A] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                  >
                    {loading ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </div>
              )}

              {method === 'phone' && otpSent && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <p className="text-sm text-green-700">Code sent to <span className="font-bold">{phone}</span></p>
                  </div>
                  <div>
                    <label htmlFor="otp" className="block text-sm font-bold text-[#0A0A0A] mb-1">Verification Code</label>
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] transition-all"
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                      autoComplete="one-time-code"
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold rounded-xl border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-60 disabled:hover:shadow-[4px_4px_0px_#0A0A0A] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                  >
                    {loading ? 'Verifying...' : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); setError(null); }}
                    className="w-full text-sm text-gray-500 hover:text-[#0A0A0A] font-medium transition-colors"
                  >
                    Use a different number
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')} className="text-[#0A0A0A] font-bold hover:text-[#F5C518] transition-colors underline underline-offset-2">
            Sign up free
          </button>
        </p>
      </div>
    </div>
  );
}
