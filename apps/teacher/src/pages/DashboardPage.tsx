import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, Button } from '@tripslip/ui';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import {
  MapPin,
  Calendar,
  Plus,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { teacher, user } = useAuth();
  const [stats, setStats] = useState({ trips: 0, upcoming: 0, students: 0, pendingSlips: 0 });
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teacher) fetchDashboardData();
  }, [teacher]);

  const fetchDashboardData = async () => {
    if (!teacher) return;

    try {
      setLoading(true);

      const { data: trips } = await supabase
        .from('trips')
        .select('id, trip_date, trip_time, status, experience:experiences(title, venue:venues(name))')
        .eq('teacher_id', teacher.id)
        .order('trip_date', { ascending: false });

      const allTrips = trips || [];
      const today = new Date().toISOString().split('T')[0];
      const upcoming = allTrips.filter((t) => t.trip_date >= today && !['cancelled', 'completed', 'rejected'].includes(t.status));

      const { data: rosters } = await supabase
        .from('rosters')
        .select('id')
        .eq('teacher_id', teacher.id);

      let studentCount = 0;
      if (rosters && rosters.length > 0) {
        const { count } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .in('roster_id', rosters.map((r) => r.id));
        studentCount = count || 0;
      }

      let pendingSlips = 0;
      if (allTrips.length > 0) {
        const { count } = await supabase
          .from('permission_slips')
          .select('id', { count: 'exact', head: true })
          .in('trip_id', allTrips.map((t) => t.id))
          .eq('status', 'pending');
        pendingSlips = count || 0;
      }

      setStats({
        trips: allTrips.length,
        upcoming: upcoming.length,
        students: studentCount,
        pendingSlips: pendingSlips,
      });

      setRecentTrips(upcoming.slice(0, 3));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayName = teacher
    ? `${teacher.first_name}`
    : user?.email?.split('@')[0] || 'Teacher';

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto mb-4" />
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="relative rounded-2xl bg-gradient-to-r from-[#F5C518]/10 via-[#F5C518]/5 to-transparent p-6 md:p-8 overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-5">
              <img
                src="/images/char-pink-heart.png"
                alt="TripSlip character"
                className="w-20 h-20 md:w-24 md:h-24 object-contain animate-float drop-shadow-lg hidden sm:block"
              />
              <div>
                <h2 className="text-3xl font-bold text-[#0A0A0A]">Welcome back, {displayName}</h2>
                <p className="text-gray-500 mt-1">Here's what's happening with your field trips</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/trips/create')}
              className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-semibold px-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Trip
            </Button>
          </div>
          <img
            src="/images/icon-bus.png"
            alt=""
            className="absolute -top-2 right-4 w-12 h-12 opacity-20 animate-float hidden md:block"
          />
          <img
            src="/images/icon-backpack.png"
            alt=""
            className="absolute bottom-2 right-20 w-10 h-10 opacity-15 animate-bounce-slow hidden md:block"
          />
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card
            className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] cursor-pointer hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            onClick={() => navigate('/trips')}
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#F5C518]/20 border-2 border-[#0A0A0A] flex items-center justify-center p-1.5">
                  <img src="/images/icon-compass.png" alt="Total Trips" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Trips</p>
                  <p className="text-2xl font-bold text-[#0A0A0A]">{stats.trips}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] cursor-pointer hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            onClick={() => navigate('/trips')}
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 border-2 border-[#0A0A0A] flex items-center justify-center p-1.5">
                  <img src="/images/icon-calendar.png" alt="Upcoming" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Upcoming</p>
                  <p className="text-2xl font-bold text-[#0A0A0A]">{stats.upcoming}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] cursor-pointer hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            onClick={() => navigate('/students')}
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 border-2 border-[#0A0A0A] flex items-center justify-center p-1.5">
                  <img src="/images/icon-team.png" alt="Students" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Students</p>
                  <p className="text-2xl font-bold text-[#0A0A0A]">{stats.students}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] cursor-pointer hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            onClick={() => navigate('/trips')}
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100 border-2 border-[#0A0A0A] flex items-center justify-center p-1.5">
                  <img src="/images/icon-permission.png" alt="Pending Slips" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Pending Slips</p>
                  <p className="text-2xl font-bold text-[#0A0A0A]">{stats.pendingSlips}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#0A0A0A]">Quick Actions</h3>
            </div>
            <div className="grid gap-3">
              <button
                onClick={() => navigate('/trips/create')}
                className="flex items-center gap-3 p-4 bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-[#F5C518]/20 border-2 border-[#0A0A0A] flex items-center justify-center p-1.5">
                  <img src="/images/icon-pencil.png" alt="Create Trip" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="font-semibold text-[#0A0A0A]">Create a Trip</div>
                  <div className="text-xs text-gray-500">Plan a new field trip</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/students')}
                className="flex items-center gap-3 p-4 bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 border-2 border-[#0A0A0A] flex items-center justify-center p-1.5">
                  <img src="/images/icon-team.png" alt="Manage Students" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="font-semibold text-[#0A0A0A]">Manage Students</div>
                  <div className="text-xs text-gray-500">Add students or upload a CSV</div>
                </div>
              </button>
              <button
                onClick={() => navigate('/venues/search')}
                className="flex items-center gap-3 p-4 bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-green-100 border-2 border-[#0A0A0A] flex items-center justify-center p-1.5">
                  <img src="/images/icon-venue.png" alt="Browse Venues" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="font-semibold text-[#0A0A0A]">Browse Venues</div>
                  <div className="text-xs text-gray-500">Find field trip destinations</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#0A0A0A]">Upcoming Trips</h3>
              {recentTrips.length > 0 && (
                <button
                  onClick={() => navigate('/trips')}
                  className="text-sm text-gray-500 hover:text-[#0A0A0A] font-medium flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
            {recentTrips.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="py-10 text-center">
                  <img src="/images/icon-calendar.png" alt="" className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-gray-500 font-medium">No upcoming trips</p>
                  <p className="text-sm text-gray-400 mt-1">Create a trip to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentTrips.map((trip: any) => (
                  <Card
                    key={trip.id}
                    className="border-2 border-[#0A0A0A] hover:shadow-[3px_3px_0px_#0A0A0A] transition-all cursor-pointer"
                    onClick={() => navigate(`/trips/${trip.id}/roster`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[#0A0A0A] truncate">
                            {trip.experience?.title || 'Untitled'}
                          </h4>
                          {trip.experience?.venue?.name && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {trip.experience.venue.name}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(trip.trip_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
