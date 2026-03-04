import React, { useEffect, useState } from 'react';
import { supabase } from '@tripslip/database';

interface BudgetMetrics {
  totalBudget: number;
  spentBudget: number;
  remainingBudget: number;
  tripCount: number;
  byTeacher: Array<{
    teacherId: string;
    teacherName: string;
    tripCount: number;
    totalSpent: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
    totalCost: number;
  }>;
}

interface BudgetDashboardProps {
  schoolId: string;
}

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  schoolId,
}) => {
  const [metrics, setMetrics] = useState<BudgetMetrics>({
    totalBudget: 0,
    spentBudget: 0,
    remainingBudget: 0,
    tripCount: 0,
    byTeacher: [],
    byStatus: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgetMetrics();
  }, [schoolId]);

  const loadBudgetMetrics = async () => {
    try {
      const { data: trips, error } = await supabase
        .from('trips')
        .select(`
          *,
          teacher:teachers!inner(id, name)
        `)
        .eq('school_id', schoolId);

      if (error) throw error;

      const totalBudget = trips.reduce((sum, t) => sum + t.total_cost, 0);
      const spentBudget = trips
        .filter((t) => ['approved', 'active', 'completed'].includes(t.status))
        .reduce((sum, t) => sum + t.total_cost, 0);

      // Group by teacher
      const byTeacher = trips.reduce((acc, trip) => {
        const existing = acc.find((t) => t.teacherId === trip.teacher.id);
        if (existing) {
          existing.tripCount++;
          existing.totalSpent += trip.total_cost;
        } else {
          acc.push({
            teacherId: trip.teacher.id,
            teacherName: trip.teacher.name,
            tripCount: 1,
            totalSpent: trip.total_cost,
          });
        }
        return acc;
      }, [] as BudgetMetrics['byTeacher']);

      // Group by status
      const byStatus = trips.reduce((acc, trip) => {
        const existing = acc.find((s) => s.status === trip.status);
        if (existing) {
          existing.count++;
          existing.totalCost += trip.total_cost;
        } else {
          acc.push({
            status: trip.status,
            count: 1,
            totalCost: trip.total_cost,
          });
        }
        return acc;
      }, [] as BudgetMetrics['byStatus']);

      setMetrics({
        totalBudget,
        spentBudget,
        remainingBudget: totalBudget - spentBudget,
        tripCount: trips.length,
        byTeacher: byTeacher.sort((a, b) => b.totalSpent - a.totalSpent),
        byStatus: byStatus.sort((a, b) => b.totalCost - a.totalCost),
      });
    } catch (error) {
      console.error('Error loading budget metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading budget data...</div>;
  }

  const budgetUtilization =
    metrics.totalBudget > 0
      ? (metrics.spentBudget / metrics.totalBudget) * 100
      : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-fraunces font-semibold">
        Budget Dashboard
      </h2>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-offset">
          <h3 className="text-sm font-jakarta text-gray-600 mb-2">
            Total Budget
          </h3>
          <p className="text-3xl font-mono font-bold text-tripslip-blue">
            ${(metrics.totalBudget / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-offset">
          <h3 className="text-sm font-jakarta text-gray-600 mb-2">
            Spent Budget
          </h3>
          <p className="text-3xl font-mono font-bold text-red-600">
            ${(metrics.spentBudget / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-offset">
          <h3 className="text-sm font-jakarta text-gray-600 mb-2">
            Remaining Budget
          </h3>
          <p className="text-3xl font-mono font-bold text-green-600">
            ${(metrics.remainingBudget / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Budget Utilization */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-offset">
        <h3 className="text-lg font-jakarta font-semibold mb-4">
          Budget Utilization
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {metrics.tripCount} trip{metrics.tripCount !== 1 ? 's' : ''}
            </span>
            <span className="font-mono font-semibold">
              {budgetUtilization.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                budgetUtilization > 90
                  ? 'bg-red-500'
                  : budgetUtilization > 70
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Budget by Teacher */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-offset">
        <h3 className="text-lg font-jakarta font-semibold mb-4">
          Budget by Teacher
        </h3>
        {metrics.byTeacher.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No data available</p>
        ) : (
          <div className="space-y-3">
            {metrics.byTeacher.map((teacher) => (
              <div
                key={teacher.teacherId}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-jakarta font-medium">
                    {teacher.teacherName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {teacher.tripCount} trip{teacher.tripCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="font-mono font-semibold text-lg">
                  ${(teacher.totalSpent / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget by Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-offset">
        <h3 className="text-lg font-jakarta font-semibold mb-4">
          Budget by Status
        </h3>
        {metrics.byStatus.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No data available</p>
        ) : (
          <div className="space-y-3">
            {metrics.byStatus.map((status) => (
              <div
                key={status.status}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-jakarta font-medium capitalize">
                    {status.status.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {status.count} trip{status.count !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="font-mono font-semibold text-lg">
                  ${(status.totalCost / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
