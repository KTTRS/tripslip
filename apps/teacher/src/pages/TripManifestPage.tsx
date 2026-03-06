import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, Printer, Download, RefreshCw, Phone, AlertTriangle } from 'lucide-react';
import { Button } from '@tripslip/ui';

interface ManifestStudent {
  slipId: string;
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
}

interface TripInfo {
  id: string;
  trip_date: string;
  trip_time?: string;
  status: string;
  transportation?: Record<string, unknown>;
  experience: {
    title: string;
    venue: {
      name: string;
      address: any;
    };
  };
}

export default function TripManifestPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [students, setStudents] = useState<ManifestStudent[]>([]);
  const [loading, setLoading] = useState(true);

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
          id, trip_date, trip_time, status, transportation,
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

      const manifest: ManifestStudent[] = [];

      for (const slip of slips || []) {
        const fd = (slip.form_data as Record<string, any>) || {};
        const student = slip.students as any;

        if (student) {
          manifest.push({
            slipId: slip.id,
            studentFirstName: student.first_name || '',
            studentLastName: student.last_name || '',
            studentGrade: student.grade || fd.studentGrade || '',
            studentAllergies: student.medical_info || fd.studentAllergies || '',
            parentName: fd.parentName || '',
            parentPhone: fd.parentPhone || '',
            parentEmail: fd.parentEmail || '',
            emergencyContactName: fd.emergencyContactName || '',
            emergencyContactPhone: fd.emergencyContactPhone || '',
            signedAt: slip.signed_at || '',
            status: slip.status,
            fromRoster: true,
          });
        } else if (fd.studentFirstName) {
          manifest.push({
            slipId: slip.id,
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
          });
        }
      }

      manifest.sort((a, b) => a.studentLastName.localeCompare(b.studentLastName));
      setStudents(manifest);
    } catch (err) {
      console.error('Error loading manifest:', err);
      toast.error('Failed to load manifest');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
      'Checked In',
    ];

    const esc = (v: string) => {
      let s = (v || '').replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return `"${s}"`;
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
      '""',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const tripName = trip?.experience?.title?.replace(/\s+/g, '_') || 'trip';
    const tripDate = trip?.trip_date || 'manifest';
    a.download = `${tripName}_manifest_${tripDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const studentsWithAllergies = students.filter(s => s.studentAllergies);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
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

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b-2 border-black p-4 print:hidden">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate(`/trips/${tripId}/slips`)} className="border-2 border-black">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Trip Manifest</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadManifest} className="border-2 border-black">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleDownloadCSV} className="border-2 border-black">
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
            <Button onClick={handlePrint} className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] font-semibold">
              <Printer className="h-4 w-4 mr-2" />
              Print Manifest
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="border-2 border-[#0A0A0A] rounded-xl p-6 mb-6 print:border print:rounded-none print:p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-block bg-[#F5C518] border-2 border-[#0A0A0A] rounded px-3 py-0.5 mb-2 shadow-[2px_2px_0px_#0A0A0A] print:shadow-none">
                <span className="font-bold text-[#0A0A0A] text-xs tracking-wide">TRIPSLIP MANIFEST</span>
              </div>
              <h2 className="text-2xl font-bold text-[#0A0A0A]">{trip.experience?.title}</h2>
              <p className="text-gray-600">{trip.experience?.venue?.name}</p>
              {addressStr && <p className="text-sm text-gray-500">{addressStr}</p>}
            </div>
            <div className="text-right">
              <p className="font-semibold text-[#0A0A0A]">{tripDate}</p>
              {trip.trip_time && <p className="text-sm text-gray-600">Time: {trip.trip_time}</p>}
              <p className="text-2xl font-bold text-[#0A0A0A] mt-1">{students.length} Students</p>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-8">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Parent / Guardian</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Emergency Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider print:hidden">Medical</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider w-24">Present</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr key={student.slipId} className="hover:bg-gray-50 print:hover:bg-white">
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#0A0A0A]">
                        {student.studentFirstName} {student.studentLastName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.studentGrade || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{student.parentName || '—'}</div>
                      {student.parentPhone && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {student.parentPhone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{student.emergencyContactName || '—'}</div>
                      {student.emergencyContactPhone && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {student.emergencyContactPhone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 print:hidden">
                      {student.studentAllergies ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 rounded-full px-2 py-0.5">
                          <AlertTriangle className="h-3 w-3" />
                          {student.studentAllergies.length > 30 ? student.studentAllergies.slice(0, 30) + '...' : student.studentAllergies}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="w-6 h-6 border-2 border-[#0A0A0A] rounded mx-auto print:w-5 print:h-5"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bg-gray-50 px-4 py-3 border-t-2 border-[#0A0A0A] flex items-center justify-between print:bg-white">
              <div className="text-sm font-semibold text-[#0A0A0A]">
                Total: {students.length} student{students.length !== 1 ? 's' : ''}
              </div>
              <div className="text-sm text-gray-500">
                Present: _____ / {students.length}
              </div>
            </div>
          </div>
        )}

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
          main { padding: 16px !important; max-width: none !important; }
        }
      `}</style>
    </div>
  );
}
