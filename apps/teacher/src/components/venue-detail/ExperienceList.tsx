/**
 * Experience List Component
 * 
 * Displays available experiences with:
 * - Experience title and description
 * - Duration and capacity
 * - Pricing information
 * - Educational objectives
 * - "Book Experience" button
 * 
 * Requirements: 4.2, 4.5
 */

import type { Experience } from '@tripslip/database';

interface ExperienceListProps {
  experiences: Experience[];
  onBookExperience: (experienceId: string) => void;
}

export function ExperienceList({ experiences, onBookExperience }: ExperienceListProps) {
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  const getPriceRange = (experience: Experience) => {
    if (!experience.pricingTiers || experience.pricingTiers.length === 0) {
      return 'Contact for pricing';
    }

    const prices = experience.pricingTiers.map((tier) => tier.priceCents);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `${formatPrice(minPrice)} per student`;
    }

    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)} per student`;
  };

  if (experiences.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Experiences</h2>
        <p className="text-gray-600">No experiences currently available at this venue.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Experiences</h2>
      
      <div className="space-y-6">
        {experiences.map((experience) => (
          <div
            key={experience.id}
            className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{experience.title}</h3>
                {experience.description && (
                  <p className="text-gray-700 mb-3">{experience.description}</p>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Duration */}
              <div className="flex items-center text-sm">
                <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-gray-700">{formatDuration(experience.durationMinutes)}</span>
              </div>

              {/* Capacity */}
              {experience.minStudents && experience.maxStudents && (
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="text-gray-700">
                    {experience.minStudents} - {experience.maxStudents} students
                  </span>
                </div>
              )}

              {/* Grade Levels */}
              {experience.gradeLevels.length > 0 && (
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <span className="text-gray-700">{experience.gradeLevels.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Educational Objectives */}
            {experience.educationalObjectives.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Educational Objectives</h4>
                <ul className="list-disc list-inside space-y-1">
                  {experience.educationalObjectives.map((objective, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Subject Areas */}
            {experience.subjects.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {experience.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing and CTA */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Starting at</p>
                <p className="text-2xl font-bold text-gray-900">{getPriceRange(experience)}</p>
              </div>
              <button
                onClick={() => onBookExperience(experience.id)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Book Experience
              </button>
            </div>

            {/* Cancellation Policy */}
            {experience.cancellationPolicy && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Cancellation Policy:</span> Full refund if cancelled{' '}
                  {experience.cancellationPolicy.fullRefundDays} days in advance,{' '}
                  {experience.cancellationPolicy.partialRefundPercent}% refund if cancelled{' '}
                  {experience.cancellationPolicy.partialRefundDays} days in advance.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
