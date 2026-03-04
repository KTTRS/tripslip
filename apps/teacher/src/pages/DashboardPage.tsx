import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tripslip/ui';
import { useAuth } from '../contexts/AuthContext';
import { Navigation } from '@tripslip/auth';
import { supabase } from '../lib/supabase';
import { logger } from '@tripslip/utils';

interface DashboardMetrics {
  totalTrips: number;
  totalStudents: number;
  signedSlips: number;
  pendingPayments: number;
}

interface Trip {
  id: string;
  trip_date: string;
  trip_time: string | null;
  status: string;
  student_count: number;
  experience: {
    title: string;
    venue: {
      name: string;
    };
  };
  permission_slips: Array<{
    id: string;
    status: string;
    signed_at: string | null;
    payments: Array<{
      status: string;
      amount_cents: number;
    }>;
  }>;
}

interface Activity {
  id: string;
  type: 'signature' | 'payment';
  studentName: string;
  tripName: string;
  timestamp: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { teacher, signOut, activeRole } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalTrips: 0,
    totalStudents: 0,
    signedSlips: 0,
    pendingPayments: 0,
  });
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (teacher?.id) {
      fetchDashboardData();
      setupRealtimeSubscription();
    }

    return () => {
      // Cleanup subscription on unmount
      supabase.removeAllChannels();
    };
  }, [teacher?.id, statusFilter]);

  const setupRealtimeSubscription = () => {
    if (!teacher?.id) return;

    // Subscribe to permission slip changes
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'permission_slips',
        },
        (payload) => {
          logger.debug('Permission slip changed', { payload });
          // Refresh dashboard data when changes occur
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        (payload) => {
          logger.debug('Payment changed', { payload });
          // Refresh dashboard data when payments change
          fetchDashboardData();
        }
      )
      .subscribe();

    return channel;
  };

  const fetchDashboardData = async () => {
    if (!teacher?.id) return;

    try {
      setLoading(true);

      // Build query with optional status filter
      // Note: RLS policies automatically filter trips to only show this teacher's trips
      let query = (supabase as any)
        .from('trips')
        .select(`
          id,
          trip_date,
          trip_time,
          status,
          student_count,
          experience:experiences (
            title,
            venue:venues (
              name
            )
          ),
          permission_slips (
            id,
            status,
            signed_at,
            student:students (
              first_name,
              last_name
            ),
            payments (
              status,
              amount_cents
            )
          )
        `)
        .order('trip_date', { ascending: true });

      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: trips, error } = await query;

      if (error) throw error;

      // Calculate metrics
      const calculatedMetrics = (trips || []).reduce(
        (acc: DashboardMetrics, trip: any) => {
          const slips = trip.permission_slips || [];
          const signedCount = slips.filter(
            (s: any) => s.status === 'signed' || s.status === 'paid'
          ).length;
          const pendingPaymentCount = slips.filter(
            (s: any) => s.status === 'signed' && !s.payments?.some((p: any) => p.status === 'succeeded')
          ).length;

          return {
            totalTrips: acc.totalTrips + 1,
            totalStudents: acc.totalStudents + slips.length,
            signedSlips: acc.signedSlips + signedCount,
            pendingPayments: acc.pendingPayments + pendingPaymentCount,
          };
        },
        {
          totalTrips: 0,
          totalStudents: 0,
          signedSlips: 0,
          pendingPayments: 0,
        }
      );

      setMetrics(calculatedMetrics);

      // Filter upcoming trips (future dates)
      const today = new Date().toISOString().split('T')[0];
      const upcoming = (trips || [])
        .filter((trip: any) => trip.trip_date >= today)
        .slice(0, 5);
      setUpcomingTrips(upcoming as Trip[]);

      // Generate recent activity feed
      const activities: Activity[] = [];
      (trips || []).forEach((trip: any) => {
        trip.permission_slips?.forEach((slip: any) => {
          if (slip.signed_at) {
            activities.push({
              id: `${slip.id}-signature`,
              type: 'signature',
              studentName: `${slip.student?.first_name} ${slip.student?.last_name}`,
              tripName: trip.experience?.title || 'Unknown Trip',
              timestamp: slip.signed_at,
            });
          }
          slip.payments?.forEach((payment: any) => {
            if (payment.status === 'succeeded') {
              activities.push({
                id: `${slip.id}-payment-${payment.amount_cents}`,
                type: 'payment',
                studentName: `${slip.student?.first_name} ${slip.student?.last_name}`,
                tripName: trip.experience?.title || 'Unknown Trip',
                timestamp: slip.signed_at || new Date().toISOString(),
              });
            }
          });
        });
      });

      // Sort by timestamp and take most recent 10
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 10));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getCompletionRate = (trip: Trip) => {
    const total = trip.permission_slips?.length || 0;
    if (total === 0) return 0;
    const completed = trip.permission_slips.filter(
      (s) => s.status === 'paid' || s.status === 'signed'
    ).length;
    return Math.round((completed / total) * 100);
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        activeRole={activeRole}
        userName={teacher ? `${teacher.first_name} ${teacher.last_name}` : undefined}
        onSignOut={signOut}
        appName="TripSlip Teacher"
      />

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border-2 border-black rounded-md"
            >
              <option value="all">All Trips</option>
              <option value="pending">Draft</option>
              <option value="confirmed">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="border-2 border-black shadow-offset">
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Total Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{metrics.totalTrips}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-offset">
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{metrics.totalStudents}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-offset">
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Signed Slips</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {metrics.signedSlips}
                <span className="text-lg text-gray-600">/{metrics.totalStudents}</span>
              </p>
              {metrics.totalStudents > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {Math.round((metrics.signedSlips / metrics.totalStudents) * 100)}% complete
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-black shadow-offset">
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{metrics.pendingPayments}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card className="border-2 border-black shadow-offset">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  className="shadow-offset"
                  onClick={() => navigate('/trips/create')}
                >
                  + Create New Trip
                </Button>
                <Button variant="outline" className="border-2 border-black">
                  Send Reminders
                </Button>
                <Button variant="outline" className="border-2 border-black">
                  View All Trips
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming Trips */}
          <Card className="border-2 border-black shadow-offset">
            <CardHeader>
              <CardTitle>Upcoming Trips</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingTrips.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No upcoming trips</p>
              ) : (
                <div className="space-y-4">
                  {upcomingTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="p-4 border-2 border-black rounded-md hover:shadow-offset transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold">{trip.experience?.title}</h3>
                          <p className="text-sm text-gray-600">{trip.experience?.venue?.name}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            trip.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {trip.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {formatDate(trip.trip_date)}
                          {trip.trip_time && ` at ${formatTime(trip.trip_time)}`}
                        </span>
                        <span className="font-semibold">
                          {getCompletionRate(trip)}% complete
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {trip.permission_slips?.length || 0} students
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/trips/${trip.id}/roster`)}
                          className="border-2 border-black text-xs"
                        >
                          Manage Roster
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/trips/${trip.id}/slips`)}
                          className="shadow-offset text-xs"
                        >
                          Track Slips
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-2 border-black shadow-offset">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 border border-gray-200 rounded-md"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === 'signature' ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                      ></div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-semibold">{activity.studentName}</span>
                          {activity.type === 'signature' ? ' signed' : ' paid for'}
                          <span className="text-gray-600"> {activity.tripName}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
