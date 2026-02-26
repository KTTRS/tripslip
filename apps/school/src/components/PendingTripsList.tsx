import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui';

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

interface PendingTripsListProps {
  trips: PendingTrip[];
  onTripClick: (trip: PendingTrip) => void;
}

export default function PendingTripsList({ trips, onTripClick }: PendingTripsListProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return 'Time TBD';
    return timeStr;
  };

  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <Card
          key={trip.id}
          className="border-2 border-black shadow-offset hover:shadow-offset-lg transition-shadow cursor-pointer"
          onClick={() => onTripClick(trip)}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{trip.experience.title}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {trip.experience.venue.name}
                </p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded">
                Pending Approval
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Date & Time</p>
                <p className="font-semibold">
                  {formatDate(trip.trip_date)}
                </p>
                <p className="text-sm text-gray-700">{formatTime(trip.trip_time)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teacher</p>
                <p className="font-semibold">
                  {trip.teacher.first_name} {trip.teacher.last_name}
                </p>
                <p className="text-sm text-gray-700">{trip.teacher.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Students</p>
                <p className="text-2xl font-bold">{trip.student_count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-2xl font-bold">{trip.experience.duration_minutes} min</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(trip.total_cost)}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                className="w-full px-4 py-2 bg-black text-white font-semibold rounded hover:bg-gray-800 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onTripClick(trip);
                }}
              >
                Review Trip Details
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
