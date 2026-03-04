import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui';
import { createSupabaseClient } from '@tripslip/database';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/Layout';

interface SchoolDetails {
  id: string;
  name: string;
  code: string | null;
  address: any;
}

interface SchoolMetrics {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  totalStudents: number;
  totalTeachers: number;
}

interface TripOverview {
  id: string;
  trip_date: string;
  status: string;
  student_count: number;
  teacher_name: string;
  experience_title: string;
}

interface TeacherOverview {
  id: string;
  name: string;
  email: string;
  tripCount: number;
}

export default function SchoolDetailPage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const [school, setSchool] = useState<SchoolDetails | null>(null);
  const [metrics, setMetrics] = useState<SchoolMetrics>({
    totalTrips: 0,
    activeTrips: 0,
    completedTrips: 0,
    totalStudents: 0,
    totalTeachers: 0,
  });
  const [trips, setTrips] = useState<TripOverview[]>([]);
  const [teachers, setTeachers] = useState<TeacherOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      fetchSchoolDetails();
    }
  }, [schoolId]);

  const fetchSchoolDetails = async () => {
    try {
      setLoading(true);

      // Fetch school details
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools' as any)
        .select('id, name, code, address')
        .eq('id', schoolId)
        .single();

      if (schoolError) throw schoolError;
      setSchool(schoolData as any);

      // Fetch teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers' as any)
        .select('id, first_name, last_name, email')
        .eq('school_id', schoolId);

      if (teachersError) throw teachersError;

      // Fetch trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips' as any)
        .select(`
          id,
          trip_date,
          status,
          teacher:teachers!inner (
            id,
            first_name,
            last_name
          ),
          experience:experiences (
            title
          ),
          permission_slips (
            id,
            student_id
          )
        `)
        .eq('teachers.school_id', schoolId!)
        .order('trip_date', { ascending: false });

      if (tripsError) throw tripsError;

      // Calculate metrics
      const totalTrips = (tripsData || []).length;
      const activeTrips = (tripsData || []).filter((t: any) => t.status === 'confirmed').length;
      const completedTrips = (tripsData || []).filter((t: any) => t.status === 'completed').length;

      const uniqueStudents = new Set<string>();
      (tripsData || []).forEach((trip: any) => {
        (trip.permission_slips || []).forEach((slip: any) => {
          if (slip.student_id) {
            uniqueStudents.add(slip.student_id);
          }
        });
      });

      setMetrics({
        totalTrips,
        activeTrips,
        completedTrips,
        totalStudents: uniqueStudents.size,
        totalTeachers: (teachersData || []).length,
      });

      // Format trips
      const formattedTrips: TripOverview[] = (tripsData || []).slice(0, 10).map((trip: any) => ({
        id: trip.id,
        trip_date: trip.trip_date,
        status: trip.status,
        student_count: (trip.permission_slips || []).length,
        teacher_name: `${trip.teacher?.first_name} ${trip.teacher?.last_name}`,
        experience_title: trip.experience?.title || 'Unknown',
      }));

      setTrips(formattedTrips);

      // Calculate teacher trip counts
      const teacherTripCounts = new Map<string, number>();
      (tripsData || []).forEach((trip: any) => {
        const teacherId = trip.teacher?.id;
        if (teacherId) {
          teacherTripCounts.set(teacherId, (teacherTripCounts.get(teacherId) || 0) + 1);
        }
      });

      const formattedTeachers: TeacherOverview[] = (teachersData || []).map((teacher: any) => ({
        id: teacher.id,
        name: `${teacher.first_name} ${teacher.last_name}`,
        email: teacher.email,
        tripCount: teacherTripCounts.get(teacher.id) || 0,
      }));

      setTeachers(formattedTeachers);
    } catch (error) {
      console.error('Error fetching school details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading school details...</p>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">School not found</p>
          <Link to="/district-admin" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to District Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link to="/district-admin" className="text-blue-600 hover:underline flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to District Dashboard
        </Link>
      </div>

      <h2 className="text-3xl font-bold mb-2">{school.name}</h2>
      {school.code && <p className="text-gray-600 mb-8">School Code: {school.code}</p>}

      {/* School Metrics */}
      <div className="grid gap-6 md:grid-cols-5 mb-8">
        <Card className="border-2 border-black shadow-offset">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Total Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.totalTrips}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-offset">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Active Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{metrics.activeTrips}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-offset">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{metrics.completedTrips}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-offset">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.totalStudents}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-offset">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.totalTeachers}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Teachers List */}
        <Card className="border-2 border-black shadow-offset">
          <CardHeader>
            <CardTitle>Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            {teachers.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No teachers found</p>
            ) : (
              <div className="space-y-3">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="p-3 border border-gray-200 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{teacher.name}</h4>
                        <p className="text-sm text-gray-600">{teacher.email}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {teacher.tripCount} trips
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Trips */}
        <Card className="border-2 border-black shadow-offset">
          <CardHeader>
            <CardTitle>Recent Trips</CardTitle>
          </CardHeader>
          <CardContent>
            {trips.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No trips found</p>
            ) : (
              <div className="space-y-3">
                {trips.map((trip) => (
                  <div key={trip.id} className="p-3 border border-gray-200 rounded-md">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h4 className="font-semibold text-sm">{trip.experience_title}</h4>
                        <p className="text-xs text-gray-600">{trip.teacher_name}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          trip.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : trip.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {trip.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-2">
                      <span className="text-gray-600">{formatDate(trip.trip_date)}</span>
                      <span className="text-gray-600">{trip.student_count} students</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
