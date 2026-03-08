import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Printer,
  Download,
  RefreshCw,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Users,
  Clock,
  Bus,
  MapPin,
  RotateCcw,
  ClipboardCheck,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@tripslip/ui';

type CheckType = 'departure' | 'arrival' | 'return';

interface CheckData {
  checked: boolean;
  at: string;
  by?: string;
}

type AttendanceChecks = Partial<Record<CheckType, CheckData>>;

interface ManifestStudent {
  slipId: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  studentGrade: string;
  studentAllergies: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  signedAt: string;
  status: string;
  fromRoster: boolean;
  attendance: AttendanceChecks;
}

interface TripInfo {
  id: string;
  trip_date: string;
  trip_time?: string;
  status: string;
  transportation?: Record<string, unknown>;
  teacher_id: string;
  experience: {
    title: string;
    venue: {
      name: string;
      address: any;
    };
  };
}

const CHECK_TYPES: { key: CheckType; label: string; icon: typeof Bus; color: string; bgColor: string }[] = [
  { key: 'departure', label: 'Departure', icon: Bus, color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  { key: 'arrival', label: 'Arrival', icon: MapPin, color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  { key: 'return', label: 'Return', icon: RotateCcw, color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
];

export default function TripManifestPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { teacher } = useAuth();

  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [students, setStudents] = useState<ManifestStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeCheck, setActiveCheck] = useState<CheckType>('departure');
  const [showHistory, setShowHistory] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);

  useEffect(() => {
    if (tripId) loadManifest();
  }, [tripId]);

  const loadManifest = async () => {
    if (!tripId) return;
    setLoading(true);

    try {
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select(`
          id, trip_date, trip_time, status, transportation, teacher_id,
          experience:experiences (
            title,
            venue:venues (name, address)
          )
        `)
        .eq('id', tripId)
        .single();

      if (tripError || !tripData) {
        toast.error('Trip not found');
        navigate('/trips');
        return;
      }

      setTrip(tripData as unknown as TripInfo);

      const { data: slips } = await supabase
        .from('permission_slips')
        .select(`
          id, status, signed_at, student_id, form_data, signature_data,
          students (id, first_name, last_name, grade, medical_info)
        `)
        .eq('trip_id', tripId)
        .in('status', ['signed', 'signed_pending_payment', 'paid']);

      const { data: attendanceRows } = await supabase
        .from('attendance')
        .select('*')
        .eq('trip_id', tripId);

      const attendanceMap = new Map<string, AttendanceChecks>();
      for (const row of attendanceRows || []) {
        let checks: AttendanceChecks = {};
        if (row.notes) {
          try {
            checks = JSON.parse(row.notes);
          } catch {
            if (row.present) {
              checks = { departure: { checked: true, at: row.recorded_at } };
            }
          }
        } else if (row.present) {
          checks = { departure: { checked: true, at: row.recorded_at } };
        }
        attendanceMap.set(row.student_id, checks);
      }

      const safeMedicalInfo = (info: unknown): string => {
        if (!info) return '';
        if (typeof info === 'string') return info;
        if (typeof info === 'object') {
          const obj = info as Record<string, unknown>;
          const parts: string[] = [];
          if (obj.allergies) parts.push(String(obj.allergies));
          if (obj.conditions) parts.push(String(obj.conditions));
          if (obj.medications) parts.push(String(obj.medications));
          if (obj.notes) parts.push(String(obj.notes));
          if (parts.length > 0) return parts.join('; ');
          const vals = Object.values(obj).filter(v => v && typeof v !== 'object');
          return vals.length > 0 ? vals.map(String).join('; ') : '';
        }
        return String(info);
      };

      const manifest: ManifestStudent[] = [];

      for (const slip of slips || []) {
        const fd = (slip.form_data as Record<string, any>) || {};
        const student = slip.students as any;

        if (student) {
          manifest.push({
            slipId: slip.id,
            studentId: student.id,
            studentFirstName: student.first_name || '',
            studentLastName: student.last_name || '',
            studentGrade: student.grade || fd.studentGrade || '',
            studentAllergies: safeMedicalInfo(student.medical_info) || fd.studentAllergies || '',
            parentName: fd.parentName || '',
            parentPhone: fd.parentPhone || '',
            parentEmail: fd.parentEmail || '',
            emergencyContactName: fd.emergencyContactName || '',
            emergencyContactPhone: fd.emergencyContactPhone || '',
            signedAt: slip.signed_at || '',
            status: slip.status,
            fromRoster: true,
            attendance: attendanceMap.get(student.id) || {},
          });
        } else if (fd.studentFirstName) {
          manifest.push({
            slipId: slip.id,
            studentId: slip.student_id || '',
            studentFirstName: fd.studentFirstName || '',
            studentLastName: fd.studentLastName || '',
            studentGrade: fd.studentGrade || '',
            studentAllergies: fd.studentAllergies || '',
            parentName: fd.parentName || '',
            parentPhone: fd.parentPhone || '',
            parentEmail: fd.parentEmail || '',
            emergencyContactName: fd.emergencyContactName || '',
            emergencyContactPhone: fd.emergencyContactPhone || '',
            signedAt: slip.signed_at || '',
            status: slip.status,
            fromRoster: false,
            attendance: slip.student_id ? (attendanceMap.get(slip.student_id) || {}) : {},
          });
        }
      }

      manifest.sort((a, b) => a.studentLastName.localeCompare(b.studentLastName));
      setStudents(manifest);

      const history: any[] = [];
      for (const row of attendanceRows || []) {
        if (row.notes) {
          try {
            const checks = JSON.parse(row.notes) as AttendanceChecks;
            const student = manifest.find(s => s.studentId === row.student_id);
            if (student) {
              for (const [type, data] of Object.entries(checks)) {
                if (data?.checked) {
                  history.push({
                    studentName: `${student.studentFirstName} ${student.studentLastName}`,
                    checkType: type,
                    checkedAt: data.at,
                  });
                }
              }
            }
          } catch {}
        }
      }
      history.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
      setHistoryEntries(history);

    } catch (err) {
      console.error('Error loading manifest:', err);
      toast.error('Failed to load manifest');
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = useCallback(async (student: ManifestStudent, checkType: CheckType) => {
    if (!tripId || !teacher || !student.studentId) return;
    const key = `${student.studentId}-${checkType}`;
    setSaving(key);

    const currentChecks = { ...student.attendance };
    const isCurrentlyChecked = currentChecks[checkType]?.checked;

    if (isCurrentlyChecked) {
      delete currentChecks[checkType];
    } else {
      currentChecks[checkType] = {
        checked: true,
        at: new Date().toISOString(),
        by: teacher.id,
      };
    }

    setStudents(prev => prev.map(s =>
      s.studentId === student.studentId
        ? { ...s, attendance: currentChecks }
        : s
    ));

    try {
      const hasAnyCheck = Object.values(currentChecks).some(c => c?.checked);

      const { data: existing, error: findErr } = await supabase
        .from('attendance')
        .select('id')
        .eq('trip_id', tripId)
        .eq('student_id', student.studentId)
        .maybeSingle();

      if (findErr) throw findErr;

      if (existing) {
        const { error: updateErr } = await supabase
          .from('attendance')
          .update({
            present: hasAnyCheck,
            notes: JSON.stringify(currentChecks),
            recorded_at: new Date().toISOString(),
            recorded_by: teacher.id,
          })
          .eq('id', existing.id);
        if (updateErr) throw updateErr;
      } else if (hasAnyCheck) {
        const { error: insertErr } = await supabase
          .from('attendance')
          .insert({
            trip_id: tripId,
            student_id: student.studentId,
            present: true,
            notes: JSON.stringify(currentChecks),
            recorded_by: teacher.id,
          });
        if (insertErr) throw insertErr;
      }

      setHistoryEntries(prev => {
        const updated = [...prev];
        if (!isCurrentlyChecked) {
          updated.unshift({
            studentName: `${student.studentFirstName} ${student.studentLastName}`,
            checkType,
            checkedAt: currentChecks[checkType]!.at,
          });
        }
        return updated;
      });
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast.error('Failed to save attendance');
      setStudents(prev => prev.map(s =>
        s.studentId === student.studentId
          ? { ...s, attendance: student.attendance }
          : s
      ));
    } finally {
      setSaving(null);
    }
  }, [tripId, teacher]);

  const checkAllForType = useCallback(async (checkType: CheckType) => {
    if (!tripId || !teacher) return;
    const unchecked = students.filter(s => !s.attendance[checkType]?.checked && s.studentId);
    if (unchecked.length === 0) return;

    const now = new Date().toISOString();

    setStudents(prev => prev.map(s => s.studentId ? ({
      ...s,
      attendance: {
        ...s.attendance,
        [checkType]: { checked: true, at: now, by: teacher.id },
      },
    }) : s));

    let failed = 0;
    try {
      for (const student of unchecked) {
        const newChecks = {
          ...student.attendance,
          [checkType]: { checked: true, at: now, by: teacher.id },
        };

        const { data: existing, error: findErr } = await supabase
          .from('attendance')
          .select('id')
          .eq('trip_id', tripId)
          .eq('student_id', student.studentId)
          .maybeSingle();

        if (findErr) { failed++; continue; }

        if (existing) {
          const { error } = await supabase
            .from('attendance')
            .update({
              present: true,
              notes: JSON.stringify(newChecks),
              recorded_at: now,
              recorded_by: teacher.id,
            })
            .eq('id', existing.id);
          if (error) { failed++; continue; }
        } else {
          const { error } = await supabase
            .from('attendance')
            .insert({
              trip_id: tripId,
              student_id: student.studentId,
              present: true,
              notes: JSON.stringify(newChecks),
              recorded_by: teacher.id,
            });
          if (error) { failed++; continue; }
        }
      }
      if (failed > 0) {
        toast.error(`${failed} student${failed !== 1 ? 's' : ''} failed to save`);
        loadManifest();
      } else {
        toast.success(`All students marked for ${checkType}`);
        setHistoryEntries(prev => {
          const newEntries = unchecked.map(s => ({
            studentName: `${s.studentFirstName} ${s.studentLastName}`,
            checkType,
            checkedAt: now,
          }));
          return [...newEntries, ...prev];
        });
      }
    } catch (err) {
      console.error('Error checking all:', err);
      toast.error('Failed to mark all students');
      loadManifest();
    }
  }, [tripId, teacher, students]);

  const handlePrint = () => window.print();

  const handleDownloadCSV = () => {
    if (students.length === 0) return;

    const headers = [
      'Student Name',
      'Grade',
      'Allergies/Medical',
      'Parent/Guardian',
      'Parent Phone',
      'Parent Email',
      'Emergency Contact',
      'Emergency Phone',
      'Signed At',
      'Departure',
      'Arrival',
      'Return',
    ];

    const esc = (v: string) => {
      let s = (v || '').replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return `"${s}"`;
    };

    const checkStr = (checks: AttendanceChecks, type: CheckType) => {
      const c = checks[type];
      if (!c?.checked) return '';
      return new Date(c.at).toLocaleString();
    };

    const rows = students.map(s => [
      esc(`${s.studentFirstName} ${s.studentLastName}`),
      esc(s.studentGrade),
      esc(s.studentAllergies),
      esc(s.parentName),
      esc(s.parentPhone),
      esc(s.parentEmail),
      esc(s.emergencyContactName),
      esc(s.emergencyContactPhone),
      esc(s.signedAt ? new Date(s.signedAt).toLocaleString() : ''),
      esc(checkStr(s.attendance, 'departure')),
      esc(checkStr(s.attendance, 'arrival')),
      esc(checkStr(s.attendance, 'return')),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const tripName = trip?.experience?.title?.replace(/\s+/g, '_') || 'trip';
    const tripDate = trip?.trip_date || 'manifest';
    a.download = `${tripName}_attendance_${tripDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const studentsWithAllergies = students.filter(s => s.studentAllergies);

  const getCheckedCount = (checkType: CheckType) =>
    students.filter(s => s.attendance[checkType]?.checked).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading manifest...</p>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const tripDate = new Date(trip.trip_date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const venueAddress = trip.experience?.venue?.address;
  const addressStr = typeof venueAddress === 'object' && venueAddress
    ? [venueAddress.street, venueAddress.city, venueAddress.state, venueAddress.zipCode].filter(Boolean).join(', ')
    : typeof venueAddress === 'string' ? venueAddress : '';

  const rawTransport = trip.transportation as Record<string, unknown> | null;
  const activeConfig = CHECK_TYPES.find(c => c.key === activeCheck)!;
  const checkedCount = getCheckedCount(activeCheck);
  const allChecked = checkedCount === students.length && students.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b-2 border-black p-4 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="border-2 border-black">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                <ClipboardCheck className="h-6 w-6 text-[#F5C518]" />
                Attendance & Manifest
              </h1>
              <p className="text-xs text-gray-500">Count heads at every transition</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={loadManifest} className="border-2 border-black">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleDownloadCSV} className="border-2 border-black">
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button onClick={handlePrint} className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] font-semibold">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="border-2 border-[#0A0A0A] rounded-xl p-6 mb-6 bg-gradient-to-r from-[#F5C518]/10 via-white to-white print:border print:rounded-none print:p-4 print:bg-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-block bg-[#F5C518] border-2 border-[#0A0A0A] rounded px-3 py-0.5 mb-2 shadow-[2px_2px_0px_#0A0A0A] print:shadow-none">
                <span className="font-bold text-[#0A0A0A] text-xs tracking-wide">TRIPSLIP MANIFEST</span>
              </div>
              <h2 className="text-2xl font-bold font-display text-[#0A0A0A]">{trip.experience?.title}</h2>
              <p className="text-gray-600">{trip.experience?.venue?.name}</p>
              {addressStr && <p className="text-sm text-gray-500">{addressStr}</p>}
            </div>
            <div className="text-right">
              <p className="font-semibold text-[#0A0A0A]">{tripDate}</p>
              {trip.trip_time && <p className="text-sm text-gray-600">Time: {trip.trip_time}</p>}
              <div className="mt-2 inline-flex items-center gap-2 bg-[#0A0A0A] text-white rounded-lg px-3 py-1.5">
                <Users className="h-4 w-4" />
                <span className="text-lg font-bold">{students.length}</span>
                <span className="text-xs opacity-75">students</span>
              </div>
            </div>
          </div>

          {rawTransport && (rawTransport.type as string) && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Transport:</span>{' '}
                <span className="font-medium capitalize">{(rawTransport.type as string).replace(/_/g, ' ')}</span>
              </div>
              {(rawTransport.departure_time || rawTransport.departureTime) && (
                <div>
                  <span className="text-gray-500">Depart:</span>{' '}
                  <span className="font-medium">{(rawTransport.departure_time || rawTransport.departureTime) as string}</span>
                </div>
              )}
              {(rawTransport.return_time || rawTransport.returnTime) && (
                <div>
                  <span className="text-gray-500">Return:</span>{' '}
                  <span className="font-medium">{(rawTransport.return_time || rawTransport.returnTime) as string}</span>
                </div>
              )}
              {(rawTransport.pickup_location || rawTransport.pickupLocation) && (
                <div>
                  <span className="text-gray-500">Pickup:</span>{' '}
                  <span className="font-medium">{(rawTransport.pickup_location || rawTransport.pickupLocation) as string}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-6 print:hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <h3 className="font-bold text-lg text-[#0A0A0A] flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Head Count
            </h3>
            <div className="flex gap-2 flex-wrap">
              {CHECK_TYPES.map(ct => {
                const count = getCheckedCount(ct.key);
                const isActive = activeCheck === ct.key;
                const Icon = ct.icon;
                return (
                  <button
                    key={ct.key}
                    onClick={() => setActiveCheck(ct.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all ${
                      isActive
                        ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-[3px_3px_0px_#F5C518]'
                        : 'bg-white border-[#0A0A0A] text-[#0A0A0A] hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {ct.label}
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      count === students.length && students.length > 0
                        ? 'bg-green-500 text-white'
                        : count > 0
                          ? 'bg-[#F5C518] text-[#0A0A0A]'
                          : isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}/{students.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`rounded-xl border-2 p-4 ${activeConfig.bgColor} print:hidden`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-bold font-display ${activeConfig.color}`}>
                  {checkedCount}
                  <span className="text-lg font-normal text-gray-500">/{students.length}</span>
                </div>
                <div>
                  <p className={`font-semibold ${activeConfig.color}`}>
                    {activeConfig.label} Count
                  </p>
                  <p className="text-xs text-gray-500">
                    {allChecked
                      ? 'All students accounted for'
                      : `${students.length - checkedCount} student${students.length - checkedCount !== 1 ? 's' : ''} missing`}
                  </p>
                </div>
              </div>
              {!allChecked && students.length > 0 && (
                <Button
                  onClick={() => checkAllForType(activeCheck)}
                  className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[6px_6px_0px_#0A0A0A] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all font-semibold"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark All Present
                </Button>
              )}
              {allChecked && (
                <div className="flex items-center gap-2 bg-green-100 border-2 border-green-400 rounded-lg px-3 py-1.5">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-bold text-green-700 text-sm">All Accounted For</span>
                </div>
              )}
            </div>

            {!allChecked && students.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-red-600 mb-1">Missing Students:</p>
                <div className="flex flex-wrap gap-1">
                  {students.filter(s => !s.attendance[activeCheck]?.checked).map(s => (
                    <span key={s.slipId} className="inline-flex items-center gap-1 text-xs bg-white border border-red-200 rounded-full px-2 py-0.5 text-red-700 font-medium">
                      {s.studentFirstName} {s.studentLastName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {studentsWithAllergies.length > 0 && (
          <div className="border-2 border-red-300 bg-red-50 rounded-xl p-4 mb-6 print:border print:rounded-none">
            <h3 className="font-bold text-red-800 flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4" />
              Medical Alerts ({studentsWithAllergies.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {studentsWithAllergies.map(s => (
                <div key={s.slipId} className="bg-white rounded-lg p-2 border border-red-200 text-sm">
                  <span className="font-semibold">{s.studentFirstName} {s.studentLastName}:</span>{' '}
                  <span className="text-red-700">{s.studentAllergies}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {students.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-2">No signed permission slips yet</p>
            <p className="text-sm">The manifest will populate as parents sign their slips.</p>
          </div>
        ) : (
          <div className="border-2 border-[#0A0A0A] rounded-xl overflow-hidden print:border print:rounded-none">
            <table className="w-full">
              <thead className="bg-[#0A0A0A] text-white print:bg-gray-200 print:text-black">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider w-8">#</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">Student</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Grade</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">Parent / Guardian</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">Emergency Contact</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden xl:table-cell print:hidden">Medical</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider w-20 print:w-16">
                    <span className="hidden print:inline">Dep.</span>
                    <span className="print:hidden">{activeConfig.label}</span>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider w-16 hidden print:table-cell">Arr.</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider w-16 hidden print:table-cell">Ret.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student, index) => {
                  const isChecked = student.attendance[activeCheck]?.checked;
                  const isSaving = saving === `${student.studentId}-${activeCheck}`;

                  return (
                    <tr
                      key={student.slipId}
                      className={`transition-colors ${
                        isChecked
                          ? 'bg-green-50/50 hover:bg-green-50'
                          : 'hover:bg-gray-50'
                      } print:hover:bg-white print:bg-white`}
                    >
                      <td className="px-3 py-3 text-sm text-gray-500 font-mono">{index + 1}</td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-[#0A0A0A]">
                          {student.studentFirstName} {student.studentLastName}
                        </div>
                        <div className="text-xs text-gray-500 md:hidden">{student.studentGrade || ''}</div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 hidden md:table-cell">{student.studentGrade || '—'}</td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <div className="text-sm font-medium">{student.parentName || '—'}</div>
                        {student.parentPhone && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {student.parentPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <div className="text-sm font-medium">{student.emergencyContactName || '—'}</div>
                        {student.emergencyContactPhone && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {student.emergencyContactPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 hidden xl:table-cell print:hidden">
                        {student.studentAllergies ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 rounded-full px-2 py-0.5">
                            <AlertTriangle className="h-3 w-3" />
                            {student.studentAllergies.length > 25 ? student.studentAllergies.slice(0, 25) + '...' : student.studentAllergies}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center print:hidden">
                        <button
                          onClick={() => toggleAttendance(student, activeCheck)}
                          disabled={isSaving}
                          className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all mx-auto ${
                            isChecked
                              ? 'bg-green-500 border-green-600 text-white shadow-[2px_2px_0px_#166534]'
                              : 'border-[#0A0A0A] bg-white hover:bg-[#F5C518]/20'
                          } ${isSaving ? 'opacity-50' : ''}`}
                        >
                          {isChecked ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5 text-gray-300" />}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-center hidden print:table-cell">
                        <div className={`w-5 h-5 border-2 border-[#0A0A0A] rounded mx-auto flex items-center justify-center ${
                          student.attendance.departure?.checked ? 'bg-black' : ''
                        }`}>
                          {student.attendance.departure?.checked && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center hidden print:table-cell">
                        <div className={`w-5 h-5 border-2 border-[#0A0A0A] rounded mx-auto flex items-center justify-center ${
                          student.attendance.arrival?.checked ? 'bg-black' : ''
                        }`}>
                          {student.attendance.arrival?.checked && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center hidden print:table-cell">
                        <div className={`w-5 h-5 border-2 border-[#0A0A0A] rounded mx-auto flex items-center justify-center ${
                          student.attendance.return?.checked ? 'bg-black' : ''
                        }`}>
                          {student.attendance.return?.checked && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="bg-gray-50 px-4 py-3 border-t-2 border-[#0A0A0A] print:bg-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="text-sm font-semibold text-[#0A0A0A]">
                  Total: {students.length} student{students.length !== 1 ? 's' : ''}
                </div>
                <div className="flex gap-4 text-sm print:hidden">
                  {CHECK_TYPES.map(ct => {
                    const count = getCheckedCount(ct.key);
                    return (
                      <div key={ct.key} className="flex items-center gap-1">
                        <span className="text-gray-500">{ct.label}:</span>
                        <span className={`font-bold ${count === students.length && students.length > 0 ? 'text-green-600' : 'text-[#0A0A0A]'}`}>
                          {count}/{students.length}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="hidden print:block text-sm text-gray-500">
                  Departure: {getCheckedCount('departure')}/{students.length} | Arrival: {getCheckedCount('arrival')}/{students.length} | Return: {getCheckedCount('return')}/{students.length}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 print:hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#0A0A0A] transition-colors"
          >
            <History className="h-4 w-4" />
            Attendance History
            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showHistory && (
            <div className="mt-3 border-2 border-[#0A0A0A] rounded-xl overflow-hidden">
              {historyEntries.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No attendance records yet</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">Student</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">Check Type</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historyEntries.slice(0, 50).map((entry, i) => {
                        const cfg = CHECK_TYPES.find(c => c.key === entry.checkType);
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm font-medium">{entry.studentName}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ${cfg?.bgColor || 'bg-gray-100'} ${cfg?.color || 'text-gray-700'}`}>
                                {cfg?.label || entry.checkType}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 font-mono">
                              {new Date(entry.checkedAt).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 border-t-2 border-gray-200 pt-6 grid grid-cols-2 gap-8 print:mt-4 print:pt-4">
          <div>
            <p className="text-sm text-gray-500 mb-8">Teacher Signature</p>
            <div className="border-b-2 border-[#0A0A0A] w-full"></div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-8">Date</p>
            <div className="border-b-2 border-[#0A0A0A] w-full"></div>
          </div>
        </div>
      </main>

      <style>{`
        @media print {
          body { font-size: 11px; }
          nav, .print\\:hidden { display: none !important; }
          .hidden.print\\:table-cell { display: table-cell !important; }
          .hidden.print\\:block { display: block !important; }
          main { padding: 16px !important; max-width: none !important; }
        }
      `}</style>
    </div>
  );
}
