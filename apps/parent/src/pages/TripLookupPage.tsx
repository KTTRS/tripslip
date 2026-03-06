import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { LanguageSelector } from '../components/LanguageSelector';

interface StudentResult {
  id: string;
  first_name: string;
  last_name: string;
  grade: string;
  slipId: string | null;
  slipToken: string | null;
  slipStatus: string | null;
}

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
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

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

      const { data: slips } = await supabase
        .from('permission_slips')
        .select('id, student_id, magic_link_token, status')
        .eq('trip_id', tripData.id);

      const slipMap = new Map<string, { id: string; token: string; status: string }>();
      for (const s of slips || []) {
        slipMap.set(s.student_id, {
          id: s.id,
          token: s.magic_link_token,
          status: s.status,
        });
      }

      const studentIds = (slips || []).map(s => s.student_id);

      if (studentIds.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const { data: studentsData } = await supabase
        .from('students')
        .select('id, first_name, last_name, grade')
        .in('id', studentIds)
        .order('last_name');

      const results: StudentResult[] = (studentsData || []).map(s => {
        const slip = slipMap.get(s.id);
        return {
          id: s.id,
          first_name: s.first_name,
          last_name: s.last_name,
          grade: s.grade || '',
          slipId: slip?.id || null,
          slipToken: slip?.token || null,
          slipStatus: slip?.status || null,
        };
      });

      setStudents(results);
    } catch (err) {
      console.error('Error loading trip:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = async (student: StudentResult) => {
    if (student.slipStatus === 'signed' || student.slipStatus === 'paid') {
      setError(`The permission slip for ${student.first_name} has already been signed.`);
      return;
    }

    setSelecting(student.id);

    try {
      if (student.slipToken) {
        navigate(`/slip/${student.slipId}?token=${student.slipToken}`);
        return;
      }

      const newToken = crypto.randomUUID();
      const { data: newSlip, error: insertErr } = await supabase
        .from('permission_slips')
        .insert({
          student_id: student.id,
          trip_id: trip!.id,
          status: 'pending',
          magic_link_token: newToken,
        })
        .select('id')
        .single();

      if (insertErr || !newSlip) {
        throw new Error('Could not create permission slip');
      }

      navigate(`/slip/${newSlip.id}?token=${newToken}`);
    } catch (err) {
      console.error('Error selecting student:', err);
      setError('Something went wrong. Please try again.');
      setSelecting(null);
    }
  };

  const filtered = students.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q)
    );
  });

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

        {error && (
          <div className="mb-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-sm text-yellow-800">
            {error}
          </div>
        )}

        <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
          <h2 className="text-lg font-bold text-[#0A0A0A] mb-1">
            Find Your Child
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Search for your child's name to sign their permission slip.
          </p>

          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setError(null); }}
            placeholder="Type your child's name..."
            autoFocus
            className="w-full border-2 border-[#0A0A0A] rounded-lg px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518]"
          />

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {search.trim()
                ? `No students found matching "${search}". Please check the spelling or contact the teacher.`
                : 'No students are assigned to this trip yet.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((student) => {
                const isSigned = student.slipStatus === 'signed' || student.slipStatus === 'paid';
                const isSelecting = selecting === student.id;

                return (
                  <button
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    disabled={isSelecting || isSigned}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left ${
                      isSigned
                        ? 'border-green-300 bg-green-50 cursor-default'
                        : isSelecting
                        ? 'border-[#F5C518] bg-[#F5C518]/10 cursor-wait'
                        : 'border-gray-200 bg-white hover:border-[#F5C518] hover:shadow-md active:bg-[#F5C518]/10'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-[#0A0A0A] text-base">
                        {student.first_name} {student.last_name}
                      </span>
                      {student.grade && (
                        <span className="ml-2 text-sm text-gray-500">
                          Grade {student.grade}
                        </span>
                      )}
                    </div>
                    <div>
                      {isSigned ? (
                        <span className="inline-flex items-center gap-1 text-green-700 text-sm font-medium">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Signed
                        </span>
                      ) : isSelecting ? (
                        <div className="h-5 w-5 border-2 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Don't see your child? Contact the teacher for help.
        </p>
      </div>
    </div>
  );
}
