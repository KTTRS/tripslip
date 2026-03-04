import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tripslip/ui';
import { Badge } from '@tripslip/ui/components/badge';
import { useAuth } from '../contexts/AuthContext';
import { Navigation } from '@tripslip/auth';
import { supabase } from '../lib/supabase';
import { MapPin, Calendar, Users, Plus, Clock, ArrowRight, Compass } from 'lucide-react';

interface TripWithDetails {
  id: string;
  trip_date: string;
  trip_time: string | null;
  status: string;
  student_count: number;
  experience_id: string;
  created_at: string;
  experience?: {
    title: string;
    duration_minutes: number;
    venue?: {
      name: string;
      address: any;
    } | null;
  } | null;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { teacher, user, signOut, activeRole } = useAuth();
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: teacherRecord } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (teacherRecord) {
        const { data: tripData } = await supabase
          .from('trips')
          .select('*, experience:experiences(title, duration_minutes, venue:venues(name, address))')
          .eq('teacher_id', teacherRecord.id)
          .order('trip_date', { ascending: true });

        if (tripData) {
          setTrips(tripData as TripWithDetails[]);
        }

        const { data: rosters } = await supabase
          .from('rosters')
          .select('id')
          .eq('teacher_id', teacherRecord.id);

        if (rosters && rosters.length > 0) {
          const rosterIds = rosters.map(r => r.id);
          const { count } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .in('roster_id', rosterIds);
          setStudentCount(count || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcomingTrips = trips.filter(t => t.trip_date >= today);
  const pastTrips = trips.filter(t => t.trip_date < today);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed': return { label: 'Active', bg: 'bg-green-100 text-green-800 border-green-300' };
      case 'completed': return { label: 'Completed', bg: 'bg-gray-100 text-gray-800 border-gray-300' };
      case 'cancelled': return { label: 'Cancelled', bg: 'bg-red-100 text-red-800 border-red-300' };
      default: return { label: 'Draft', bg: 'bg-[#FFFDE7] text-[#0A0A0A] border-[#F5C518]' };
    }
  };

  const displayName = teacher ? `${teacher.first_name} ${teacher.last_name}` : (user?.email?.split('@')[0] || 'Teacher');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation activeRole={activeRole} userName={displayName} onSignOut={signOut} appName="TripSlip Teacher" />
        <main className="max-w-7xl mx-auto p-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeRole={activeRole} userName={displayName} onSignOut={signOut} appName="TripSlip Teacher" />

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#0A0A0A]">
              Welcome back, {displayName.split(' ')[0]}
            </h2>
            <p className="text-gray-500 mt-1">Manage your field trips and track permission slips</p>
          </div>
          <Button
            onClick={() => navigate('/trips/create')}
            className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 font-semibold px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Trip
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#F5C518] border-2 border-[#0A0A0A] flex items-center justify-center">
                  <Compass className="h-6 w-6 text-[#0A0A0A]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Trips</p>
                  <p className="text-3xl font-bold text-[#0A0A0A]">{trips.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 border-2 border-[#0A0A0A] flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-green-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Upcoming</p>
                  <p className="text-3xl font-bold text-[#0A0A0A]">{upcomingTrips.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-[#0A0A0A] flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Students</p>
                  <p className="text-3xl font-bold text-[#0A0A0A]">{studentCount || trips.reduce((sum, t) => sum + t.student_count, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {trips.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 bg-white">
            <CardContent className="py-16">
              <div className="text-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-[#FFFDE7] border-2 border-[#F5C518] flex items-center justify-center mx-auto mb-6">
                  <Compass className="h-10 w-10 text-[#F5C518]" />
                </div>
                <h3 className="text-2xl font-bold text-[#0A0A0A] mb-3">Plan Your First Trip!</h3>
                <p className="text-gray-500 mb-6">
                  Create a field trip, select experiences, add students, and automatically generate permission slips for parents.
                </p>
                <Button
                  onClick={() => navigate('/trips/create')}
                  className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 font-semibold px-8 py-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Trip
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {upcomingTrips.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-[#0A0A0A] mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Trips
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {upcomingTrips.map((trip) => {
                    const status = getStatusConfig(trip.status);
                    return (
                      <Card
                        key={trip.id}
                        className="border-2 border-[#0A0A0A] hover:shadow-[4px_4px_0px_#0A0A0A] transition-all duration-200 cursor-pointer"
                        onClick={() => navigate(`/trips/${trip.id}`)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[#0A0A0A] text-lg truncate">
                                {trip.experience?.title || 'Untitled Experience'}
                              </h4>
                              {trip.experience?.venue?.name && (
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  {trip.experience.venue.name}
                                </p>
                              )}
                            </div>
                            <Badge className={`${status.bg} border shrink-0 ml-2`}>
                              {status.label}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-4">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{formatDate(trip.trip_date)}</span>
                            </div>
                            {trip.trip_time && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{formatTime(trip.trip_time)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5" />
                              <span>{trip.student_count} students</span>
                            </div>
                          </div>

                          <div className="flex justify-end mt-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#0A0A0A] hover:bg-[#FFFDE7] font-medium"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/trips/${trip.id}`);
                              }}
                            >
                              View Details
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {pastTrips.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-[#0A0A0A] mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Past Trips
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {pastTrips.map((trip) => {
                    const status = getStatusConfig(trip.status);
                    return (
                      <Card
                        key={trip.id}
                        className="border-2 border-gray-200 hover:border-[#0A0A0A] transition-all duration-200 cursor-pointer opacity-80"
                        onClick={() => navigate(`/trips/${trip.id}`)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-700 truncate">
                                {trip.experience?.title || 'Untitled Experience'}
                              </h4>
                              {trip.experience?.venue?.name && (
                                <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  {trip.experience.venue.name}
                                </p>
                              )}
                            </div>
                            <Badge className={`${status.bg} border shrink-0 ml-2`}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mt-4">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{formatDate(trip.trip_date)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5" />
                              <span>{trip.student_count} students</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
