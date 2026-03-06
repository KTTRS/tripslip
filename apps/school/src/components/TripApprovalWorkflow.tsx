import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSchoolAuth } from '../contexts/SchoolAuthContext';
import type { Database } from '@tripslip/database';

type Trip = Database['public']['Tables']['trips']['Row'] & {
  teacher: { first_name: string; last_name: string; email: string };
  experience: { title: string; venue: { name: string } };
};

interface TripApprovalWorkflowProps {
  schoolId: string;
}

export const TripApprovalWorkflow: React.FC<TripApprovalWorkflowProps> = ({ schoolId }) => {
  const { user } = useSchoolAuth();
  const [pendingTrips, setPendingTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPendingTrips();
  }, [schoolId]);

  const loadPendingTrips = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('trips')
        .select(`
          *,
          teacher:teachers!inner(first_name, last_name, email),
          experience:experiences!inner(title, venue:venues!inner(name))
        `)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setPendingTrips(data || []);
    } catch (err) {
      console.error('Error loading pending trips:', err);
      setError('Failed to load pending trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tripId: string) => {
    setProcessingId(tripId);
    setSuccessMessage(null);
    try {
      const { error: updateError } = await supabase
        .from('trips')
        .update({ status: 'approved' })
        .eq('id', tripId);

      if (updateError) throw updateError;

      await supabase
        .from('trip_approvals')
        .insert({
          trip_id: tripId,
          administrator_id: user?.id || null,
          administrator_name: user?.email || 'Unknown',
          decision: 'approved',
          comments: null,
          reason: null,
        })
        .then(() => {});

      const trip = pendingTrips.find(t => t.id === tripId);
      if (trip) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: trip.teacher.email,
            subject: 'Trip Approved',
            template: 'trip-approval',
            data: { tripName: trip.experience.title, teacherName: `${trip.teacher.first_name} ${trip.teacher.last_name}` },
          },
        }).catch(() => {});
      }

      setSuccessMessage(`Trip "${trip?.experience.title || ''}" has been approved.`);
      loadPendingTrips();
    } catch (err) {
      console.error('Error approving trip:', err);
      setError('Failed to approve trip. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (tripId: string) => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }

    setProcessingId(tripId);
    setSuccessMessage(null);
    try {
      const { error: updateError } = await supabase
        .from('trips')
        .update({ status: 'rejected' })
        .eq('id', tripId);

      if (updateError) throw updateError;

      await supabase
        .from('trip_approvals')
        .insert({
          trip_id: tripId,
          administrator_id: user?.id || null,
          administrator_name: user?.email || 'Unknown',
          decision: 'rejected',
          comments: null,
          reason: rejectReason.trim(),
        })
        .then(() => {});

      const trip = pendingTrips.find(t => t.id === tripId);
      if (trip) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: trip.teacher.email,
            subject: 'Trip Requires Revision',
            template: 'trip-rejection',
            data: {
              tripName: trip.experience.title,
              teacherName: `${trip.teacher.first_name} ${trip.teacher.last_name}`,
              reason: rejectReason.trim(),
            },
          },
        }).catch(() => {});
      }

      setSuccessMessage(`Trip "${trip?.experience.title || ''}" has been rejected.`);
      setRejectingId(null);
      setRejectReason('');
      loadPendingTrips();
    } catch (err) {
      console.error('Error rejecting trip:', err);
      setError('Failed to reject trip. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading pending approvals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Trip Approvals</h2>
        <span className="text-sm text-gray-500">
          {pendingTrips.length} pending {pendingTrips.length === 1 ? 'trip' : 'trips'}
        </span>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg text-green-800 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-600 hover:text-green-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg text-red-800 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {pendingTrips.length === 0 ? (
        <div className="text-center py-16 bg-white border-2 border-black rounded-lg shadow-offset">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-3 text-lg font-semibold text-gray-900">All caught up!</h3>
          <p className="mt-1 text-gray-500">No trips are pending approval right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingTrips.map(trip => (
            <div key={trip.id} className="bg-white border-2 border-black rounded-lg p-6 shadow-offset">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{trip.experience.title}</h3>
                  <p className="text-gray-600 mt-1">at {(trip.experience as any).venue?.name || 'Unknown venue'}</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                  Pending Approval
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Teacher</p>
                  <p className="font-semibold">{trip.teacher.first_name} {trip.teacher.last_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Trip Date</p>
                  <p className="font-semibold">{new Date(trip.trip_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-gray-500">Students</p>
                  <p className="font-semibold">{trip.student_count}</p>
                </div>
              </div>

              {rejectingId === trip.id ? (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <label className="block text-sm font-semibold text-red-800 mb-2">
                    Reason for Rejection <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => {
                      setRejectReason(e.target.value);
                      setError(null);
                    }}
                    className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={3}
                    placeholder="Please explain why this trip is being rejected..."
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleReject(trip.id)}
                      disabled={processingId === trip.id}
                      className="px-5 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {processingId === trip.id ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setRejectReason(''); setError(null); }}
                      disabled={processingId === trip.id}
                      className="px-5 py-2 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleApprove(trip.id)}
                    disabled={processingId === trip.id}
                    className="px-6 py-2 bg-tripslip-yellow text-black font-semibold rounded-lg border-2 border-black hover:bg-yellow-400 transition-colors shadow-offset disabled:opacity-50"
                  >
                    {processingId === trip.id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => { setRejectingId(trip.id); setError(null); }}
                    disabled={processingId === trip.id}
                    className="px-6 py-2 bg-white text-red-600 font-semibold rounded-lg border-2 border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
