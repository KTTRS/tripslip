import { Link } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@tripslip/ui';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  tripId: string;
  tripName: string;
}

interface TripAlertsProps {
  alerts: Alert[];
}

export default function TripAlerts({ alerts }: TripAlertsProps) {
  if (alerts.length === 0) {
    return null;
  }

  const pendingCount = alerts.filter(a => a.id.endsWith('-pending-approval')).length;

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-500 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-500 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-500 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-500 text-gray-800';
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📌';
    }
  };

  return (
    <Card className="border-2 border-black shadow-offset mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Alerts & Attention Required</CardTitle>
          {pendingCount > 0 && (
            <Link
              to="/approvals"
              className="px-4 py-2 bg-tripslip-yellow text-black text-sm font-semibold rounded-lg border-2 border-black shadow-offset hover:bg-yellow-400 transition-colors"
            >
              Review {pendingCount} Pending {pendingCount === 1 ? 'Approval' : 'Approvals'}
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 border-2 rounded-md ${getAlertStyles(alert.type)}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{getAlertIcon(alert.type)}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{alert.tripName}</p>
                  <p className="text-sm mt-1">{alert.message}</p>
                </div>
                {alert.id.endsWith('-pending-approval') && (
                  <Link
                    to="/approvals"
                    className="text-sm font-semibold text-blue-700 hover:underline whitespace-nowrap"
                  >
                    Review
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
