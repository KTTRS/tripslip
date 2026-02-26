import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent } from '@tripslip/ui';
import { createSupabaseClient } from '@tripslip/database';
import PendingTripsList from '../components/PendingTripsList';
import TripApprovalModal from '../components/TripApprovalModal';

const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface PendingTrip {
  id: string;
  trip_date: string;
  trip_time: string | null;
  student_count: number;
  status: string;
  teacher: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  experience: {
    id: string;
    title: string;
    description: string | null;
    duration_minutes: number;
    venue: {
      name: string;
      address: any;
    };
  };
  permission_slips: Array<{
    id: string;
    status: string;
  }>;
  total_cost: number;
}

export default function ApprovalsPage() {
  const [pendingTrips, setPendingTrips] = useState<PendingTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<PendingTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [schoolId] = useState('default-school-id'); // TODO: Get from auth context

  useEffect(() => {
    fetchPendingTrips();
  }, [schoolId]);

  const fetchPendingTrips = async () => {
    try {
      setLoading(true);

      // Fetch trips with pending status
      const { data: trips, error } = await supabase
        .from('trips')
        .select(`
          id,
          trip_date,
          trip_time,
          student_count,
          status,
          teacher:teachers (
            id,
            first_name,
            last_name,
            email
          ),
          experience:experiences (
            id,
            title,
            description,
            duration_minutes,
            venue:venues (
              name,
              address
            )
          ),
          permission_slips (
            id,
            status
          )
        `)
        .eq('status', 'pending')
        .eq('teachers.school_id', schoolId)
        .order('trip_date', { ascending: true });

      if (error) throw error;

      // Calculate total cost for each trip
      const tripsWithCost = await Promise.all(
        (trips || []).map(async (trip: any) => {
          // Get pricing for the experience
          const { data: pricing } = await supabase
            .from('pricing_tiers')
            .select('price_cents')
            .eq('experience_id', trip.experience.id)
            .lte('min_students', trip.student_count)
            .gte('max_students', trip.student_count)
            .single();

          const totalCost = pricing
            ? pricing.price_cents * trip.student_count
            : 0;

          return {
            ...trip,
            total_cost: totalCost,
          };
        })
      );

      setPendingTrips(tripsWithCost);
    } catch (error) {
      console.error('Error fetching pending trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTripClick = (trip: PendingTrip) => {
    setSelectedTrip(trip);
  };

  const handleCloseModal = () => {
    setSelectedTrip(null);
  };

  const handleApprovalComplete = () => {
    setSelectedTrip(null);
    fetchPendingTrips(); // Refresh the list
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b-2 border-black p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold font-display">TripSlip School</h1>
          <div className="flex gap-4">
            <Link to="/" className="px-4 py-2 font-semibold hover:bg-gray-100 rounded">
              Dashboard
            </Link>
            <Link to="/teachers" className="px-4 py-2 font-semibold hover:bg-gray-100 rounded">
              Teachers
            </Link>
            <Link
              to="/approvals"
              className="px-4 py-2 font-semibold bg-gray-100 rounded"
            >
              Approvals
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Trip Approvals</h2>
          <p className="text-gray-600 mt-2">
            Review and approve pending field trips from teachers
          </p>
        </div>

        {pendingTrips.length === 0 ? (
          <Card className="border-2 border-black shadow-offset">
            <CardContent className="py-12">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No pending approvals
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  All trips have been reviewed. Check back later for new submissions.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <PendingTripsList trips={pendingTrips} onTripClick={handleTripClick} />
        )}
      </main>

      {selectedTrip && (
        <TripApprovalModal
          trip={selectedTrip}
          onClose={handleCloseModal}
          onApprovalComplete={handleApprovalComplete}
        />
      )}
    </div>
  );
}
