import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui';
import { useSchoolAuth } from '../contexts/SchoolAuthContext';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/Layout';
import BudgetTracking from '../components/BudgetTracking';
import TripFilters from '../components/TripFilters';
import TripAlerts from '../components/TripAlerts';

interface DashboardMetrics {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  totalCost: number;
  totalStudents: number;
  completionRate: number;
  totalBudget: number;
  spentAmount: number;
  remainingAmount: number;
}

interface TeacherStats {
  id: string;
  name: string;
  tripCount: number;
  studentCount: number;
  completionRate: number;
}

interface TripOverview {
  id: string;
  trip_date: string;
  status: string;
  student_count: number;
  teacher_name: string;
  experience_title: string;
  completion_rate: number;
  total_cost: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  tripId: string;
  tripName: string;
}

export default function DashboardPage() {
  const { schoolId, schoolLoading, schoolError } = useSchoolAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalTrips: 0,
    activeTrips: 0,
    completedTrips: 0,
    totalCost: 0,
    totalStudents: 0,
    completionRate: 0,
    totalBudget: 50000000, // $500,000 default budget in cents
    spentAmount: 0,
    remainingAmount: 50000000,
  });
  const [teacherStats, setTeacherStats] = useState<TeacherStats[]>([]);
  const [recentTrips, setRecentTrips] = useState<TripOverview[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [teacherList, setTeacherList] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!schoolLoading && schoolId) {
      fetchDashboardData();
    }
  }, [dateRange, selectedTeacher, selectedStatus, schoolId, schoolLoading]);

  const fetchDashboardData = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Build query with filters
      // Note: RLS policies automatically filter trips based on user's role and organization
      // School admins see trips from their school, district admins see trips from their district
      let query = (supabase as any)
        .from('trips')
        .select(`
          id,
          trip_date,
          trip_time,
          status,
          student_count,
          teacher:teachers (
            id,
            first_name,
            last_name
          ),
          experience:experiences (
            title
          ),
          permission_slips (
            id,
            status,
            payments (
              amount_cents,
              status
            )
          )
        `)
        .order('trip_date', { ascending: false });

      // Apply date range filter
      if (dateRange.start) {
        query = query.gte('trip_date', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('trip_date', dateRange.end);
      }

      // Apply teacher filter
      if (selectedTeacher) {
        query = query.eq('teacher_id', selectedTeacher);
      }

      // Apply status filter
      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      const { data: trips, error: tripsError } = await query;

      if (tripsError) throw tripsError;

      // Calculate metrics
      const calculatedMetrics = (trips || []).reduce(
        (acc: DashboardMetrics, trip: any) => {
          const slips = trip.permission_slips || [];
          const completedSlips = slips.filter(
            (s: any) => s.status === 'paid' || s.status === 'signed'
          ).length;
          const tripCost = slips.reduce((sum: number, slip: any) => {
            const paidAmount = slip.payments
              ?.filter((p: any) => p.status === 'succeeded')
              .reduce((pSum: number, p: any) => pSum + p.amount_cents, 0) || 0;
            return sum + paidAmount;
          }, 0);

          return {
            totalTrips: acc.totalTrips + 1,
            activeTrips: acc.activeTrips + (trip.status === 'confirmed' ? 1 : 0),
            completedTrips: acc.completedTrips + (trip.status === 'completed' ? 1 : 0),
            totalCost: acc.totalCost + tripCost,
            totalStudents: acc.totalStudents + slips.length,
            completionRate: acc.completionRate + (slips.length > 0 ? completedSlips / slips.length : 0),
            totalBudget: acc.totalBudget,
            spentAmount: acc.spentAmount,
            remainingAmount: acc.remainingAmount,
          };
        },
        {
          totalTrips: 0,
          activeTrips: 0,
          completedTrips: 0,
          totalCost: 0,
          totalStudents: 0,
          completionRate: 0,
          totalBudget: 50000000,
          spentAmount: 0,
          remainingAmount: 50000000,
        }
      );

      // Calculate average completion rate
      if (calculatedMetrics.totalTrips > 0) {
        calculatedMetrics.completionRate = Math.round(
          (calculatedMetrics.completionRate / calculatedMetrics.totalTrips) * 100
        );
      }

      // Calculate budget metrics
      calculatedMetrics.spentAmount = calculatedMetrics.totalCost;
      calculatedMetrics.remainingAmount = calculatedMetrics.totalBudget - calculatedMetrics.spentAmount;

      setMetrics(calculatedMetrics);

      // Calculate teacher statistics
      const teacherMap = new Map<string, TeacherStats>();
      (trips || []).forEach((trip: any) => {
        const teacherId = trip.teacher?.id;
        if (!teacherId) return;

        const teacherName = `${trip.teacher.first_name} ${trip.teacher.last_name}`;
        const slips = trip.permission_slips || [];
        const completedSlips = slips.filter(
          (s: any) => s.status === 'paid' || s.status === 'signed'
        ).length;

        if (!teacherMap.has(teacherId)) {
          teacherMap.set(teacherId, {
            id: teacherId,
            name: teacherName,
            tripCount: 0,
            studentCount: 0,
            completionRate: 0,
          });
        }

        const stats = teacherMap.get(teacherId)!;
        stats.tripCount += 1;
        stats.studentCount += slips.length;
        stats.completionRate += slips.length > 0 ? completedSlips / slips.length : 0;
      });

      // Calculate average completion rate per teacher
      const teacherStatsArray = Array.from(teacherMap.values()).map((stats) => ({
        ...stats,
        completionRate: stats.tripCount > 0 
          ? Math.round((stats.completionRate / stats.tripCount) * 100)
          : 0,
      }));

      setTeacherStats(teacherStatsArray);

      // Extract unique teachers for filter dropdown
      const uniqueTeachers = Array.from(teacherMap.values()).map((stats) => ({
        id: stats.id,
        name: stats.name,
      }));
      setTeacherList(uniqueTeachers);

      // Format recent trips
      const formattedTrips: TripOverview[] = (trips || []).slice(0, 10).map((trip: any) => {
        const slips = trip.permission_slips || [];
        const completedSlips = slips.filter(
          (s: any) => s.status === 'paid' || s.status === 'signed'
        ).length;
        const tripCost = slips.reduce((sum: number, slip: any) => {
          const paidAmount = slip.payments
            ?.filter((p: any) => p.status === 'succeeded')
            .reduce((pSum: number, p: any) => pSum + p.amount_cents, 0) || 0;
          return sum + paidAmount;
        }, 0);

        return {
          id: trip.id,
          trip_date: trip.trip_date,
          status: trip.status,
          student_count: slips.length,
          teacher_name: `${trip.teacher?.first_name} ${trip.teacher?.last_name}`,
          experience_title: trip.experience?.title || 'Unknown',
          completion_rate: slips.length > 0 ? Math.round((completedSlips / slips.length) * 100) : 0,
          total_cost: tripCost,
        };
      });

      setRecentTrips(formattedTrips);

      // Generate alerts for trips requiring attention
      const generatedAlerts: Alert[] = [];
      (trips || []).forEach((trip: any) => {
        const slips = trip.permission_slips || [];
        const completedSlips = slips.filter(
          (s: any) => s.status === 'paid' || s.status === 'signed'
        ).length;
        const completionRate = slips.length > 0 ? (completedSlips / slips.length) * 100 : 0;
        const tripDate = new Date(trip.trip_date);
        const daysUntilTrip = Math.ceil((tripDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        // Alert for low completion rate with upcoming trip
        if (daysUntilTrip <= 7 && daysUntilTrip > 0 && completionRate < 50) {
          generatedAlerts.push({
            id: `${trip.id}-low-completion`,
            type: 'warning',
            message: `Only ${completionRate.toFixed(0)}% complete with ${daysUntilTrip} days remaining`,
            tripId: trip.id,
            tripName: trip.experience?.title || 'Unknown Trip',
          });
        }

        if (trip.status === 'pending_approval') {
          generatedAlerts.push({
            id: `${trip.id}-pending-approval`,
            type: 'info',
            message: 'Pending approval — review required',
            tripId: trip.id,
            tripName: trip.experience?.title || 'Unknown Trip',
          });
        }

        // Alert for overdue trips
        if (daysUntilTrip < 0 && trip.status !== 'completed' && trip.status !== 'cancelled') {
          generatedAlerts.push({
            id: `${trip.id}-overdue`,
            type: 'error',
            message: 'Trip date has passed but status not updated',
            tripId: trip.id,
            tripName: trip.experience?.title || 'Unknown Trip',
          });
        }
      });

      setAlerts(generatedAlerts);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = [
      'Trip Date',
      'Trip Name',
      'Teacher',
      'Status',
      'Students',
      'Completion Rate',
      'Total Cost',
    ];

    const rows = recentTrips.map((trip) => [
      trip.trip_date,
      trip.experience_title,
      trip.teacher_name,
      trip.status,
      trip.student_count.toString(),
      `${trip.completion_rate}%`,
      formatCurrency(trip.total_cost),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `school-trips-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setDateRange({ start: '', end: '' });
    setSelectedTeacher('');
    setSelectedStatus('');
  };

  if (schoolLoading || loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (schoolError || !schoolId) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] rounded-xl p-8 max-w-md mx-auto bg-white">
            <img src="/images/icon-megaphone.png" alt="" className="mx-auto h-16 w-16 object-contain drop-shadow-md" />
            <h3 className="mt-4 text-lg font-bold text-[#0A0A0A]">
              No School Association
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {schoolError || 'Your account is not associated with a school. Please contact support.'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 border-2 border-black shadow-[4px_4px_0px_#0A0A0A] p-6 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h2 className="text-3xl font-bold">School Dashboard</h2>
            <p className="text-gray-600 mt-1">Monitor trips, teachers, and budgets across your school</p>
          </div>
          <img
            src="/images/char-blue-square.png"
            alt="TripSlip mascot"
            className="w-20 h-20 object-contain animate-bounce-slow drop-shadow-lg"
          />
        </div>
      </div>

        <TripAlerts alerts={alerts} />

        <TripFilters
          dateRange={dateRange}
          selectedTeacher={selectedTeacher}
          selectedStatus={selectedStatus}
          teachers={teacherList}
          onDateRangeChange={setDateRange}
          onTeacherChange={setSelectedTeacher}
          onStatusChange={setSelectedStatus}
          onExport={handleExportCSV}
          onReset={handleResetFilters}
        />

        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="border-2 border-black shadow-[3px_3px_0px_#0A0A0A] bg-gradient-to-br from-white to-blue-50/40 hover:shadow-[5px_5px_0px_#0A0A0A] hover:-translate-y-0.5 transition-all">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <img src="/images/icon-compass.png" alt="" className="w-10 h-10 object-contain drop-shadow-md" />
              <CardTitle className="text-sm text-gray-600">Total Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{metrics.totalTrips}</p>
              <p className="text-sm text-gray-600 mt-1">
                {metrics.activeTrips} active, {metrics.completedTrips} completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-[3px_3px_0px_#0A0A0A] bg-gradient-to-br from-white to-green-50/40 hover:shadow-[5px_5px_0px_#0A0A0A] hover:-translate-y-0.5 transition-all">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <img src="/images/icon-team.png" alt="" className="w-10 h-10 object-contain drop-shadow-md" />
              <CardTitle className="text-sm text-gray-600">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{metrics.totalStudents}</p>
              <p className="text-sm text-gray-600 mt-1">Across all trips</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-[3px_3px_0px_#0A0A0A] bg-gradient-to-br from-white to-yellow-50/40 hover:shadow-[5px_5px_0px_#0A0A0A] hover:-translate-y-0.5 transition-all">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <img src="/images/icon-payment.png" alt="" className="w-10 h-10 object-contain drop-shadow-md" />
              <CardTitle className="text-sm text-gray-600">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{formatCurrency(metrics.totalCost)}</p>
              <p className="text-sm text-gray-600 mt-1">Collected payments</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-[3px_3px_0px_#0A0A0A] bg-gradient-to-br from-white to-purple-50/40 hover:shadow-[5px_5px_0px_#0A0A0A] hover:-translate-y-0.5 transition-all">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <img src="/images/icon-trophy.png" alt="" className="w-10 h-10 object-contain drop-shadow-md" />
              <CardTitle className="text-sm text-gray-600">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{metrics.completionRate}%</p>
              <p className="text-sm text-gray-600 mt-1">Permission slips</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Budget Tracking */}
          <BudgetTracking schoolId={schoolId} />

          {/* Teacher Statistics */}
          <Card className="border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A]">
            <CardHeader>
              <CardTitle>Trips by Teacher</CardTitle>
            </CardHeader>
            <CardContent>
              {teacherStats.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No teacher data available</p>
              ) : (
                <div className="space-y-4">
                  {teacherStats.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="p-4 border-2 border-[#0A0A0A] rounded-xl shadow-[2px_2px_0px_#0A0A0A]"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold">{teacher.name}</h3>
                          <p className="text-sm text-gray-600">
                            {teacher.tripCount} trips, {teacher.studentCount} students
                          </p>
                        </div>
                        <span className="text-lg font-bold text-[#F5C518]">
                          {teacher.completionRate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-[#F5C518] h-2 rounded-full"
                          style={{ width: `${teacher.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 mb-8">
          {/* Recent Trips */}
          <Card className="border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A]">
            <CardHeader>
              <CardTitle>Recent Trips</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTrips.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No trips available</p>
              ) : (
                <div className="space-y-3">
                  {recentTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="p-3 border-2 border-[#0A0A0A] rounded-xl shadow-[2px_2px_0px_#0A0A0A]"
                    >
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
                        <span className="text-gray-600">
                          {trip.student_count} students • {trip.completion_rate}% complete
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Cost: {formatCurrency(trip.total_cost)}
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
