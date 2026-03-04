import { useTranslation } from 'react-i18next';
import { formatDate } from '@tripslip/utils';

interface TripDetailsProps {
  trip: {
    title: string;
    trip_date: string;
    departure_time: string;
    return_time: string;
    estimated_cost_cents: number;
    experiences: {
      title: string;
      description: string;
    };
    venues: {
      name: string;
      address: string;
      city: string;
      state: string;
    };
  };
}

export function TripDetails({ trip }: TripDetailsProps) {
  const { t, i18n } = useTranslation();

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">
        {t('permissionSlip.tripDetails')}
      </h2>

      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {trip.experiences.title}
          </h3>
          <p className="text-gray-600">{trip.experiences.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('permissionSlip.venue')}
            </p>
            <p className="text-gray-900">{trip.venues.name}</p>
            <p className="text-sm text-gray-600">
              {trip.venues.address}
              <br />
              {trip.venues.city}, {trip.venues.state}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('permissionSlip.date')}
            </p>
            <p className="text-gray-900">
              {formatDate(trip.trip_date, i18n.language)}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('permissionSlip.departureTime')}
            </p>
            <p className="text-gray-900">{trip.departure_time}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('permissionSlip.returnTime')}
            </p>
            <p className="text-gray-900">{trip.return_time}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('permissionSlip.cost')}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(trip.estimated_cost_cents)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
