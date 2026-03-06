import { useTranslation } from 'react-i18next';
import { formatDate } from '@tripslip/utils';

interface TripDetailsProps {
  trip: {
    title?: string;
    trip_date: string;
    trip_time?: string;
    departure_time?: string;
    return_time?: string;
    estimated_cost_cents?: number;
    is_free?: boolean;
    funding_model?: string;
    experience?: {
      title: string;
      description: string;
      venue?: {
        name: string;
        address: string;
      } | null;
      pricing_tiers?: Array<{ price_cents: number }>;
    } | null;
    experiences?: {
      title: string;
      description: string;
    } | null;
    venues?: {
      name: string;
      address: string;
    } | null;
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

  const costCents = trip.estimated_cost_cents || trip.experience?.pricing_tiers?.[0]?.price_cents || 0;
  const isFree = trip.is_free || costCents === 0 ||
    trip.funding_model === 'school_funded' || trip.funding_model === 'sponsored';

  const experienceTitle = trip.experience?.title || trip.experiences?.title;
  const experienceDescription = trip.experience?.description || trip.experiences?.description;
  const venue = trip.experience?.venue || trip.venues;

  return (
    <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 space-y-4">
      <h2 className="text-2xl font-bold text-[#0A0A0A]">
        {t('permissionSlip.tripDetails')}
      </h2>

      <div className="space-y-3">
        {experienceTitle && (
          <div>
            <h3 className="text-lg font-semibold text-[#0A0A0A]">
              {experienceTitle}
            </h3>
            {experienceDescription && (
              <p className="text-gray-600 mt-1">{experienceDescription}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          {venue && (
            <div>
              <p className="text-sm font-medium text-gray-500">
                {t('permissionSlip.venue')}
              </p>
              <p className="text-[#0A0A0A] font-medium">{venue.name}</p>
              <p className="text-sm text-gray-600">
                {venue.address}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('permissionSlip.date')}
            </p>
            <p className="text-[#0A0A0A] font-medium">
              {formatDate(trip.trip_date, i18n.language)}
            </p>
          </div>

          {(trip.departure_time || trip.trip_time) && (
            <div>
              <p className="text-sm font-medium text-gray-500">
                {t('permissionSlip.departureTime')}
              </p>
              <p className="text-[#0A0A0A]">{trip.departure_time || trip.trip_time}</p>
            </div>
          )}

          {trip.return_time && (
            <div>
              <p className="text-sm font-medium text-gray-500">
                {t('permissionSlip.returnTime')}
              </p>
              <p className="text-[#0A0A0A]">{trip.return_time}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('permissionSlip.cost')}
            </p>
            <p className="text-lg font-bold text-[#0A0A0A]">
              {isFree ? 'Free' : formatCurrency(costCents)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
