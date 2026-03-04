import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tripslip/ui';
import { useAuth } from '../contexts/AuthContext';
import { Navigation } from '@tripslip/auth';

const MOCK_TRIPS = [
  {
    id: '1',
    trip_date: '2026-03-18',
    trip_time: '09:00:00',
    status: 'confirmed',
    student_count: 28,
    experience: { title: 'Natural History Museum Tour', venue: { name: 'Smithsonian Museum' } },
    permission_slips: [
      { id: 's1', status: 'paid', signed_at: '2026-03-02T14:30:00Z', payments: [{ status: 'succeeded', amount_cents: 1500 }] },
      { id: 's2', status: 'paid', signed_at: '2026-03-02T15:00:00Z', payments: [{ status: 'succeeded', amount_cents: 1500 }] },
      { id: 's3', status: 'signed', signed_at: '2026-03-03T09:00:00Z', payments: [] },
      { id: 's4', status: 'signed', signed_at: '2026-03-03T10:15:00Z', payments: [] },
      { id: 's5', status: 'paid', signed_at: '2026-03-01T11:00:00Z', payments: [{ status: 'succeeded', amount_cents: 1500 }] },
      { id: 's6', status: 'pending', signed_at: null, payments: [] },
      { id: 's7', status: 'paid', signed_at: '2026-03-01T16:00:00Z', payments: [{ status: 'succeeded', amount_cents: 1500 }] },
      { id: 's8', status: 'pending', signed_at: null, payments: [] },
    ],
  },
  {
    id: '2',
    trip_date: '2026-03-25',
    trip_time: '10:30:00',
    status: 'confirmed',
    student_count: 32,
    experience: { title: 'Science Center Workshop', venue: { name: 'Discovery Science Center' } },
    permission_slips: [
      { id: 's9', status: 'paid', signed_at: '2026-03-03T08:00:00Z', payments: [{ status: 'succeeded', amount_cents: 2000 }] },
      { id: 's10', status: 'signed', signed_at: '2026-03-03T12:00:00Z', payments: [] },
      { id: 's11', status: 'pending', signed_at: null, payments: [] },
      { id: 's12', status: 'paid', signed_at: '2026-03-02T09:30:00Z', payments: [{ status: 'succeeded', amount_cents: 2000 }] },
      { id: 's13', status: 'pending', signed_at: null, payments: [] },
      { id: 's14', status: 'paid', signed_at: '2026-03-01T14:00:00Z', payments: [{ status: 'succeeded', amount_cents: 2000 }] },
    ],
  },
  {
    id: '3',
    trip_date: '2026-04-10',
    trip_time: '08:00:00',
    status: 'pending',
    student_count: 25,
    experience: { title: 'Botanical Garden Field Study', venue: { name: 'City Botanical Gardens' } },
    permission_slips: [
      { id: 's15', status: 'pending', signed_at: null, payments: [] },
      { id: 's16', status: 'signed', signed_at: '2026-03-04T10:00:00Z', payments: [] },
    ],
  },
  {
    id: '4',
    trip_date: '2026-04-22',
    trip_time: '09:30:00',
    status: 'pending',
    student_count: 30,
    experience: { title: 'Art Gallery Visit', venue: { name: 'Metropolitan Art Museum' } },
    permission_slips: [],
  },
];

const MOCK_ACTIVITIES = [
  { id: 'a1', type: 'payment' as const, studentName: 'Emma Johnson', tripName: 'Natural History Museum Tour', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: 'a2', type: 'signature' as const, studentName: 'Liam Chen', tripName: 'Science Center Workshop', timestamp: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: 'a3', type: 'payment' as const, studentName: 'Sophia Martinez', tripName: 'Natural History Museum Tour', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'a4', type: 'signature' as const, studentName: 'Noah Williams', tripName: 'Natural History Museum Tour', timestamp: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 'a5', type: 'payment' as const, studentName: 'Olivia Brown', tripName: 'Science Center Workshop', timestamp: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'a6', type: 'signature' as const, studentName: 'Ava Davis', tripName: 'Botanical Garden Field Study', timestamp: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: 'a7', type: 'payment' as const, studentName: 'James Wilson', tripName: 'Science Center Workshop', timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 'a8', type: 'signature' as const, studentName: 'Isabella Garcia', tripName: 'Natural History Museum Tour', timestamp: new Date(Date.now() - 26 * 3600000).toISOString() },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { teacher, user, signOut, activeRole } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTrips = statusFilter === 'all'
    ? MOCK_TRIPS
    : MOCK_TRIPS.filter(t => t.status === statusFilter);

  const allSlips = filteredTrips.flatMap(t => t.permission_slips);
  const metrics = {
    totalTrips: filteredTrips.length,
    totalStudents: allSlips.length,
    signedSlips: allSlips.filter(s => s.status === 'signed' || s.status === 'paid').length,
    pendingPayments: allSlips.filter(s => s.status === 'signed' && !s.payments?.some(p => p.status === 'succeeded')).length,
  };

  const today = new Date().toISOString().split('T')[0];
  const upcomingTrips = filteredTrips.filter(t => t.trip_date >= today).slice(0, 5);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getCompletionRate = (trip: typeof MOCK_TRIPS[0]) => {
    const total = trip.permission_slips?.length || 0;
    if (total === 0) return 0;
    const completed = trip.permission_slips.filter(s => s.status === 'paid' || s.status === 'signed').length;
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

  const displayName = teacher ? `${teacher.first_name} ${teacher.last_name}` : (user?.email?.split('@')[0] || 'Teacher');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        activeRole={activeRole}
        userName={displayName}
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

        <div className="mb-8">
          <Card className="border-2 border-black shadow-offset">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button className="shadow-offset" onClick={() => navigate('/trips/create')}>
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
                          {trip.status === 'confirmed' ? 'Active' : 'Draft'}
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
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-black rounded-full h-2 transition-all"
                          style={{ width: `${getCompletionRate(trip)}%` }}
                        ></div>
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

          <Card className="border-2 border-black shadow-offset">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_ACTIVITIES.map((activity) => (
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
