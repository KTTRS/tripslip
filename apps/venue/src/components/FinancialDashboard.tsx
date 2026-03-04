import React, { useEffect, useState } from 'react';
import { supabase } from '@tripslip/database';

interface FinancialMetrics {
  totalRevenue: number;
  pendingRevenue: number;
  confirmedRevenue: number;
  totalBookings: number;
  upcomingPayouts: Array<{
    date: string;
    amount: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
}

interface FinancialDashboardProps {
  venueId: string;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  venueId,
}) => {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    pendingRevenue: 0,
    confirmedRevenue: 0,
    totalBookings: 0,
    upcomingPayouts: [],
    revenueByMonth: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialMetrics();
  }, [venueId]);

  const loadFinancialMetrics = async () => {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('venue_id', venueId);

      if (error) throw error;

      const totalRevenue = bookings.reduce(
        (sum, b) => sum + b.total_amount,
        0
      );
      const pendingRevenue = bookings
        .filter((b) => b.status === 'pending')
        .reduce((sum, b) => sum + b.total_amount, 0);
      const confirmedRevenue = bookings
        .filter((b) => b.status === 'confirmed')
        .reduce((sum, b) => sum + b.total_amount, 0);

      // Group revenue by month
      const revenueByMonth = bookings.reduce((acc, booking) => {
        const month = new Date(booking.booking_date).toLocaleDateString(
          'en-US',
          { year: 'numeric', month: 'short' }
        );
        const existing = acc.find((r) => r.month === month);
        if (existing) {
          existing.revenue += booking.total_amount;
        } else {
          acc.push({ month, revenue: booking.total_amount });
        }
        return acc;
      }, [] as Array<{ month: string; revenue: number }>);

      // Calculate upcoming payouts (simplified - assumes weekly payouts)
      const upcomingPayouts = [];
      const today = new Date();
      for (let i = 0; i < 4; i++) {
        const payoutDate = new Date(today);
        payoutDate.setDate(today.getDate() + i * 7);
        const weekRevenue = confirmedRevenue / 4; // Simplified calculation
        upcomingPayouts.push({
          date: payoutDate.toLocaleDateString(),
          amount: weekRevenue,
        });
      }

      setMetrics({
        totalRevenue,
        pendingRevenue,
        confirmedRevenue,
        totalBookings: bookings.length,
        upcomingPayouts,
        revenueByMonth: revenueByMonth.slice(-6), // Last 6 months
      });
    } catch (error) {
      console.error('Error loading financial metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading financial data...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-fraunces font-semibold">
        Financial Dashboard
      </h2>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-offset">
          <h3 className="text-sm font-jakarta text-gray-600 mb-2">
            Total Revenue
          </h3>
          <p className="text-3xl font-mono font-bold text-tripslip-blue">
            ${(metrics.totalRevenue / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-offset">
          <h3 className="text-sm font-jakarta text-gray-600 mb-2">
            Confirmed Revenue
          </h3>
          <p className="text-3xl font-mono font-bold text-green-600">
            ${(metrics.confirmedRevenue / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-offset">
          <h3 className="text-sm font-jakarta text-gray-600 mb-2">
            Pending Revenue
          </h3>
          <p className="text-3xl font-mono font-bold text-yellow-600">
            ${(metrics.pendingRevenue / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Bookings Count */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-offset">
        <h3 className="text-sm font-jakarta text-gray-600 mb-2">
          Total Bookings
        </h3>
        <p className="text-3xl font-mono font-bold">{metrics.totalBookings}</p>
      </div>

      {/* Upcoming Payouts */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-offset">
        <h3 className="text-lg font-jakarta font-semibold mb-4">
          Upcoming Payouts
        </h3>
        <div className="space-y-3">
          {metrics.upcomingPayouts.map((payout, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <span className="text-gray-600">{payout.date}</span>
              <span className="font-mono font-semibold">
                ${(payout.amount / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by Month */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-offset">
        <h3 className="text-lg font-jakarta font-semibold mb-4">
          Revenue by Month
        </h3>
        <div className="space-y-3">
          {metrics.revenueByMonth.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <span className="text-gray-600">{item.month}</span>
              <span className="font-mono font-semibold">
                ${(item.revenue / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
