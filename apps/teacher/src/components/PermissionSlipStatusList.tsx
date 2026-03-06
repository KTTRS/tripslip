import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@tripslip/ui';
import { supabase } from '../lib/supabase';
import type { Tables } from '@tripslip/database';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  Clock, 
  DollarSign,
  XCircle,
  AlertCircle,
  Send
} from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';

type PermissionSlip = Tables<'permission_slips'>;

interface PermissionSlipWithDetails extends PermissionSlip {
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    grade: string;
  };
  payments?: Array<{
    id: string;
    amount_cents: number;
    status: string;
    paid_at: string | null;
    created_at: string;
  }>;
}

interface PermissionSlipStatusListProps {
  tripId: string;
}

type SlipStatus = 'pending' | 'signed' | 'paid' | 'cancelled';

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof Clock;
}

const STATUS_CONFIG: Record<SlipStatus, StatusConfig> = {
  pending: {
    label: 'Pending',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    icon: Clock,
  },
  signed: {
    label: 'Signed',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    icon: CheckCircle,
  },
  paid: {
    label: 'Paid',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    icon: DollarSign,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    icon: XCircle,
  },
};

export function PermissionSlipStatusList({ tripId }: PermissionSlipStatusListProps) {
  const [slips, setSlips] = useState<PermissionSlipWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Supabase client inside component for testability

  useEffect(() => {
    if (!tripId) return;

    fetchPermissionSlips();

    // Set up real-time subscriptions
    const slipsChannel = setupSlipsSubscription();
    const paymentsChannel = setupPaymentsSubscription();

    return () => {
      slipsChannel?.unsubscribe();
      paymentsChannel?.unsubscribe();
    };
  }, [tripId]);

  const fetchPermissionSlips = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: slipsData, error: slipsError } = await supabase
        .from('permission_slips')
        .select(`
          *,
          student:students (
            id,
            first_name,
            last_name,
            grade
          ),
          payments (
            id,
            amount_cents,
            status,
            paid_at,
            created_at
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (slipsError) throw slipsError;

      // Transform data to handle single student object
      const transformedSlips = (slipsData || []).map((slip: any) => ({
        ...slip,
        student: Array.isArray(slip.student) ? slip.student[0] : slip.student,
      }));

      setSlips(transformedSlips);
    } catch (err) {
      console.error('Error fetching permission slips:', err);
      setError('Failed to load permission slips');
    } finally {
      setLoading(false);
    }
  };

  const setupSlipsSubscription = (): RealtimeChannel => {
    const channel = supabase
      .channel(`permission_slips_${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'permission_slips',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          handleSlipChange(payload);
        }
      )
      .subscribe();

    return channel;
  };

  const setupPaymentsSubscription = (): RealtimeChannel => {
    const channel = supabase
      .channel(`payments_${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        (payload) => {
          handlePaymentChange(payload);
        }
      )
      .subscribe();

    return channel;
  };

  const handleSlipChange = async (payload: any) => {
    if (payload.eventType === 'INSERT') {
      // Fetch the new slip with student details
      const { data: newSlip } = await supabase
        .from('permission_slips')
        .select(`
          *,
          student:students (
            id,
            first_name,
            last_name,
            grade
          ),
          payments (
            id,
            amount_cents,
            status,
            paid_at,
            created_at
          )
        `)
        .eq('id', payload.new.id)
        .single();

      if (newSlip) {
        const transformedSlip = {
          ...newSlip,
          student: Array.isArray(newSlip.student) ? newSlip.student[0] : newSlip.student,
        };
        setSlips((prev) => [...prev, transformedSlip]);
      }
    } else if (payload.eventType === 'UPDATE') {
      setSlips((prev) =>
        prev.map((slip) =>
          slip.id === payload.new.id
            ? { ...slip, ...payload.new }
            : slip
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setSlips((prev) => prev.filter((slip) => slip.id !== payload.old.id));
    }
  };

  const handlePaymentChange = async (payload: any) => {
    const permissionSlipId = payload.new?.permission_slip_id || payload.old?.permission_slip_id;
    
    if (!permissionSlipId) return;

    // Check if this payment belongs to a slip in our list
    const slipExists = slips.some((slip) => slip.id === permissionSlipId);
    if (!slipExists) return;

    // Refetch the specific slip to get updated payment data
    const { data: updatedSlip } = await supabase
      .from('permission_slips')
      .select(`
        *,
        student:students (
          id,
          first_name,
          last_name,
          grade
        ),
        payments (
          id,
          amount_cents,
          status,
          paid_at,
          created_at
        )
      `)
      .eq('id', permissionSlipId)
      .single();

    if (updatedSlip) {
      const transformedSlip = {
        ...updatedSlip,
        student: Array.isArray(updatedSlip.student) ? updatedSlip.student[0] : updatedSlip.student,
      };
      
      setSlips((prev) =>
        prev.map((slip) =>
          slip.id === permissionSlipId ? transformedSlip : slip
        )
      );
    }
  };

  const getDisplayStatus = (slip: PermissionSlipWithDetails): SlipStatus => {
    // Check if any payment is successful
    const hasPaidPayment = slip.payments?.some((p) => p.status === 'succeeded');
    
    if (hasPaidPayment) {
      return 'paid';
    }
    
    // Otherwise use the slip status
    return slip.status as SlipStatus;
  };

  const [sendingSlipId, setSendingSlipId] = useState<string | null>(null);

  const handleRemindSlip = async (slipId: string) => {
    setSendingSlipId(slipId);
    try {
      const response = await fetch('/api/send-permission-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionSlipId: slipId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reminder');
      }
      toast.success('Reminder sent successfully');
    } catch (err: any) {
      console.error('Error sending reminder:', err);
      toast.error(err.message || 'Failed to send reminder');
    } finally {
      setSendingSlipId(null);
    }
  };

  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      signed: 0,
      paid: 0,
      cancelled: 0,
    };

    slips.forEach((slip) => {
      const status = getDisplayStatus(slip);
      counts[status]++;
    });

    return counts;
  };

  if (loading) {
    return (
      <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(10,10,10,1)]">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading permission slips...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-red-500 shadow-[8px_8px_0px_0px_rgba(239,68,68,1)]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (slips.length === 0) {
    return (
      <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(10,10,10,1)]">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No permission slips yet</p>
            <p className="text-sm text-gray-500">
              Add students to the roster to generate permission slips
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.keys(STATUS_CONFIG) as SlipStatus[]).map((status) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          const count = statusCounts[status];

          return (
            <Card
              key={status}
              className={`border-2 ${config.borderColor} shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide font-mono">
                      {config.label}
                    </p>
                    <p className="text-3xl font-bold font-mono mt-1">{count}</p>
                  </div>
                  <div className={`${config.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${config.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Permission Slip List */}
      <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(10,10,10,1)]">
        <CardHeader className="border-b-2 border-black bg-gray-50">
          <CardTitle className="font-serif text-2xl">Permission Slip Status</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-black">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">
                    Signed Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {slips.map((slip) => {
                  const displayStatus = getDisplayStatus(slip);
                  const statusConfig = STATUS_CONFIG[displayStatus];
                  const StatusIcon = statusConfig.icon;
                  const hasPaidPayment = slip.payments?.some((p) => p.status === 'succeeded');
                  const paidPayment = slip.payments?.find((p) => p.status === 'succeeded');

                  return (
                    <tr key={slip.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {slip.student?.first_name} {slip.student?.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 font-mono">
                          {slip.student?.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border-2 ${statusConfig.borderColor} ${statusConfig.bgColor}`}
                        >
                          <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                          <span className={`text-sm font-semibold ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {slip.signed_at ? (
                          <span className="text-sm text-gray-600 font-mono">
                            {new Date(slip.signed_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasPaidPayment ? (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700 font-semibold">
                              Paid
                            </span>
                            {paidPayment?.paid_at && (
                              <span className="text-xs text-gray-500 font-mono">
                                {new Date(paidPayment.paid_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : slip.status === 'signed' ? (
                          <span className="text-sm text-gray-600">Awaiting payment</span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(displayStatus === 'pending' || slip.status === 'sent') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemindSlip(slip.id)}
                            disabled={sendingSlipId === slip.id}
                            className="border-2 border-black text-xs shadow-[2px_2px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-200"
                          >
                            {sendingSlipId === slip.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black" />
                            ) : (
                              <>
                                <Send className="h-3 w-3 mr-1" />
                                Remind
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Real-time indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <div className="relative">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 h-2 w-2 bg-green-500 rounded-full animate-ping"></div>
        </div>
        <span className="font-mono">Live updates enabled</span>
      </div>
    </div>
  );
}
