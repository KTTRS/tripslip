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

  const statCards = [
    { label: 'Total Trips', value: stats.trips, icon: '/images/icon-compass.png', color: 'yellow' as const, nav: '/trips' },
    { label: 'Upcoming', value: stats.upcoming, icon: '/images/icon-calendar.png', color: 'green' as const, nav: '/trips' },
    { label: 'Students', value: stats.students, icon: '/images/icon-team.png', color: 'sky' as const, nav: '/students' },
    { label: 'Pending Slips', value: stats.pendingSlips, icon: '/images/icon-permission.png', color: 'orange' as const, nav: '/trips' },
  ];

  const quickActions = [
    { title: 'Create a Trip', desc: 'Plan a new field trip', icon: '/images/icon-pencil.png', color: 'yellow' as const, nav: '/trips/create' },
    { title: 'Manage Students', desc: 'Add students or upload a CSV', icon: '/images/icon-team.png', color: 'sky' as const, nav: '/students' },
    { title: 'Browse Venues', desc: 'Find field trip destinations', icon: '/images/icon-venue.png', color: 'green' as const, nav: '/venues/search' },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="relative rounded-2xl bg-gradient-to-br from-[#F5C518]/15 via-[#F5C518]/5 to-blue-50/30 p-8 md:p-10 overflow-hidden border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="relative hidden sm:block">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-white/80 border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] flex items-center justify-center p-2">
                  <img
                    src="/images/char-pink-heart.png"
                    alt="Buddy the TripSlip character"
                    className="w-full h-full object-contain animate-float drop-shadow-lg"
                  />
                </div>
                <img src="/images/icon-pencil.png" alt="" className="w-14 h-14 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)] absolute -bottom-2 -right-2 animate-wiggle" />
              </div>
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-[#0A0A0A] tracking-tight">
                  Welcome back, {displayName}
                </h2>
                <p className="text-gray-500 mt-2 text-base">Here's what's happening with your field trips</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/trips/create')}
              className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all font-bold px-8 py-3 text-base"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Trip
            </Button>
          </div>
          <img src="/images/icon-bus.png" alt="" className="w-24 h-24 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)] absolute -top-1 right-6 opacity-20 animate-float hidden md:block" />
          <img src="/images/icon-backpack.png" alt="" className="w-20 h-20 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)] absolute bottom-3 right-24 opacity-15 animate-bounce-slow hidden md:block" />
          <img src="/images/char-yellow-star.png" alt="" className="w-20 h-20 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)] absolute top-4 right-48 opacity-10 animate-float-delayed hidden lg:block" />
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {statCards.map((card) => (
            <Card
              key={card.label}
              className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] cursor-pointer hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all bg-white group"
              onClick={() => navigate(card.nav)}
            >
              <CardContent className="pt-5 pb-4 px-4">
                <div className="flex flex-col items-center text-center gap-3 sm:flex-row sm:text-left">
                  <img src={card.icon} alt={card.label} className="w-20 h-20 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)] group-hover:animate-wiggle" />
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{card.label}</p>
                    <p className="font-display text-3xl font-bold text-[#0A0A0A]">{card.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <img src="/images/icon-magic.png" alt="" className="w-10 h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
              <h3 className="font-display text-xl font-bold text-[#0A0A0A]">Quick Actions</h3>
            </div>
            <div className="grid gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={() => navigate(action.nav)}
                  className="flex items-center gap-4 p-4 bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all text-left group"
                >
                  <img src={action.icon} alt={action.title} className="w-20 h-20 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)] group-hover:animate-wiggle" />
                  <div className="flex-1">
                    <div className="font-bold text-[#0A0A0A] text-base">{action.title}</div>
                    <div className="text-sm text-gray-500">{action.desc}</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#0A0A0A] group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <img src="/images/icon-calendar.png" alt="" className="w-10 h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
                <h3 className="font-display text-xl font-bold text-[#0A0A0A]">Upcoming Trips</h3>
              </div>
              {recentTrips.length > 0 && (
                <button
                  onClick={() => navigate('/trips')}
                  className="text-sm text-gray-500 hover:text-[#0A0A0A] font-semibold flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
            {recentTrips.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
                <CardContent className="py-12 text-center">
                  <img src="/images/icon-calendar.png" alt="" className="w-20 h-20 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)] mx-auto mb-4 opacity-40" />
                  <p className="text-gray-500 font-bold text-base">No upcoming trips</p>
                  <p className="text-sm text-gray-400 mt-1">Create a trip to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentTrips.map((trip: any) => (
                  <Card
                    key={trip.id}
                    className="border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[6px_6px_0px_#0A0A0A] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all cursor-pointer bg-white group"
                    onClick={() => navigate(`/trips/${trip.id}/roster`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[#0A0A0A] truncate text-base">
                            {trip.experience?.title || 'Untitled'}
                          </h4>
                          {trip.experience?.venue?.name && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {trip.experience.venue.name}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(trip.trip_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 mt-1 group-hover:text-[#0A0A0A] group-hover:translate-x-1 transition-all" />
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
