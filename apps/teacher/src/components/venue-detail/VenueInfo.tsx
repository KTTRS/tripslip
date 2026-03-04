/**
 * Venue Info Component
 * 
 * Displays comprehensive venue information:
 * - Name and description
 * - Location with map link
 * - Operating hours
 * - Supported age groups
 * - Accessibility features
 * 
 * Requirements: 4.1
 */

import type { VenueProfile } from '@tripslip/database';

interface VenueInfoProps {
  venue: VenueProfile;
}

export function VenueInfo({ venue }: VenueInfoProps) {
  const formatOperatingHours = () => {
    if (!venue.operating_hours || venue.operating_hours.length === 0) {
      return null;
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hours = venue.operating_hours.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    return hours.map((hour) => ({
      day: days[hour.dayOfWeek],
      hours: hour.closed ? 'Closed' : `${hour.openTime} - ${hour.closeTime}`,
    }));
  };

  const formatAgeGroup = (ageGroup: string) => {
    const labels: Record<string, string> = {
      preschool: 'Preschool',
      elementary: 'Elementary',
      middle: 'Middle School',
      high: 'High School',
      adult: 'Adult',
    };
    return labels[ageGroup] || ageGroup;
  };

  const getAccessibilityIcon = (type: string) => {
    switch (type) {
      case 'wheelchair':
        return '♿';
      case 'parking':
        return '🅿️';
      case 'hearing':
        return '🦻';
      case 'visual':
        return '👁️';
      case 'service_animal':
        return '🐕‍🦺';
      default:
        return '✓';
    }
  };

  const formatAccessibilityType = (type: string) => {
    const labels: Record<string, string> = {
      wheelchair: 'Wheelchair Accessible',
      parking: 'Accessible Parking',
      entrance: 'Accessible Entrance',
      restroom: 'Accessible Restrooms',
      hearing: 'Hearing Assistance',
      visual: 'Visual Assistance',
      sensory: 'Sensory-Friendly',
      service_animal: 'Service Animals Welcome',
    };
    return labels[type] || type;
  };

  const operatingHours = formatOperatingHours();
  const accessibilityFeatures = venue.accessibility_features
    ? Object.entries(venue.accessibility_features).filter(([_, feature]) => feature.available)
    : [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{venue.name}</h1>
        {venue.address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${venue.address.street}, ${venue.address.city}, ${venue.address.state} ${venue.address.zipCode}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-gray-600 hover:text-blue-600"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {venue.address.street}, {venue.address.city}, {venue.address.state} {venue.address.zipCode}
          </a>
        )}
      </div>

      {/* Description */}
      {venue.description && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
          <p className="text-gray-700 whitespace-pre-line">{venue.description}</p>
        </div>
      )}

      {/* Virtual Tour */}
      {venue.virtual_tour_url && (
        <div className="mb-6">
          <a
            href={venue.virtual_tour_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Take a Virtual Tour
          </a>
        </div>
      )}

      {/* Operating Hours */}
      {operatingHours && operatingHours.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Operating Hours</h2>
          <div className="space-y-2">
            {operatingHours.map((item) => (
              <div key={item.day} className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{item.day}</span>
                <span className="text-gray-600">{item.hours}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Age Groups */}
      {venue.supported_age_groups && venue.supported_age_groups.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Suitable For</h2>
          <div className="flex flex-wrap gap-2">
            {venue.supported_age_groups.map((ageGroup) => (
              <span
                key={ageGroup}
                className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
              >
                {formatAgeGroup(ageGroup)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Accessibility Features */}
      {accessibilityFeatures.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Accessibility Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accessibilityFeatures.map(([type, feature]) => (
              <div key={type} className="flex items-start">
                <span className="text-2xl mr-2">{getAccessibilityIcon(type)}</span>
                <div>
                  <p className="font-medium text-gray-900">{formatAccessibilityType(type)}</p>
                  {feature.description && (
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seasonal Availability */}
      {venue.seasonal_availability && venue.seasonal_availability.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Seasonal Information</h2>
          <div className="space-y-2">
            {venue.seasonal_availability.map((season, index) => (
              <div key={index} className="text-sm">
                <span className="font-medium text-gray-700">
                  {season.startDate} to {season.endDate}:
                </span>
                <span className={`ml-2 ${season.available ? 'text-green-600' : 'text-red-600'}`}>
                  {season.available ? 'Available' : 'Closed'}
                </span>
                {season.notes && <p className="text-gray-600 ml-4">{season.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
