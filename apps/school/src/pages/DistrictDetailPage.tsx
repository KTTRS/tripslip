import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui';
import { createSupabaseClient } from '@tripslip/database';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/Layout';

interface DistrictInfo {
  id: string;
  name: string;
  code: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface SchoolMetrics {
  id: string;
  name: string;
  tripCount: number;
  studentCount: number;
  activeTrips: number;
  completedTrips: number;
}

export default function DistrictDetailPage() {
  const { districtId } = useParams<{ districtId: string }>();
  const [district, setDistrict] = useState<DistrictInfo | null>(null);
  const [schools, setSchools] = useState<SchoolMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (districtId) {
      fetchDistrictDetails();
    }
  }, [districtId]);

  const fetchDistrictDetails = async () => {
    try {
      setLoading(true);

      // Fetch district info
      const { data: districtData, error: districtError } = await supabase
        .from('districts' as any)
        .select('id, name, code, contact_email, contact_phone')
        .eq('id', districtId)
        .single();

      if (districtError) throw districtError;

      setDistrict(districtData as unknown as DistrictInfo);

      // Fetch schools in this district via school_districts junction table
      const { data: districtSchools, error: districtSchoolsError } = await supabase
        .from('school_districts' as any)
        .select('school_id, schools!inner(id, name)')
        .eq('district_id', districtId);

      if (districtSchoolsError) throw districtSchoolsError;

      const schoolIds = (districtSchools || []).map((ds: any) => ds.school_id);

      if (schoolIds.length === 0) {
        setSchools([]);
        return;
      }

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

      // Calculate per-school metrics
      const schoolMetricsMap = new Map<string, SchoolMetrics>();
      
      // Initialize all schools
      (districtSchools || []).forEach((ds: any) => {
        const school = ds.schools;
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
      console.error('Error fetching district details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading district details...</p>
        </div>
      </div>
    );
  }

  if (!district) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">District not found</p>
          <Link to="/tripslip-admin" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Platform Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link to="/tripslip-admin" className="text-blue-600 hover:underline">
          ← Back to Platform Dashboard
        </Link>
      </div>

      <h2 className="text-3xl font-bold mb-2">{district.name}</h2>
      {district.code && (
        <p className="text-gray-600 mb-6">District Code: {district.code}</p>
      )}

      {/* District Contact Info */}
      {(district.contact_email || district.contact_phone) && (
        <Card className="border-2 border-black shadow-offset mb-8">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {district.contact_email && (
                <p className="text-sm">
                  <span className="font-semibold">Email:</span> {district.contact_email}
                </p>
              )}
              {district.contact_phone && (
                <p className="text-sm">
                  <span className="font-semibold">Phone:</span> {district.contact_phone}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
