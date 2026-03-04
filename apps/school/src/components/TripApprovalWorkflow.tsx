import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '@tripslip/database';

type Trip = Database['public']['Tables']['trips']['Row'] & {
  teacher: { first_name: string; last_name: string; email: string };
  venue: { name: string };
  experience: { title: string };
};

interface TripApprovalWorkflowProps {
  schoolId: string;
}

export const TripApprovalWorkflow: React.FC<TripApprovalWorkflowProps> = ({ schoolId }) => {
  const [pendingTrips, setPendingTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingTrips();
  }, [schoolId]);

  const loadPendingTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          teacher:teachers!inner(first_name, last_name, email),
          venue:venues!inner(name),
          experience:experiences!inner(title)
        `)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPendingTrips(data || []);
    } catch (error) {
      console.error('Error loading pending trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tripId: string) => {
    setProcessingId(tripId);
    try {
      const { error } = await supabase
        .from('trips')
        .update({ status: 'approved' })
        .eq('id', tripId);

      if (error) throw error;

      const trip = pendingTrips.find(t => t.id === tripId);
      if (trip) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: trip.teacher.email,
            subject: 'Trip Approved',
            template: 'trip-approval',
            data: { tripName: trip.experience.title, teacherName: `${trip.teacher.first_name} ${trip.teacher.last_name}` },
          },
        });
      }

      loadPendingTrips();
    } catch (error) {
      console.error('Error approving trip:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (tripId: string) => {
    setProcessingId(tripId);
    try {
      const { error } = await supabase
        .from('trips')
        .update({ status: 'draft' })
        .eq('id', tripId);

      if (error) throw error;

      const trip = pendingTrips.find(t => t.id === tripId);
      if (trip) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: trip.teacher.email,
            subject: 'Trip Requires Revision',
            template: 'trip-rejection',
            data: { tripName: trip.experience.title, teacherName: `${trip.teacher.first_name} ${trip.teacher.last_name}` },
          },
        });
      }

      loadPendingTrips();
    } catch (error) {
      console.error('Error rejecting trip:', error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-fraunces font-semibold">Trip Approvals</h2>
      {pendingTrips.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No trips pending approval</div>
      ) : (
        <div className="space-y-4">
          {pendingTrips.map(trip => (
            <div key={trip.id} className="bg-white border rounded-lg p-6 shadow-offset">
              <h3 className="text-xl font-jakarta font-semibold">{trip.experience.title}</h3>
              <p className="text-gray-600 mt-1">{trip.experience.title} at {trip.venue.name}</p>
              <div className="mt-3 flex gap-4 text-sm text-gray-600">
                <span>Teacher: {trip.teacher.first_name} {trip.teacher.last_name}</span>
                <span>Date: {new Date(trip.trip_date).toLocaleDateString()}</span>
                <span className="font-mono">Students: {trip.student_count}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleApprove(trip.id)}
                  disabled={processingId === trip.id}
                  className="px-6 py-2 bg-tripslip-yellow text-black rounded-lg hover:bg-yellow-400 transition-colors shadow-offset disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(trip.id)}
                  disabled={processingId === trip.id}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Request Revision
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
