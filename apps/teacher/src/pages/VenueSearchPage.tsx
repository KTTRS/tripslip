/**
 * Venue Search Page
 * 
 * Main page for discovering and searching venues with:
 * - Text search input
 * - Filter sidebar (categories, distance, price, accessibility)
 * - Map view with venue markers
 * - List view with venue cards
 * - Sort controls
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 29.1, 29.2
 */

import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { SearchBar } from '../components/venue-search/SearchBar';
import { FilterSidebar } from '../components/venue-search/FilterSidebar';
import { SearchResults } from '../components/venue-search/SearchResults';
import { VenueMapView } from '../components/venue-search/VenueMapView';
import { createSearchService, type SearchQuery, type VenueSearchHit } from '@tripslip/database';
import { supabase } from '../lib/supabase';

type ViewMode = 'list' | 'map';

export default function VenueSearchPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({
    sortBy: 'relevance',
    sortOrder: 'desc',
    limit: 20
  });
  const [venues, setVenues] = useState<VenueSearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<{ categories: { name: string; count: number }[] }>({ categories: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const searchService = createSearchService(supabase);

  // Perform search when query changes
  useEffect(() => {
    performSearch();
  }, [searchQuery]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await searchService.searchVenues(searchQuery);
      setVenues(result.venues);
      setTotal(result.total);
      setNextCursor(result.nextCursor);
      setFacets({ categories: result.facets.categories });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search venues');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTextChange = (query: string) => {
    setSearchQuery(prev => ({ ...prev, query, cursor: undefined }));
  };

  const handleFilterChange = (filters: Partial<SearchQuery>) => {
    setSearchQuery(prev => ({ ...prev, ...filters, cursor: undefined }));
  };

  const handleSortChange = (sortBy: SearchQuery['sortBy'], sortOrder: SearchQuery['sortOrder']) => {
    setSearchQuery(prev => ({ ...prev, sortBy, sortOrder, cursor: undefined }));
  };

  const handleLoadMore = () => {
    if (nextCursor) {
      setSearchQuery(prev => ({ ...prev, cursor: nextCursor }));
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discover Venues</h1>
          <p className="mt-2 text-gray-600">
            Search for educational venues and experiences for your next field trip
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar
          onSearch={handleSearchTextChange}
          initialQuery={searchQuery.query}
        />

        {/* View Toggle */}
        <div className="flex justify-end">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
                viewMode === 'map'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Map View
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <FilterSidebar
              currentFilters={searchQuery}
              onFilterChange={handleFilterChange}
              availableCategories={facets.categories}
            />
          </aside>

          {/* Results Area */}
          <main className="flex-1 min-w-0">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {viewMode === 'list' ? (
              <SearchResults
                venues={venues}
                total={total}
                loading={loading}
                hasMore={!!nextCursor}
                onLoadMore={handleLoadMore}
                onSortChange={handleSortChange}
                currentSort={{
                  sortBy: searchQuery.sortBy || 'relevance',
                  sortOrder: searchQuery.sortOrder || 'desc'
                }}
              />
            ) : (
              <VenueMapView
                venues={venues}
                loading={loading}
                center={searchQuery.location}
              />
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}
