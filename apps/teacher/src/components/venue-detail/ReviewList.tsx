/**
 * Review List Component
 * 
 * Displays venue reviews with:
 * - Overall rating summary
 * - Individual reviews with ratings
 * - Teacher feedback
 * - Venue responses
 * 
 * Requirements: 4.3, 4.4
 */

import type { VenueReview } from '@tripslip/database';

interface ReviewListProps {
  reviews: VenueReview[];
  venueRating: number;
  reviewCount: number;
}

export function ReviewList({ reviews, venueRating, reviewCount }: ReviewListProps) {
  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-6 h-6',
    };

    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg
          key={`full-${i}`}
          className={`${sizeClasses[size]} text-yellow-400 fill-current`}
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className={`${sizeClasses[size]} text-yellow-400`} viewBox="0 0 20 20">
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
        <svg
          key={`empty-${i}`}
          className={`${sizeClasses[size]} text-gray-300 fill-current`}
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }

    return stars;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const calculateAspectRatings = () => {
    if (reviews.length === 0) return null;

    const aspects = {
      educational_value: 0,
      staff_quality: 0,
      facilities: 0,
      value: 0,
    };

    const counts = {
      educational_value: 0,
      staff_quality: 0,
      facilities: 0,
      value: 0,
    };

    reviews.forEach((review) => {
      if (review.educational_value_rating) {
        aspects.educational_value += review.educational_value_rating;
        counts.educational_value++;
      }
      if (review.staff_quality_rating) {
        aspects.staff_quality += review.staff_quality_rating;
        counts.staff_quality++;
      }
      if (review.facilities_rating) {
        aspects.facilities += review.facilities_rating;
        counts.facilities++;
      }
      if (review.value_rating) {
        aspects.value += review.value_rating;
        counts.value++;
      }
    });

    return {
      educational_value: counts.educational_value > 0 ? aspects.educational_value / counts.educational_value : 0,
      staff_quality: counts.staff_quality > 0 ? aspects.staff_quality / counts.staff_quality : 0,
      facilities: counts.facilities > 0 ? aspects.facilities / counts.facilities : 0,
      value: counts.value > 0 ? aspects.value / counts.value : 0,
    };
  };

  const aspectRatings = calculateAspectRatings();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews & Ratings</h2>

      {/* Overall Rating Summary */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <div className="flex items-start gap-8">
          {/* Overall Score */}
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">{venueRating.toFixed(1)}</div>
            <div className="flex items-center justify-center mb-1">
              {renderStars(venueRating, 'lg')}
            </div>
            <p className="text-sm text-gray-600">{reviewCount} reviews</p>
          </div>

          {/* Aspect Ratings */}
          {aspectRatings && (
            <div className="flex-1 space-y-3">
              {aspectRatings.educational_value > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Educational Value</span>
                    <span className="text-sm text-gray-600">{aspectRatings.educational_value.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${(aspectRatings.educational_value / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {aspectRatings.staff_quality > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Staff Quality</span>
                    <span className="text-sm text-gray-600">{aspectRatings.staff_quality.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${(aspectRatings.staff_quality / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {aspectRatings.facilities > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Facilities</span>
                    <span className="text-sm text-gray-600">{aspectRatings.facilities.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${(aspectRatings.facilities / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {aspectRatings.value > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Value for Money</span>
                    <span className="text-sm text-gray-600">{aspectRatings.value.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${(aspectRatings.value / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Individual Reviews */}
      {reviews.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No reviews yet. Be the first to review this venue!</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center mb-1">
                    {renderStars(review.overall_rating, 'sm')}
                    <span className="ml-2 text-sm font-semibold text-gray-900">
                      {review.overall_rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{formatDate(review.created_at)}</p>
                </div>
              </div>

              {/* Review Text */}
              {review.feedback_text && (
                <p className="text-gray-700 mb-3 whitespace-pre-line">{review.feedback_text}</p>
              )}

              {/* Review Photos */}
              {review.photos && review.photos.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {review.photos.slice(0, 4).map((photoUrl: string, index: number) => (
                    <img
                      key={index}
                      src={photoUrl}
                      alt={`Review photo ${index + 1}`}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ))}
                  {review.photos.length > 4 && (
                    <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-gray-600 text-sm">
                      +{review.photos.length - 4}
                    </div>
                  )}
                </div>
              )}

              {/* Venue Response */}
              {review.venue_response && (
                <div className="mt-4 ml-6 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-semibold text-gray-900">Response from venue</span>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-line">{review.venue_response}</p>
                  {review.venue_response_at && (
                    <p className="text-xs text-gray-500 mt-2">{formatDate(review.venue_response_at)}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
