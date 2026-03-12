import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { buildParentTripUrl } from '@tripslip/utils';

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

interface PermissionSlip {
  id: string;
  status: string;
  student_name: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  signature: string | null;
  form_data: {
    studentGrade?: string;
    studentAddress?: string;
    studentCityStateZip?: string;
    studentAllergies?: string;
    schoolOrganization?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    formAgreements?: Array<{ form_id: string; form_title: string; agreed_at: string }>;
  };
  signed_at: string;
}

export default function TripConsentReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [tripForms, setTripForms] = useState<TripForm[]>([]);
  const [slips, setSlips] = useState<PermissionSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<'manual' | 'upload'>('manual');
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [parentLinkCopied, setParentLinkCopied] = useState(false);
  const [expandedSlip, setExpandedSlip] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [showManifestGate, setShowManifestGate] = useState(false);
  const [clonedToken, setClonedToken] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherSchool, setTeacherSchool] = useState('');
  const [teacherClass, setTeacherClass] = useState('');
  const [teacherInfoSaved, setTeacherInfoSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const manifestGateRef = useRef<HTMLDivElement>(null);

  const getTeacherSessionId = () => {
    let sid = localStorage.getItem('tripslip_teacher_session');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('tripslip_teacher_session', sid);
    }
    return sid;
  };

  const loadSavedTeacherInfo = () => {
    try {
      const saved = localStorage.getItem('tripslip_teacher_info');
      if (saved) {
        const info = JSON.parse(saved);
        if (info.name) setTeacherName(info.name);
        if (info.school) setTeacherSchool(info.school);
        if (info.className) setTeacherClass(info.className);
        if (info.name && info.school) setTeacherInfoSaved(true);
      }
    } catch { /* ignore */ }
  };

  const saveTeacherInfo = (name: string, school: string, className: string) => {
    try {
      localStorage.setItem('tripslip_teacher_info', JSON.stringify({ name, school, className }));
      setTeacherInfoSaved(true);
    } catch { /* ignore */ }
  };

  const getSavedCloneToken = () => {
    try {
      const map = JSON.parse(localStorage.getItem('tripslip_cloned_trips') || '{}');
      return map[token || ''] || null;
    } catch { return null; }
  };

  const saveCloneToken = (sourceToken: string, cloneToken: string) => {
    try {
      const map = JSON.parse(localStorage.getItem('tripslip_cloned_trips') || '{}');
      map[sourceToken] = cloneToken;
      localStorage.setItem('tripslip_cloned_trips', JSON.stringify(map));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadSavedTeacherInfo();
    if (token) loadTrip();
  }, [token]);

  const loadTrip = async () => {
    try {
      const resp = await fetch('/api/trip/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, role: 'teacher' }),
      });
      const result = await resp.json();

      if (!resp.ok || !result.trip) {
        setError('Trip not found. This link may be invalid or expired.');
        setLoading(false);
        return;
      }

      setTrip(result.trip as TripInfo);
      if (result.forms) setTripForms(result.forms as TripForm[]);

      const savedClone = getSavedCloneToken();
      if (savedClone) {
        setClonedToken(savedClone);
        const cloneResp = await fetch('/api/trip/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: savedClone, role: 'teacher' }),
        });
        const cloneResult = await cloneResp.json();
        if (cloneResp.ok && cloneResult.slips) {
          setSlips(cloneResult.slips as PermissionSlip[]);
        }
      } else {
        if (result.slips) setSlips(result.slips as PermissionSlip[]);
      }
    } catch {
      setError('Something went wrong loading the trip.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateParentLink = async () => {
    if (!token) return;
    setGeneratingLink(true);
    try {
      const sessionId = getTeacherSessionId();
      const resp = await fetch('/api/trip/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_token: token,
          teacher_session_id: sessionId,
          teacher_name: teacherName.trim(),
          teacher_school: teacherSchool.trim(),
          teacher_class: teacherClass.trim(),
        }),
      });
      const result = await resp.json();
      if (resp.ok && result.clone_token) {
        setClonedToken(result.clone_token);
        saveCloneToken(token, result.clone_token);
        if (!result.already_existed) {
          setSlips([]);
        }
      } else {
        alert(result.error || 'Failed to generate parent link. Please try again.');
      }
    } catch {
      alert('Failed to generate parent link. Please try again.');
    } finally {
      setGeneratingLink(false);
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
          token: clonedToken || token,
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

  const handleUploadTeacherForm = async () => {
    if (!uploadFile || !trip) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('token', clonedToken || token || '');
      formData.append('title', (uploadTitle.trim() || uploadFile.name));

      const resp = await fetch('/api/trip/upload-form', {
        method: 'POST',
        body: formData,
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error);
      if (result.form) {
        setTripForms(prev => [...prev, result.form as TripForm]);
        setUploadFile(null);
        setUploadTitle('');
        setShowAddForm(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch {
      alert('Failed to upload file');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTeacherForm = async (formId: string) => {
    try {
      const resp = await fetch('/api/trip/remove-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: clonedToken || token, form_id: formId }),
      });
      if (!resp.ok) throw new Error('Failed');
      setTripForms(prev => prev.filter(f => f.id !== formId));
    } catch {
      alert('Failed to remove form');
    }
  };

  const getParentLink = () => {
    const linkToken = clonedToken || trip?.direct_link_token;
    return buildParentTripUrl(linkToken);
  };

  const copyToClipboard = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
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
  const signedSlips = slips.filter(s => s.status === 'signed');

  if (!teacherInfoSaved) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="max-w-lg mx-auto px-4 py-8 sm:py-16">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src="/images/tripslip-logo.png" alt="TripSlip" className="h-14 w-auto object-contain" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0A0A0A] mb-2">
              Welcome, Teacher!
            </h1>
            <p className="text-gray-500 text-sm">
              Before you review this trip, please tell us a bit about yourself so parents and the venue know who you are.
            </p>
          </div>

          {trip && (
            <div className="bg-[#F5C518]/10 border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-5 mb-6">
              <p className="text-sm font-medium text-gray-500">Trip</p>
              <p className="text-lg font-bold text-[#0A0A0A]">{trip.experience?.title}</p>
              <p className="text-sm text-gray-600 mt-1">{trip.experience?.venue?.name} &middot; {formatDate(trip.trip_date)}</p>
            </div>
          )}

          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#0A0A0A] mb-1">Your Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="e.g. Ms. Johnson"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#F5C518] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#0A0A0A] mb-1">School Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={teacherSchool}
                  onChange={(e) => setTeacherSchool(e.target.value)}
                  placeholder="e.g. Detroit Academy"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#F5C518] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#0A0A0A] mb-1">Class / Grade</label>
                <input
                  type="text"
                  value={teacherClass}
                  onChange={(e) => setTeacherClass(e.target.value)}
                  placeholder="e.g. 5th Grade, Period 3, Room 204"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#F5C518] focus:outline-none text-sm"
                />
              </div>

              <button
                onClick={() => {
                  if (!teacherName.trim() || !teacherSchool.trim()) {
                    alert('Please enter your name and school.');
                    return;
                  }
                  saveTeacherInfo(teacherName.trim(), teacherSchool.trim(), teacherClass.trim());
                }}
                className="w-full px-4 py-4 text-sm font-bold text-black bg-[#F5C518] border-2 border-black rounded-lg shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Continue to Trip Review
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src="/images/tripslip-logo.png" alt="TripSlip" className="h-14 w-auto object-contain" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0A0A0A] mb-2">
            Consent Review
          </h1>
          <p className="text-gray-500 text-sm">
            Review consent requirements and track parent responses.
          </p>
          {teacherName && (
            <p className="text-sm text-gray-600 mt-2">
              {teacherName}{teacherSchool ? ` · ${teacherSchool}` : ''}{teacherClass ? ` · ${teacherClass}` : ''}
            </p>
          )}
        </div>

        <div className="space-y-6">
          {/* Trip Details */}
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
          </div>

          {/* Parent Responses Manifest */}
          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#0A0A0A]">Parent Responses</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                signedSlips.length > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
              }`}>
                {signedSlips.length} returned
              </span>
            </div>

            {signedSlips.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    setShowManifestGate(true);
                    setTimeout(() => manifestGateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                  }}
                  className="w-full px-4 py-3 text-sm font-bold text-black bg-[#F5C518] border-2 border-black rounded-lg shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Create Manifest
                </button>
              </div>
            )}

            {signedSlips.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-500 font-medium">No permission slips returned yet</p>
                <p className="text-gray-400 text-sm mt-1">Share the parent link below and responses will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Summary Table Header */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-4 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-3">Student</div>
                  <div className="col-span-3">Parent/Guardian</div>
                  <div className="col-span-2">Phone</div>
                  <div className="col-span-2">School</div>
                  <div className="col-span-2">Signed</div>
                </div>

                {signedSlips.map((slip) => (
                  <div key={slip.id} className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-[#F5C518] transition-colors">
                    <button
                      onClick={() => setExpandedSlip(expandedSlip === slip.id ? null : slip.id)}
                      className="w-full text-left"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 py-3 items-center">
                        <div className="sm:col-span-3">
                          <p className="font-semibold text-[#0A0A0A] text-sm">{slip.student_name}</p>
                          <p className="text-xs text-gray-400 sm:hidden">{slip.parent_name}</p>
                        </div>
                        <div className="sm:col-span-3 hidden sm:block">
                          <p className="text-sm text-[#0A0A0A]">{slip.parent_name}</p>
                          <p className="text-xs text-gray-400">{slip.parent_email}</p>
                        </div>
                        <div className="sm:col-span-2 hidden sm:block">
                          <p className="text-sm text-[#0A0A0A]">{slip.parent_phone}</p>
                        </div>
                        <div className="sm:col-span-2 hidden sm:block">
                          <p className="text-sm text-[#0A0A0A]">{slip.form_data?.schoolOrganization || '—'}</p>
                        </div>
                        <div className="sm:col-span-2 flex items-center justify-between">
                          <span className="text-xs text-gray-500 hidden sm:inline">
                            {formatDateTime(slip.signed_at)}
                          </span>
                          <svg className={`h-4 w-4 text-gray-400 transition-transform ${expandedSlip === slip.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>

                    {expandedSlip === slip.id && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-bold text-[#0A0A0A] mb-2 text-xs uppercase tracking-wider">Student Information</h4>
                            <div className="space-y-1">
                              <p><span className="text-gray-500">Name:</span> {slip.student_name}</p>
                              {slip.form_data?.studentGrade && <p><span className="text-gray-500">Grade:</span> {slip.form_data.studentGrade}</p>}
                              {slip.form_data?.schoolOrganization && <p><span className="text-gray-500">School:</span> {slip.form_data.schoolOrganization}</p>}
                              {slip.form_data?.studentAddress && <p><span className="text-gray-500">Address:</span> {slip.form_data.studentAddress}</p>}
                              {slip.form_data?.studentCityStateZip && <p><span className="text-gray-500">City/State/Zip:</span> {slip.form_data.studentCityStateZip}</p>}
                              {slip.form_data?.studentAllergies && (
                                <p><span className="text-gray-500">Allergies/Medical:</span> <span className="text-red-600 font-medium">{slip.form_data.studentAllergies}</span></p>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-bold text-[#0A0A0A] mb-2 text-xs uppercase tracking-wider">Parent/Guardian</h4>
                            <div className="space-y-1">
                              <p><span className="text-gray-500">Name:</span> {slip.parent_name}</p>
                              <p><span className="text-gray-500">Email:</span> {slip.parent_email}</p>
                              <p><span className="text-gray-500">Phone:</span> {slip.parent_phone}</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-bold text-[#0A0A0A] mb-2 text-xs uppercase tracking-wider">Emergency Contact</h4>
                            <div className="space-y-1">
                              <p><span className="text-gray-500">Name:</span> {slip.form_data?.emergencyContactName || '—'}</p>
                              <p><span className="text-gray-500">Phone:</span> {slip.form_data?.emergencyContactPhone || '—'}</p>
                              <p><span className="text-gray-500">Relationship:</span> {slip.form_data?.emergencyContactRelationship || '—'}</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-bold text-[#0A0A0A] mb-2 text-xs uppercase tracking-wider">Consent & Signature</h4>
                            <div className="space-y-1">
                              <p><span className="text-gray-500">Signed:</span> {formatDateTime(slip.signed_at)}</p>
                              {slip.form_data?.formAgreements && slip.form_data.formAgreements.length > 0 && (
                                <div className="mt-1">
                                  <p className="text-gray-500 text-xs">Agreed to:</p>
                                  {slip.form_data.formAgreements.map((a, i) => (
                                    <p key={i} className="text-xs text-green-700 flex items-center gap-1">
                                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                      {a.form_title}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {slip.signature && (
                                <div className="mt-2">
                                  <p className="text-gray-500 text-xs mb-1">Signature:</p>
                                  <img src={slip.signature} alt="Parent signature" className="h-12 border border-gray-200 rounded bg-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Venue Required Forms */}
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

          {/* Teacher Additional Requirements */}
          {teacherForms.length > 0 && (
            <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
              <h2 className="text-xl font-bold text-[#0A0A0A] mb-1">Your Additional Requirements</h2>
              <p className="text-sm text-gray-500 mb-4">These are your custom requirements that parents must also agree to.</p>
              <div className="space-y-3">
                {teacherForms.map((form) => (
                  <div key={form.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#0A0A0A]">{form.title}</h3>
                      {form.description && (
                        <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                      )}
                      {form.file_url && (
                        <a
                          href={form.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          View Attached Document
                        </a>
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

          {/* Add Requirements Section */}
          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
            <h2 className="text-xl font-bold text-[#0A0A0A] mb-4">Add Requirements for Parents</h2>
            {!showAddForm ? (
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowAddForm(true); setAddMode('manual'); }}
                  className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-[#F5C518] hover:text-[#0A0A0A] transition-colors text-sm font-semibold"
                >
                  + Type a Requirement
                </button>
                <button
                  onClick={() => { setShowAddForm(true); setAddMode('upload'); }}
                  className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-[#F5C518] hover:text-[#0A0A0A] transition-colors text-sm font-semibold"
                >
                  + Upload a Document
                </button>
              </div>
            ) : addMode === 'manual' ? (
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
            ) : (
              <div className="space-y-3 border-2 border-[#F5C518] rounded-lg p-4 bg-[#F5C518]/5">
                <div>
                  <label className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Code of Conduct Agreement (optional — uses filename if blank)"
                    className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0A0A0A] mb-1">
                    Upload File <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm bg-white file:mr-3 file:px-3 file:py-1 file:border-0 file:rounded file:bg-[#F5C518] file:font-semibold file:text-sm file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Accepted formats: PDF, DOC, DOCX, TXT</p>
                </div>
                {uploadFile && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded px-3 py-2 border border-gray-200">
                    <svg className="h-4 w-4 text-[#F5C518]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {uploadFile.name} ({(uploadFile.size / 1024).toFixed(0)} KB)
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setShowAddForm(false); setUploadFile(null); setUploadTitle(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadTeacherForm}
                    disabled={saving || !uploadFile}
                    className="px-4 py-2 text-sm font-bold text-black bg-[#F5C518] border-2 border-black rounded-lg shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                  >
                    {saving ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Share with Parents */}
          <div className="bg-[#F5C518]/10 border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
            <h2 className="text-xl font-bold text-[#0A0A0A] mb-4">Share with Parents</h2>

            {clonedToken ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Copy your unique parent link below and share it with your students' parents. Responses will appear in the Parent Responses section above.
                </p>

                <div className="bg-white border-2 border-black rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Parent Permission Slip Link</span>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Unique to you</span>
                  </div>
                  <p className="text-sm font-mono break-all text-gray-700 mb-3">
                    {getParentLink()}
                  </p>
                  <button
                    onClick={() => copyToClipboard(getParentLink(), setParentLinkCopied)}
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

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-700">
                    <strong>Note:</strong> This parent link is unique to you. Each teacher who opens this review page gets their own link, so parent responses stay organized per teacher.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Generate your own unique parent link to share with your students' parents. Each teacher gets their own link so responses stay separated.
                </p>

                <button
                  onClick={handleGenerateParentLink}
                  disabled={generatingLink}
                  className="w-full px-4 py-4 text-sm font-bold text-black bg-[#F5C518] border-2 border-black rounded-lg shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-4"
                >
                  {generatingLink ? (
                    <>
                      <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Generate My Parent Link
                    </>
                  )}
                </button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    <strong>Why generate a link?</strong> Each teacher gets their own parent link so that permission slip responses are organized by classroom. Your parents' responses will only appear on your review page.
                  </p>
                </div>
              </>
            )}

            <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">This Review Page Link</span>
              </div>
              <p className="text-sm font-mono break-all text-gray-700 mb-3">
                {window.location.href}
              </p>
              <button
                onClick={() => copyToClipboard(window.location.href, setCopied)}
                className="w-full px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border-2 border-gray-300 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                {copied ? 'Copied!' : 'Copy Review Link'}
              </button>
            </div>
          </div>

          {showManifestGate && (
            <div ref={manifestGateRef} className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">📋</div>
                <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2">Trip Manifest</h2>
                <p className="text-gray-600 text-sm max-w-lg mx-auto">
                  Create a complete trip manifest with everything you need for a safe, organized field trip. Sign up for a free teacher account to unlock this feature.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="border-2 border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <h3 className="font-bold text-[#0A0A0A] text-sm mb-1">Attendance Checkpoints</h3>
                  <p className="text-xs text-gray-500">Check students on/off the bus and at the venue with tap-to-confirm attendance tracking.</p>
                </div>
                <div className="border-2 border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">🚨</div>
                  <h3 className="font-bold text-[#0A0A0A] text-sm mb-1">Emergency Info</h3>
                  <p className="text-xs text-gray-500">All emergency contacts, allergies, and medical notes in one place — accessible even offline.</p>
                </div>
                <div className="border-2 border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">📥</div>
                  <h3 className="font-bold text-[#0A0A0A] text-sm mb-1">Exportable Roster</h3>
                  <p className="text-xs text-gray-500">Download a printable PDF or CSV roster with all student and parent details for your records.</p>
                </div>
              </div>

              <div className="text-center space-y-3">
                <Link
                  to="/signup"
                  className="inline-block w-full sm:w-auto px-8 py-3 text-sm font-bold text-black bg-[#F5C518] border-2 border-black rounded-lg shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Create Free Teacher Account
                </Link>
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#0A0A0A] font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          )}

          <div className="bg-white border-2 border-[#F5C518] rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl shrink-0">🎒</div>
              <div className="flex-1">
                <h3 className="font-bold text-[#0A0A0A] mb-1">Get More from TripSlip</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Create a free teacher account to manage all your trips in one place — track consent status, generate manifests, and communicate with parents effortlessly.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/signup"
                    className="inline-block px-5 py-2 text-sm font-bold text-black bg-[#F5C518] border-2 border-black rounded-lg shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Create Free Teacher Account
                  </Link>
                  <Link to="/login" className="text-sm text-gray-500 hover:text-[#0A0A0A] font-medium">
                    Already have an account? Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
