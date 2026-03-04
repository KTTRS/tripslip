/**
 * Search Results Component
 * 
 * Displays search results in list view with:
 * - Sort controls
 * - Venue cards
 * - Load more button
 * - Loading and empty states
 * 
 * Requirements: 3.6, 3.7, 3.8
 */

import { useNavigate } from 'react-router';
import type { VenueSearchHit, SearchQuery } from '@tripslip/database';
import { VenueCard } from './VenueCard';
import { logger } from '@tripslip/utils';

interface SearchResultsProps {
  venues: VenueSearchHit[];
  total: number;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSortChange: (sortBy: SearchQuery['sortBy'], sortOrder: SearchQuery['sortOrder']) => void;
  currentSort: {
    sortBy: NonNullable<SearchQuery['sortBy']>;
    sortOrder: NonNullable<SearchQuery['sortOrder']>;
  };
}

export function SearchResults({
  venues,
  total,
  loading,
  hasMore,
  onLoadMore,
  onSortChange,
  currentSort
}: SearchResultsProps) {
  const navigate = useNavigate();
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const [sortBy, sortOrder] = value.split('-') as [
      SearchQuery['sortBy'],
      SearchQuery['sortOrder']
    ];
    onSortChange(sortBy, sortOrder);
  };

  const sortValue = `${currentSort.sortBy}-${currentSort.sortOrder}`;

  return (
    <div className="space-y-4">
      {/* Header with sort controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {loading ? (
            <span>Searching...</span>
          ) : (
            <span>
              {total} {total === 1 ? 'venue' : 'venues'} found
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-gray-600">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortValue}
            onChange={handleSortChange}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="relevance-desc">Relevance</option>
            <option value="rating-desc">Rating (High to Low)</option>
            <option value="rating-asc">Rating (Low to High)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
            <option value="distance-asc">Distance (Nearest)</option>
            <option value="distance-desc">Distance (Farthest)</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && venues.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && venues.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No venues found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or filters
          </p>
        </div>
      )}

      {/* Results Grid */}
      {venues.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map(venue => (
              <VenueCard
                key={venue.id}
                venue={venue}
                onClick={() => {
                  logger.debug('Navigating to venue detail', { venueId: venue.id, venueName: venue.name });
                  navigate(`/venues/${venue.id}`);
                }}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <button
                onClick={onLoadMore}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
