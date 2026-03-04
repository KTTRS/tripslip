import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface BudgetTrackingProps {
  schoolId: string;
}

interface BudgetData {
  totalBudget: number;
  spentAmount: number;
  remainingAmount: number;
  tripCount: number;
}

export default function BudgetTracking({ schoolId }: BudgetTrackingProps) {
  const [budgetData, setBudgetData] = useState<BudgetData>({
    totalBudget: 50000000, // $500,000 default budget in cents
    spentAmount: 0,
    remainingAmount: 50000000,
    tripCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      fetchBudgetData();
    }
  }, [schoolId]);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);

      // Get all payments for trips from teachers in this school
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          amount_cents,
          status,
          permission_slip:permission_slips!inner(
            trip:trips!inner(
              teacher:teachers!inner(school_id)
            )
          )
        `)
        .eq('permission_slip.trip.teacher.school_id', schoolId)
        .eq('status', 'succeeded');

      if (paymentsError) throw paymentsError;

      // Calculate total spent amount
      const totalSpent = (payments || []).reduce((sum, payment) => {
        return sum + payment.amount_cents;
      }, 0);

      // Get trip count for this school
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('id, teacher:teachers!inner(school_id)')
        .eq('teacher.school_id', schoolId);

      if (tripsError) throw tripsError;

      const tripCount = trips?.length || 0;
      const totalBudget = 50000000; // $500,000 default
      const remainingAmount = totalBudget - totalSpent;

      setBudgetData({
        totalBudget,
        spentAmount: totalSpent,
        remainingAmount,
        tripCount,
      });
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const spentPercentage = budgetData.totalBudget > 0 ? (budgetData.spentAmount / budgetData.totalBudget) * 100 : 0;
  const remainingPercentage = budgetData.totalBudget > 0 ? (budgetData.remainingAmount / budgetData.totalBudget) * 100 : 0;

  if (loading) {
    return (
      <Card className="border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle>Budget Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-black shadow-offset">
      <CardHeader>
        <CardTitle>Budget Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Budget */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-600">Total Budget</span>
              <span className="text-lg font-bold">{formatCurrency(budgetData.totalBudget)}</span>
            </div>
          </div>

          {/* Spent Amount */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-600">Spent</span>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(budgetData.spentAmount)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-red-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {spentPercentage.toFixed(1)}% of budget
            </p>
          </div>

          {/* Remaining Amount */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-600">Remaining</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(budgetData.remainingAmount)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(remainingPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {remainingPercentage.toFixed(1)}% available
            </p>
          </div>

          {/* Trip Count */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-600">Active Trips</span>
              <span className="text-lg font-bold">{budgetData.tripCount}</span>
            </div>
          </div>

          {/* Budget Status Alert */}
          {spentPercentage > 90 && (
            <div className="p-3 bg-red-50 border-2 border-red-500 rounded-md">
              <p className="text-sm font-semibold text-red-800">
                ⚠️ Budget Alert: {spentPercentage.toFixed(0)}% of budget used
              </p>
            </div>
          )}
          {spentPercentage > 75 && spentPercentage <= 90 && (
            <div className="p-3 bg-yellow-50 border-2 border-yellow-500 rounded-md">
              <p className="text-sm font-semibold text-yellow-800">
                ⚠️ Budget Warning: {spentPercentage.toFixed(0)}% of budget used
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
