import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, Button } from '@tripslip/ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { toast } from 'sonner';
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  ChevronRight,
  ClipboardCheck,
  PenLine,
  ShieldCheck,
  XCircle,
  Ban,
  Search,
} from 'lucide-react';

interface Trip {
  id: string;
  trip_date: string;
  trip_time: string | null;
  status: string;
  is_free: boolean;
  funding_model: string | null;
  created_at: string;
  experience: {
    title: string;
    venue: { name: string; address: any } | null;
    pricing_tiers: Array<{ price_cents: number }>;
  } | null;
  slipCount?: number;
  signedCount?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100', icon: PenLine },
  pending_approval: { label: 'Pending Approval', color: 'text-orange-700', bg: 'bg-orange-100', icon: Clock },
  approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-100', icon: ShieldCheck },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bg: 'bg-blue-100', icon: CheckCircle },
  completed: { label: 'Completed', color: 'text-purple-700', bg: 'bg-purple-100', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100', icon: Ban },
};

export default function TripsPage() {
  const navigate = useNavigate();
  const { teacher } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (teacher) fetchTrips();
  }, [teacher]);

  const fetchTrips = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('trips')
        .select(`
          id, trip_date, trip_time, status, is_free, funding_model, created_at,
          experience:experiences (
            title,
            venue:venues (name, address),
            pricing_tiers (price_cents)
          )
        `)
        .eq('teacher_id', teacher!.id)
        .order('trip_date', { ascending: false });

      if (error) throw error;

      const tripsWithCounts = await Promise.all(
        (data || []).map(async (trip: any) => {
          const { count: slipCount } = await supabase
            .from('permission_slips')
            .select('id', { count: 'exact', head: true })
            .eq('trip_id', trip.id);

          const { count: signedCount } = await supabase
            .from('permission_slips')
            .select('id', { count: 'exact', head: true })
            .eq('trip_id', trip.id)
            .in('status', ['signed', 'paid']);

          return { ...trip, slipCount: slipCount || 0, signedCount: signedCount || 0 };
        })
      );

      setTrips(tripsWithCounts);
    } catch (err) {
      console.error('Error fetching trips:', err);
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return ['draft', 'pending_approval', 'approved', 'confirmed'].includes(t.status);
    if (filter === 'past') return ['completed', 'cancelled', 'rejected'].includes(t.status);
    return t.status === filter;
  });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto" />
            <p className="mt-4 text-gray-600">Loading trips...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0A0A0A]">Trips</h1>
            <p className="text-gray-600 mt-1">{trips.length} total trips</p>
          </div>
          <Button
            onClick={() => navigate('/trips/create')}
            className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Trip
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['all', 'upcoming', 'past'] as const).map((f) => {
            const count = trips.filter((t) => {
              if (f === 'all') return true;
              if (f === 'upcoming') return ['draft', 'pending_approval', 'approved', 'confirmed'].includes(t.status);
              return ['completed', 'cancelled', 'rejected'].includes(t.status);
            }).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-colors inline-flex items-center gap-1.5 ${
                  filter === f
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#0A0A0A]'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs font-bold ${
                  filter === f
                    ? 'bg-[#F5C518] text-[#0A0A0A]'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {filteredTrips.length === 0 ? (
          <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]">
            <CardContent className="py-16 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              {trips.length === 0 ? (
                <>
                  <h3 className="text-xl font-bold text-[#0A0A0A] mb-2">No trips yet</h3>
                  <p className="text-gray-600 mb-6">Create your first field trip to get started.</p>
                  <Button
                    onClick={() => navigate('/trips/create')}
                    className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] font-semibold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Trip
                  </Button>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-[#0A0A0A] mb-1">
                    {filter === 'upcoming' ? 'No upcoming trips' : filter === 'past' ? 'No past trips' : 'No trips match this filter'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {filter === 'upcoming'
                      ? 'You don\'t have any active or scheduled trips right now. Create one to get started!'
                      : filter === 'past'
                        ? 'No completed, cancelled, or rejected trips to show yet.'
                        : 'Try selecting a different filter above.'}
                  </p>
                  {filter === 'upcoming' && (
                    <Button
                      onClick={() => navigate('/trips/create')}
                      className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] font-semibold"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create a Trip
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTrips.map((trip) => {
              const statusCfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.draft;
              const costCents = trip.experience?.pricing_tiers?.[0]?.price_cents || 0;

              return (
                <Card
                  key={trip.id}
                  className="border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all cursor-pointer"
                  onClick={() => navigate(`/trips/${trip.id}/roster`)}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-[#0A0A0A] text-lg truncate">
                            {trip.experience?.title || 'Untitled Trip'}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.color} ${statusCfg.bg}`}>
                            {(() => { const Icon = statusCfg.icon; return <Icon className="h-3 w-3" />; })()}
                            {statusCfg.label}
                          </span>
                        </div>

                        {trip.experience?.venue && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{trip.experience.venue.name}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(trip.trip_date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {trip.slipCount} students
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            {trip.signedCount}/{trip.slipCount} signed
                          </div>
                          {!trip.is_free && costCents > 0 && (
                            <div className="text-[#0A0A0A] font-medium">
                              ${(costCents / 100).toFixed(2)}/student
                            </div>
                          )}
                          {trip.is_free && (
                            <span className="text-green-600 font-medium">Free</span>
                          )}
                        </div>
                        <div className="mt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/trips/${trip.id}/manifest`); }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A0A0A] bg-[#F5C518] border-2 border-[#0A0A0A] rounded-lg px-3 py-1.5 hover:shadow-[2px_2px_0px_#0A0A0A] transition-all"
                          >
                            <ClipboardCheck className="h-3.5 w-3.5" />
                            Attendance
                          </button>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
