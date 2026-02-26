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
        <CardTitle>Alerts & Attention Required</CardTitle>
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
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
