import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui';
import { supabase } from '../lib/supabase';
import { useSchoolAuth } from '../contexts/SchoolAuthContext';
import { Layout } from '../components/Layout';

interface DistrictMetrics {
  totalSchools: number;
  totalTrips: number;
  totalStudents: number;
}

interface SchoolMetrics {
  id: string;
  name: string;
  tripCount: number;
  studentCount: number;
  activeTrips: number;
  completedTrips: number;
}

export default function DistrictAdminDashboard() {
  const { activeRole } = useSchoolAuth();
  const [metrics, setMetrics] = useState<DistrictMetrics>({
    totalSchools: 0,
    totalTrips: 0,
    totalStudents: 0,
  });
  const [schools, setSchools] = useState<SchoolMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeRole?.organization_id) {
      fetchDistrictData();
    }
  }, [activeRole?.organization_id]);

  const fetchDistrictData = async () => {
    try {
      setLoading(true);

      // Fetch schools in the district
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools' as any)
        .select('id, name')
        .eq('district_id', activeRole?.organization_id);

      if (schoolsError) throw schoolsError;

      const schoolIds = (schoolsData || []).map((s: any) => s.id);

      // Fetch trips for all schools in the district
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips' as any)
        .select(`
          id,
          status,
          teacher:teachers!inner (
            id,
            school_id
          ),
          permission_slips (
            id,
            student_id
          )
        `)
        .in('teachers.school_id', schoolIds);

      if (tripsError) throw tripsError;

      // Calculate district-wide metrics
      const totalTrips = (tripsData || []).length;
      
      // Count unique students across all trips
      const uniqueStudents = new Set<string>();
      (tripsData || []).forEach((trip: any) => {
        (trip.permission_slips || []).forEach((slip: any) => {
          if (slip.student_id) {
            uniqueStudents.add(slip.student_id);
          }
        });
      });

      setMetrics({
        totalSchools: (schoolsData || []).length,
        totalTrips,
        totalStudents: uniqueStudents.size,
      });

      // Calculate per-school metrics
      const schoolMetricsMap = new Map<string, SchoolMetrics>();
      
      // Initialize all schools
      (schoolsData || []).forEach((school: any) => {
        schoolMetricsMap.set(school.id, {
          id: school.id,
          name: school.name,
          tripCount: 0,
          studentCount: 0,
          activeTrips: 0,
          completedTrips: 0,
        });
      });

      // Aggregate trip data by school
      (tripsData || []).forEach((trip: any) => {
        const schoolId = trip.teacher?.school_id;
        if (!schoolId || !schoolMetricsMap.has(schoolId)) return;

        const metrics = schoolMetricsMap.get(schoolId)!;
        metrics.tripCount += 1;

        if (trip.status === 'confirmed') {
          metrics.activeTrips += 1;
        } else if (trip.status === 'completed') {
          metrics.completedTrips += 1;
        }

        // Count unique students for this school
        const schoolStudents = new Set<string>();
        (trip.permission_slips || []).forEach((slip: any) => {
          if (slip.student_id) {
            schoolStudents.add(slip.student_id);
          }
        });
        metrics.studentCount += schoolStudents.size;
      });

      setSchools(Array.from(schoolMetricsMap.values()));
    } catch (error) {
      console.error('Error fetching district data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading district dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <h2 className="text-3xl font-bold mb-8">District Dashboard</h2>

      {/* District-wide Metrics */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="border-2 border-black shadow-offset">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Total Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{metrics.totalSchools}</p>
            <p className="text-sm text-gray-600 mt-1">In your district</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-offset">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Total Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{metrics.totalTrips}</p>
            <p className="text-sm text-gray-600 mt-1">Across all schools</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-offset">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{metrics.totalStudents}</p>
            <p className="text-sm text-gray-600 mt-1">Participating in trips</p>
          </CardContent>
        </Card>
      </div>

      {/* Schools List with Metrics */}
      <Card className="border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle>Schools in District</CardTitle>
        </CardHeader>
        <CardContent>
          {schools.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No schools found in this district</p>
          ) : (
            <div className="space-y-4">
              {schools.map((school) => (
                <Link
                  key={school.id}
                  to={`/schools/${school.id}`}
                  className="block p-4 border-2 border-black rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{school.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {school.tripCount} trips • {school.studentCount} students
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        <span className="text-green-600 font-semibold">
                          {school.activeTrips} active
                        </span>
                        {' • '}
                        <span className="text-blue-600 font-semibold">
                          {school.completedTrips} completed
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">View school details</span>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
