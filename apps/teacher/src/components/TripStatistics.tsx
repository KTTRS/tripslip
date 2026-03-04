import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@tripslip/ui';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  DollarSign,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface TripStatisticsProps {
  tripId: string;
}

interface Statistics {
  totalStudents: number;
  pendingSlips: number;
  signedSlips: number;
  paidSlips: number;
  totalPaymentsReceived: number;
  totalPaymentsExpected: number;
}

export function TripStatistics({ tripId }: TripStatisticsProps) {
  const [stats, setStats] = useState<Statistics>({
    totalStudents: 0,
    pendingSlips: 0,
    signedSlips: 0,
    paidSlips: 0,
    totalPaymentsReceived: 0,
    totalPaymentsExpected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Supabase client inside component for testability

  useEffect(() => {
    if (!tripId) return;

    fetchStatistics();

    // Set up real-time subscription for updates
    const channel = supabase
      .channel(`trip_stats_${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'permission_slips',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          fetchStatistics();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        () => {
          fetchStatistics();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [tripId]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all permission slips with their payments
      const { data: slipsData, error: slipsError } = await supabase
        .from('permission_slips')
        .select(`
          id,
          status,
          signed_at,
          payments (
            id,
            amount_cents,
            status,
            paid_at
          )
        `)
        .eq('trip_id', tripId);

      if (slipsError) throw slipsError;

      // Calculate statistics
      const totalStudents = slipsData?.length || 0;
      let pendingSlips = 0;
      let signedSlips = 0;
      let paidSlips = 0;
      let totalPaymentsReceived = 0;
      let totalPaymentsExpected = 0;

      slipsData?.forEach((slip: any) => {
        // Check if any payment is successful
        const hasPaidPayment = slip.payments?.some((p: any) => p.status === 'succeeded');
        
        if (hasPaidPayment) {
          paidSlips++;
          // Sum up all successful payments for this slip
          slip.payments?.forEach((p: any) => {
            if (p.status === 'succeeded') {
              totalPaymentsReceived += p.amount_cents;
            }
          });
        } else if (slip.status === 'signed') {
          signedSlips++;
        } else if (slip.status === 'pending') {
          pendingSlips++;
        }

        // Calculate expected payments (sum of all payments regardless of status)
        slip.payments?.forEach((p: any) => {
          totalPaymentsExpected += p.amount_cents;
        });
      });

      setStats({
        totalStudents,
        pendingSlips,
        signedSlips,
        paidSlips,
        totalPaymentsReceived,
        totalPaymentsExpected,
      });
    } catch (err) {
      console.error('Error fetching trip statistics:', err);
      setError('Failed to load trip statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getCompletionPercentage = (): number => {
    if (stats.totalStudents === 0) return 0;
    return Math.round((stats.paidSlips / stats.totalStudents) * 100);
  };

  if (loading) {
    return (
      <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(10,10,10,1)]">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading statistics...</p>
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

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] bg-[#F5C518]">
        <CardHeader className="border-b-2 border-black">
          <CardTitle className="font-serif text-2xl flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Trip Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Completion Progress */}
            <div>
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide font-mono mb-2">
                Completion Rate
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold font-mono">{completionPercentage}%</span>
                <span className="text-lg text-gray-700 font-mono">
                  ({stats.paidSlips}/{stats.totalStudents})
                </span>
              </div>
              <div className="mt-4 bg-white border-2 border-black rounded-full h-4 overflow-hidden">
                <div
                  className="bg-green-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Payment Summary */}
            <div>
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide font-mono mb-2">
                Payment Summary
              </p>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-700 font-mono">Received:</span>
                  <span className="text-3xl font-bold font-mono text-green-700">
                    {formatCurrency(stats.totalPaymentsReceived)}
                  </span>
                </div>
                {stats.totalPaymentsExpected > 0 && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-700 font-mono">Expected:</span>
                    <span className="text-xl font-mono text-gray-700">
                      {formatCurrency(stats.totalPaymentsExpected)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Students */}
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide font-mono">
                  Total Students
                </p>
                <p className="text-3xl font-bold font-mono mt-1">{stats.totalStudents}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Slips */}
        <Card className="border-2 border-gray-300 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide font-mono">
                  Pending
                </p>
                <p className="text-3xl font-bold font-mono mt-1">{stats.pendingSlips}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signed Slips */}
        <Card className="border-2 border-blue-300 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide font-mono">
                  Signed
                </p>
                <p className="text-3xl font-bold font-mono mt-1">{stats.signedSlips}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paid Slips */}
        <Card className="border-2 border-green-300 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide font-mono">
                  Paid
                </p>
                <p className="text-3xl font-bold font-mono mt-1">{stats.paidSlips}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
