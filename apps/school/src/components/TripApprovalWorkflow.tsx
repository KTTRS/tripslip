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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C518] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading pending approvals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#F5C518]/20 via-white to-[#4CAF50]/10 border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#F5C518]/20 border-2 border-[#0A0A0A] flex items-center justify-center p-1.5 flex-shrink-0">
            <img src="/images/icon-shield.png" alt="" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#0A0A0A]">Trip Approvals</h2>
            <p className="text-gray-600 text-sm mt-0.5">Review and manage pending trip requests</p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center px-3 py-1.5 bg-[#F5C518] text-[#0A0A0A] text-sm font-bold rounded-full border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
              {pendingTrips.length} pending
            </span>
          </div>
        </div>
        <img
          src="/images/char-green-octagon.png"
          alt=""
          className="absolute -right-4 -bottom-4 w-24 h-24 opacity-20 animate-bounce pointer-events-none"
          style={{ animationDuration: '3s' }}
        />
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border-2 border-green-500 rounded-xl text-green-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 border-2 border-green-500 flex items-center justify-center flex-shrink-0">
            <span className="text-green-600 font-bold text-sm">✓</span>
          </div>
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto w-7 h-7 rounded-lg bg-green-100 border border-green-300 flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl text-red-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 border-2 border-red-500 flex items-center justify-center flex-shrink-0">
            <span className="text-red-600 font-bold text-sm">!</span>
          </div>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto w-7 h-7 rounded-lg bg-red-100 border border-red-300 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors">
            ✕
          </button>
        </div>
      )}

      {pendingTrips.length === 0 ? (
        <div className="text-center py-16 bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A]">
          <div className="w-20 h-20 mx-auto rounded-xl bg-[#F5C518]/20 border-2 border-[#0A0A0A] flex items-center justify-center p-2 mb-4">
            <img src="/images/icon-trophy.png" alt="" className="w-full h-full object-contain" />
          </div>
          <h3 className="mt-3 text-lg font-bold text-[#0A0A0A]">All caught up!</h3>
          <p className="mt-1 text-gray-500">No trips are pending approval right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingTrips.map(trip => (
            <div key={trip.id} className="bg-white border-2 border-[#0A0A0A] rounded-xl p-6 shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-[#0A0A0A]">{trip.experience.title}</h3>
                  <p className="text-gray-600 mt-1">at {(trip.experience as any).venue?.name || 'Unknown venue'}</p>
                </div>
                <span className="px-3 py-1 bg-[#F5C518]/20 text-[#0A0A0A] text-xs font-bold rounded-full border-2 border-[#0A0A0A]">
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
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
                  <label className="block text-sm font-semibold text-red-800 mb-2">
                    Reason for Rejection <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => {
                      setRejectReason(e.target.value);
                      setError(null);
                    }}
                    className="w-full px-3 py-2 border-2 border-[#0A0A0A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518]"
                    rows={3}
                    placeholder="Please explain why this trip is being rejected..."
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleReject(trip.id)}
                      disabled={processingId === trip.id}
                      className="px-5 py-2 bg-red-600 text-white font-semibold rounded-xl border-2 border-red-700 hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {processingId === trip.id ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setRejectReason(''); setError(null); }}
                      disabled={processingId === trip.id}
                      className="px-5 py-2 bg-white text-gray-700 font-semibold rounded-xl border-2 border-[#0A0A0A] hover:bg-gray-50 transition-colors disabled:opacity-50"
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
                    className="px-6 py-2 bg-[#F5C518] text-[#0A0A0A] font-semibold rounded-xl border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                  >
                    {processingId === trip.id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => { setRejectingId(trip.id); setError(null); }}
                    disabled={processingId === trip.id}
                    className="px-6 py-2 bg-white text-red-600 font-semibold rounded-xl border-2 border-red-400 hover:bg-red-50 transition-all disabled:opacity-50"
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
