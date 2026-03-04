import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui';
import { createSupabaseClient } from '@tripslip/database';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/Layout';

interface PlatformMetrics {
  totalDistricts: number;
  totalSchools: number;
  totalTrips: number;
  totalVenues: number;
  usersByRole: {
    teacher: number;
    school_admin: number;
    district_admin: number;
    tripslip_admin: number;
    venue_admin: number;
    parent: number;
  };
}

interface DistrictSummary {
  id: string;
  name: string;
  schoolCount: number;
  tripCount: number;
}

export default function TripSlipAdminDashboard() {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalDistricts: 0,
    totalSchools: 0,
    totalTrips: 0,
    totalVenues: 0,
    usersByRole: {
      teacher: 0,
      school_admin: 0,
      district_admin: 0,
      tripslip_admin: 0,
      venue_admin: 0,
      parent: 0,
    },
  });
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    try {
      setLoading(true);

      // Fetch all districts
      const { data: districtsData, error: districtsError } = await supabase
        .from('districts' as any)
        .select('id, name');

      if (districtsError) throw districtsError;

      // Fetch all schools
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools' as any)
        .select('id, name');

      if (schoolsError) throw schoolsError;

      // Fetch all trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips' as any)
        .select('id, teacher:teachers!inner(id, school_id)');

      if (tripsError) throw tripsError;

      // Fetch all venues
      const { data: venuesData, error: venuesError } = await supabase
        .from('venues' as any)
        .select('id');

      if (venuesError) throw venuesError;

      // Fetch user role assignments grouped by role
      const { data: roleAssignmentsData, error: roleAssignmentsError } = await supabase
        .from('user_role_assignments' as any)
        .select(`
          id,
          user_id,
          role:user_roles!inner(name)
        `);

      if (roleAssignmentsError) throw roleAssignmentsError;

      // Count unique users by role
      const usersByRole = {
        teacher: 0,
        school_admin: 0,
        district_admin: 0,
        tripslip_admin: 0,
        venue_admin: 0,
        parent: 0,
      };

      const roleUserSets: Record<string, Set<string>> = {
        teacher: new Set(),
        school_admin: new Set(),
        district_admin: new Set(),
        tripslip_admin: new Set(),
        venue_admin: new Set(),
        parent: new Set(),
      };

      (roleAssignmentsData || []).forEach((assignment: any) => {
        const roleName = assignment.role?.name;
        if (roleName && roleUserSets[roleName]) {
          roleUserSets[roleName].add(assignment.user_id);
        }
      });

      Object.keys(roleUserSets).forEach((role) => {
        usersByRole[role as keyof typeof usersByRole] = roleUserSets[role].size;
      });

      // Calculate district summaries
      const districtSummaries: DistrictSummary[] = [];
      
      for (const district of (districtsData || []) as any[]) {
        // Get schools in this district via school_districts junction table
        const { data: districtSchools, error: districtSchoolsError } = await supabase
          .from('school_districts' as any)
          .select('school_id')
          .eq('district_id', district.id);

        if (districtSchoolsError) throw districtSchoolsError;

        const schoolIds = (districtSchools || []).map((ds: any) => ds.school_id);

        // Count trips from schools in this district
        const districtTrips = (tripsData || []).filter((trip: any) => 
          schoolIds.includes(trip.teacher?.school_id)
        );

        districtSummaries.push({
          id: district.id,
          name: district.name,
          schoolCount: schoolIds.length,
          tripCount: districtTrips.length,
        });
      }

      setMetrics({
        totalDistricts: (districtsData || []).length,
        totalSchools: (schoolsData || []).length,
        totalTrips: (tripsData || []).length,
        totalVenues: (venuesData || []).length,
        usersByRole,
      });

      setDistricts(districtSummaries);
    } catch (error) {
      console.error('Error fetching platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading platform dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <h2 className="text-3xl font-bold mb-8">TripSlip Platform Dashboard</h2>

      {/* Platform-wide Metrics */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card className="border-2 border-black shadow-offset">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Total Districts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{metrics.totalDistricts}</p>
            <p className="text-sm text-gray-600 mt-1">Platform-wide</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-offset">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Total Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{metrics.totalSchools}</p>
            <p className="text-sm text-gray-600 mt-1">Across all districts</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-offset">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Total Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{metrics.totalTrips}</p>
            <p className="text-sm text-gray-600 mt-1">Platform-wide</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-offset">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Total Venues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{metrics.totalVenues}</p>
            <p className="text-sm text-gray-600 mt-1">Registered venues</p>
          </CardContent>
        </Card>
      </div>

      {/* Users by Role */}
      <Card className="border-2 border-black shadow-offset mb-8">
        <CardHeader>
          <CardTitle>Users by Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border-2 border-gray-200 rounded-md">
              <p className="text-sm text-gray-600">Teachers</p>
              <p className="text-2xl font-bold">{metrics.usersByRole.teacher}</p>
            </div>
            <div className="p-4 border-2 border-gray-200 rounded-md">
              <p className="text-sm text-gray-600">School Admins</p>
              <p className="text-2xl font-bold">{metrics.usersByRole.school_admin}</p>
            </div>
            <div className="p-4 border-2 border-gray-200 rounded-md">
              <p className="text-sm text-gray-600">District Admins</p>
              <p className="text-2xl font-bold">{metrics.usersByRole.district_admin}</p>
            </div>
            <div className="p-4 border-2 border-gray-200 rounded-md">
              <p className="text-sm text-gray-600">TripSlip Admins</p>
              <p className="text-2xl font-bold">{metrics.usersByRole.tripslip_admin}</p>
            </div>
            <div className="p-4 border-2 border-gray-200 rounded-md">
              <p className="text-sm text-gray-600">Venue Admins</p>
              <p className="text-2xl font-bold">{metrics.usersByRole.venue_admin}</p>
            </div>
            <div className="p-4 border-2 border-gray-200 rounded-md">
              <p className="text-sm text-gray-600">Parents</p>
              <p className="text-2xl font-bold">{metrics.usersByRole.parent}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Districts List */}
      <Card className="border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle>Districts</CardTitle>
        </CardHeader>
        <CardContent>
          {districts.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No districts found</p>
          ) : (
            <div className="space-y-4">
              {districts.map((district) => (
                <Link
                  key={district.id}
                  to={`/districts/${district.id}`}
                  className="block p-4 border-2 border-black rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{district.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {district.schoolCount} schools • {district.tripCount} trips
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">View district details</span>
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
