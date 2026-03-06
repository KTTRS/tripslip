import { useState } from 'react';
import { useAuditLog } from '@tripslip/auth';
import { useSchoolAuth } from '../contexts/SchoolAuthContext';
import { supabase } from '../lib/supabase';

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

interface TripApprovalModalProps {
  trip: PendingTrip;
  onClose: () => void;
  onApprovalComplete: () => void;
}

export default function TripApprovalModal({
  trip,
  onClose,
  onApprovalComplete,
}: TripApprovalModalProps) {
  const { user } = useSchoolAuth();
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logUpdate } = useAuditLog();

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

  const formatAddress = (address: any) => {
    if (!address) return 'Address not available';
    if (typeof address === 'string') return address;
    return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zip || ''}`.trim();
  };

  const handleSubmit = async () => {
    if (!decision) return;

    // Validate required fields
    if (decision === 'reject' && !reason.trim()) {
      setError('Reason is required when rejecting a trip');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const administratorId = user?.id;
      const administratorName = user?.email || 'Unknown Administrator';

      if (!administratorId) {
        throw new Error('Administrator information not available');
      }

      const newStatus = decision === 'approve' ? 'approved' : 'rejected';
      const { error: tripError } = await supabase
        .from('trips')
        .update({ status: newStatus })
        .eq('id', trip.id);

      if (tripError) throw tripError;

      // Log the trip status update for audit trail
      await logUpdate(
        'trips',
        trip.id,
        { status: trip.status },
        { status: newStatus }
      );

      // Create approval record
      const { error: approvalError } = await supabase
        .from('trip_approvals')
        .insert({
          trip_id: trip.id,
          administrator_id: administratorId,
          administrator_name: administratorName,
          decision: decision === 'approve' ? 'approved' : 'rejected',
          comments: decision === 'approve' ? comments : null,
          reason: decision === 'reject' ? reason : null,
        });

      if (approvalError) throw approvalError;

      // Send notification to teacher
      const templateName = decision === 'approve' ? 'trip_approved' : 'trip_rejected';
      const emailData: any = {
        teacherName: trip.teacher.first_name,
        tripTitle: trip.experience.title,
        tripDate: formatDate(trip.trip_date),
        administratorName: administratorName,
      };

      if (decision === 'approve' && comments) {
        emailData.comments = `Comments: ${comments}`;
      } else if (decision === 'reject') {
        emailData.reason = reason;
      }

      await supabase.functions.invoke('send-notification', {
        body: {
          userId: trip.teacher.id,
          userType: 'teacher',
          channel: 'email',
          templateName: templateName,
          language: 'en',
          data: emailData,
          isCritical: true,
        },
      });

      onApprovalComplete();
    } catch (err: any) {
      console.error('Error processing approval:', err);
      setError(err.message || 'Failed to process approval');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border-2 border-black shadow-offset-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-black p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{trip.experience.title}</h2>
              <p className="text-gray-600 mt-1">{trip.experience.venue.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Trip Details */}
          <div>
            <h3 className="text-lg font-bold mb-3">Trip Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">{formatDate(trip.trip_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-semibold">{formatTime(trip.trip_time)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{trip.experience.duration_minutes} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Number of Students</p>
                <p className="font-semibold">{trip.student_count}</p>
              </div>
            </div>
          </div>

          {/* Venue Information */}
          <div>
            <h3 className="text-lg font-bold mb-3">Venue Information</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Venue Name</p>
                <p className="font-semibold">{trip.experience.venue.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-semibold">{formatAddress(trip.experience.venue.address)}</p>
              </div>
            </div>
          </div>

          {/* Experience Description */}
          {trip.experience.description && (
            <div>
              <h3 className="text-lg font-bold mb-3">Experience Description</h3>
              <p className="text-gray-700">{trip.experience.description}</p>
            </div>
          )}

          {/* Teacher Information */}
          <div>
            <h3 className="text-lg font-bold mb-3">Teacher Information</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold">
                  {trip.teacher.first_name} {trip.teacher.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{trip.teacher.email}</p>
              </div>
            </div>
          </div>

          {/* Cost Information */}
          <div>
            <h3 className="text-lg font-bold mb-3">Cost Information</h3>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Trip Cost</span>
                <span className="text-2xl font-bold">{formatCurrency(trip.total_cost)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {formatCurrency(trip.total_cost / trip.student_count)} per student
              </p>
            </div>
          </div>

          {/* Decision Section */}
          <div className="border-t-2 border-black pt-6">
            <h3 className="text-lg font-bold mb-4">Approval Decision</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                {error}
              </div>
            )}

            {/* Decision Buttons */}
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setDecision('approve')}
                className={`flex-1 px-4 py-3 font-semibold rounded border-2 transition-colors ${
                  decision === 'approve'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-green-600 border-green-600 hover:bg-green-50'
                }`}
              >
                Approve Trip
              </button>
              <button
                onClick={() => setDecision('reject')}
                className={`flex-1 px-4 py-3 font-semibold rounded border-2 transition-colors ${
                  decision === 'reject'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-red-600 border-red-600 hover:bg-red-50'
                }`}
              >
                Reject Trip
              </button>
            </div>

            {/* Comments/Reason Input */}
            {decision === 'approve' && (
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-black"
                  rows={3}
                  placeholder="Add any comments or notes for the teacher..."
                />
              </div>
            )}

            {decision === 'reject' && (
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Reason for Rejection <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-black"
                  rows={3}
                  placeholder="Please provide a reason for rejecting this trip..."
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t-2 border-black p-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 font-semibold border-2 border-black rounded hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!decision || loading}
            className="px-6 py-2 bg-black text-white font-semibold rounded hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Submit Decision'}
          </button>
        </div>
      </div>
    </div>
  );
}
