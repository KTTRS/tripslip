import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface TripData {
  id: string;
  trip_date: string;
  status: string;
  student_count: number;
  teacher: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  experience: {
    title: string;
    venue: {
      name: string;
    } | null;
  } | null;
}

interface SchoolTripListProps {
  schoolId: string;
}

export const SchoolTripList: React.FC<SchoolTripListProps> = ({ schoolId }) => {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadTrips();
  }, [schoolId]);

  const loadTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          trip_date,
          status,
          student_count,
          teacher:teachers!inner(first_name, last_name, email, school_id),
          experience:experiences(
            title,
            venue:venues(name)
          )
        `)
        .eq('teachers.school_id', schoolId)
        .order('trip_date', { ascending: false });

      if (error) throw error;
      setTrips((data || []) as TripData[]);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeacherName = (trip: TripData) => {
    if (!trip.teacher) return 'Unknown Teacher';
    return `${trip.teacher.first_name} ${trip.teacher.last_name}`;
  };

  const getVenueName = (trip: TripData) => {
    return trip.experience?.venue?.name || 'Unknown Venue';
  };

  const getExperienceTitle = (trip: TripData) => {
    return trip.experience?.title || 'Untitled Trip';
  };

  const filteredTrips = trips.filter((trip) => {
    const teacherName = getTeacherName(trip).toLowerCase();
    const venueName = getVenueName(trip).toLowerCase();
    const expTitle = getExperienceTitle(trip).toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      expTitle.includes(term) ||
      teacherName.includes(term) ||
      venueName.includes(term);

    const matchesStatus =
      statusFilter === 'all' || trip.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="text-center py-8">Loading trips...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-['Fraunces'] font-semibold">School Trips</h2>
        <div className="text-sm text-gray-600 font-mono">
          {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search trips, teachers, or venues..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border-2 border-black rounded focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border-2 border-black rounded focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filteredTrips.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm || statusFilter !== 'all'
            ? 'No trips match your filters'
            : 'No trips found for this school'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {getExperienceTitle(trip)}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    at {getVenueName(trip)}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span>
                      Teacher: <span className="font-medium">{getTeacherName(trip)}</span>
                    </span>
                    <span>
                      Date:{' '}
                      <span className="font-medium">
                        {new Date(trip.trip_date).toLocaleDateString()}
                      </span>
                    </span>
                    <span className="font-mono">
                      Students: {trip.student_count}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                    trip.status === 'approved' || trip.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : trip.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : trip.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : trip.status === 'pending_approval'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {trip.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
