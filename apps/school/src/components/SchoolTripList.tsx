import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '@tripslip/database';

type Trip = Database['public']['Tables']['trips']['Row'] & {
  teacher: {
    name: string;
    email: string;
  };
  venue: {
    name: string;
  };
  experience: {
    title: string;
  };
};

interface SchoolTripListProps {
  schoolId: string;
}

export const SchoolTripList: React.FC<SchoolTripListProps> = ({ schoolId }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
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
          *,
          teacher:teachers!inner(name, email),
          venue:venues!inner(name),
          experience:experiences!inner(title)
        `)
        .eq('school_id', schoolId)
        .order('trip_date', { ascending: false });

      if (error) throw error;
      setTrips(data as Trip[]);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      trip.experience.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.venue.name.toLowerCase().includes(searchTerm.toLowerCase());

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
        <h2 className="text-2xl font-fraunces font-semibold">School Trips</h2>
        <div className="text-sm text-gray-600 font-mono">
          {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search trips, teachers, or venues..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tripslip-blue focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tripslip-blue focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Trips List */}
      {filteredTrips.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm || statusFilter !== 'all'
            ? 'No trips match your filters'
            : 'No trips found'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-offset hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-jakarta font-semibold">
                    {trip.experience.title}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {trip.experience.title} at {trip.venue.name}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span>
                      Teacher: <span className="font-medium">{trip.teacher.name}</span>
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
                    trip.status === 'approved' || trip.status === 'active'
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
                  {trip.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
