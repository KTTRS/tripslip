import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui';

interface BudgetTrackingProps {
  totalBudget: number;
  spentAmount: number;
  remainingAmount: number;
}

export default function BudgetTracking({
  totalBudget,
  spentAmount,
  remainingAmount,
}: BudgetTrackingProps) {
  const spentPercentage = totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0;
  const remainingPercentage = totalBudget > 0 ? (remainingAmount / totalBudget) * 100 : 0;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

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
              <span className="text-lg font-bold">{formatCurrency(totalBudget)}</span>
            </div>
          </div>

          {/* Spent Amount */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-600">Spent</span>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(spentAmount)}
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
                {formatCurrency(remainingAmount)}
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
