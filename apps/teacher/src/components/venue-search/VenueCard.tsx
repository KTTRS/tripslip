import { useNavigate } from 'react-router';
import type { VenueSearchHit } from '@tripslip/database';

interface VenueCardProps {
  venue: VenueSearchHit;
  onClick?: () => void;
}

export function VenueCard({ venue, onClick }: VenueCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/venues/${venue.id}`);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-fill">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            fill="url(#half-fill)"
            d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
          />
        </svg>
      );
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }

    return stars;
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
    >
      <div className="h-48 bg-gray-200 relative">
        {venue.primaryPhotoUrl ? (
          <img
            src={venue.primaryPhotoUrl}
            alt={venue.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        )}
        
        {venue.verified && (
          <div className="absolute top-2 right-2 bg-[#0A0A0A] text-white px-2 py-1 rounded-lg border-2 border-[#0A0A0A] shadow-[2px_2px_0px_rgba(0,0,0,0.3)] text-xs font-bold flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Verified
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-[#0A0A0A] mb-1">{venue.name}</h3>

        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {renderStars(venue.rating)}
          </div>
          <span className="ml-2 text-sm text-gray-600 font-medium">
            {venue.rating.toFixed(1)} ({venue.reviewCount} reviews)
          </span>
        </div>

        {venue.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {venue.description}
          </p>
        )}

        {venue.location && (
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {venue.distanceMiles !== undefined && (
              <span>{venue.distanceMiles.toFixed(1)} miles away</span>
            )}
          </div>
        )}

        {venue.priceRange && (
          <div className="flex items-center text-sm text-gray-700 mb-3">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-bold">
              {formatPrice(venue.priceRange.min)} - {formatPrice(venue.priceRange.max)}
            </span>
            <span className="ml-1 text-gray-500">per student</span>
          </div>
        )}

        {venue.capacityRange && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>
              Capacity: {venue.capacityRange.min} - {venue.capacityRange.max} students
            </span>
          </div>
        )}

        {venue.subjectAreas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {venue.subjectAreas.slice(0, 3).map(subject => (
              <span
                key={subject}
                className="inline-block bg-[#F5C518]/20 text-[#0A0A0A] text-xs px-2 py-1 rounded-lg border border-[#0A0A0A]/20 font-semibold"
              >
                {subject}
              </span>
            ))}
            {venue.subjectAreas.length > 3 && (
              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg border border-[#0A0A0A]/10 font-semibold">
                +{venue.subjectAreas.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}