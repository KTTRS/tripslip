import { useState, useEffect } from 'react';
import { useParams } from 'react-router';

interface TripInfo {
  id: string;
  trip_date: string;
  trip_time?: string;
  status: string;
  student_count: number;
  direct_link_token: string;
  experience: {
    title: string;
    description: string;
    duration_minutes?: number;
    venue: {
      name: string;
      address: any;
    };
  };
}

interface TripForm {
  id: string;
  title: string;
  form_type: string;
  description: string;
  file_url: string;
  required: boolean;
  source: string;
}

export default function TripConsentReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [tripForms, setTripForms] = useState<TripForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [parentLinkCopied, setParentLinkCopied] = useState(false);

  useEffect(() => {
    if (token) loadTrip();
  }, [token]);

  const loadTrip = async () => {
    try {
      const resp = await fetch('/api/trip/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const result = await resp.json();

      if (!resp.ok || !result.trip) {
        setError('Trip not found. This link may be invalid or expired.');
        setLoading(false);
        return;
      }

      setTrip(result.trip as TripInfo);
      if (result.forms) setTripForms(result.forms as TripForm[]);
    } catch {
      setError('Something went wrong loading the trip.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacherForm = async () => {
    if (!newFormTitle.trim() || !trip) return;
    setSaving(true);
    try {
      const resp = await fetch('/api/trip/add-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          title: newFormTitle.trim(),
          description: newFormDescription.trim(),
        }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error);
      if (result.form) {
        setTripForms(prev => [...prev, result.form as TripForm]);
        setNewFormTitle('');
        setNewFormDescription('');
        setShowAddForm(false);
      }
    } catch {
      alert('Failed to add requirement');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTeacherForm = async (formId: string) => {
    try {
      const resp = await fetch('/api/trip/remove-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, form_id: formId }),
      });
      if (!resp.ok) throw new Error('Failed');
      setTripForms(prev => prev.filter(f => f.id !== formId));
    } catch {
      alert('Failed to remove form');
    }
  };

  const getParentLink = () => {
    return `${window.location.origin}/parent/trip/${trip?.direct_link_token}`;
  };

  const copyParentLink = async () => {
    await navigator.clipboard.writeText(getParentLink());
    setParentLinkCopied(true);
    setTimeout(() => setParentLinkCopied(false), 2000);
  };

  const copyTeacherLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading consent review...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-8 text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-[#0A0A0A] mb-4">Link Not Found</h1>
          <p className="text-gray-600">{error || 'Trip not found.'}</p>
        </div>
      </div>
    );
  }

  const venueForms = tripForms.filter(f => f.source === 'venue');
  const teacherForms = tripForms.filter(f => f.source === 'teacher');

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src="/images/tripslip-logo.png" alt="TripSlip" className="h-14 w-auto object-contain" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0A0A0A] mb-2">
            Consent Review
          </h1>
          <p className="text-gray-500 text-sm">
            Review the consent requirements before sharing with parents.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
            <h2 className="text-xl font-bold text-[#0A0A0A] mb-4">Trip Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Experience</p>
                <p className="text-[#0A0A0A] font-semibold">{trip.experience?.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Venue</p>
                <p className="text-[#0A0A0A]">{trip.experience?.venue?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-[#0A0A0A]">{formatDate(trip.trip_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Students</p>
                <p className="text-[#0A0A0A]">{trip.student_count}</p>
              </div>
              {trip.experience?.duration_minutes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="text-[#0A0A0A]">
                    {Math.floor(trip.experience.duration_minutes / 60)}h
                    {trip.experience.duration_minutes % 60 > 0 ? ` ${trip.experience.duration_minutes % 60}m` : ''}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${
                  trip.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  trip.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {trip.status}
                </span>
              </div>
            </div>
            {trip.experience?.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">{trip.experience.description}</p>
              </div>
            )}
          </div>

          {venueForms.length > 0 && (
            <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
              <h2 className="text-xl font-bold text-[#0A0A0A] mb-1">Venue Required Forms</h2>
              <p className="text-sm text-gray-500 mb-4">These forms are required by the venue. Parents must agree before signing.</p>
              <div className="space-y-3">
                {venueForms.map((form) => (
                  <div key={form.id} className="p-4 rounded-lg border-2 border-[#F5C518]/50 bg-[#F5C518]/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-[#0A0A0A]">{form.title}</h3>
                        <p className="text-xs text-gray-500 capitalize mt-0.5">{form.form_type.replace(/_/g, ' ')}</p>
                        {form.description && (
                          <p className="text-sm text-gray-600 mt-2">{form.description}</p>
                        )}
                      </div>
                      {form.required && (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Required</span>
                      )}
                    </div>
                    {form.file_url && (
                      <a
                        href={form.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                      >
                        View Document
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {teacherForms.length > 0 && (
            <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
              <h2 className="text-xl font-bold text-[#0A0A0A] mb-1">Your Additional Requirements</h2>
              <p className="text-sm text-gray-500 mb-4">These are your custom requirements that parents must also agree to.</p>
              <div className="space-y-3">
                {teacherForms.map((form) => (
                  <div key={form.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-[#0A0A0A]">{form.title}</h3>
                      {form.description && (
                        <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveTeacherForm(form.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold ml-4 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
            <h2 className="text-xl font-bold text-[#0A0A0A] mb-4">Customize Consent Requirements</h2>
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-[#F5C518] hover:text-[#0A0A0A] transition-colors text-sm font-semibold"
              >
                + Add Additional Requirement for Parents
              </button>
            ) : (
              <div className="space-y-3 border-2 border-[#F5C518] rounded-lg p-4 bg-[#F5C518]/5">
                <div>
                  <label className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                    Requirement Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newFormTitle}
                    onChange={(e) => setNewFormTitle(e.target.value)}
                    placeholder="e.g. Student Device Agreement"
                    className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                    Description / Details
                  </label>
                  <textarea
                    value={newFormDescription}
                    onChange={(e) => setNewFormDescription(e.target.value)}
                    placeholder="Describe what parents need to agree to..."
                    rows={3}
                    className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setShowAddForm(false); setNewFormTitle(''); setNewFormDescription(''); }}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTeacherForm}
                    disabled={saving || !newFormTitle.trim()}
                    className="px-4 py-2 text-sm font-bold text-black bg-[#F5C518] border-2 border-black rounded-lg shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                  >
                    {saving ? 'Adding...' : 'Add Requirement'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#F5C518]/10 border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
            <h2 className="text-xl font-bold text-[#0A0A0A] mb-4">Share with Parents</h2>
            <p className="text-sm text-gray-600 mb-4">
              Copy the parent link below and share it with your students' parents. They will see all required consent forms and can sign digitally.
            </p>

            <div className="bg-white border-2 border-black rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Parent Permission Slip Link</span>
              </div>
              <p className="text-sm font-mono break-all text-gray-700 mb-3">
                {getParentLink()}
              </p>
              <button
                onClick={copyParentLink}
                className="w-full px-4 py-3 text-sm font-bold text-black bg-[#F5C518] border-2 border-black rounded-lg shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
              >
                {parentLinkCopied ? (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    Copy Parent Link
                  </>
                )}
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">This Review Page Link</span>
              </div>
              <p className="text-sm font-mono break-all text-gray-700 mb-3">
                {window.location.href}
              </p>
              <button
                onClick={copyTeacherLink}
                className="w-full px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border-2 border-gray-300 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                {copied ? 'Copied!' : 'Copy Review Link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
