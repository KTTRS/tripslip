import { useState, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { MapPin, Search, ChevronDown, ExternalLink, Globe, Phone } from 'lucide-react';

interface DiscoveredVenue {
  name: string;
  venue_type: string;
  description: string | null;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  website: string | null;
  contact_phone: string | null;
  lat: number;
  lon: number;
  distance_miles: number;
  score: number;
  categories: string[];
  provider_place_id: string;
}

interface SearchResult {
  center: { lat: number; lon: number };
  radius_miles: number;
  total_raw: number;
  total_results: number;
  venues: DiscoveredVenue[];
}

const VENUE_TYPE_LABELS: Record<string, string> = {
  museum: 'Museum',
  aquarium: 'Aquarium',
  zoo: 'Zoo',
  science_center: 'Science Center',
  planetarium: 'Planetarium',
  historic_site: 'Historic Site',
  botanical_garden: 'Botanical Garden',
  nature_area: 'Nature Area',
  farm: 'Farm',
};

const VENUE_TYPE_COLORS: Record<string, string> = {
  museum: 'bg-blue-100 text-blue-800 border-blue-300',
  aquarium: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  zoo: 'bg-green-100 text-green-800 border-green-300',
  science_center: 'bg-purple-100 text-purple-800 border-purple-300',
  planetarium: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  historic_site: 'bg-amber-100 text-amber-800 border-amber-300',
  botanical_garden: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  nature_area: 'bg-lime-100 text-lime-800 border-lime-300',
  farm: 'bg-orange-100 text-orange-800 border-orange-300',
};

const VENUE_TYPE_ICONS: Record<string, string> = {
  museum: '/images/icon-venue.png',
  aquarium: '/images/icon-compass.png',
  zoo: '/images/icon-bus.png',
  science_center: '/images/icon-magic.png',
  planetarium: '/images/icon-compass.png',
  historic_site: '/images/icon-shield.png',
  botanical_garden: '/images/icon-compass.png',
  nature_area: '/images/icon-compass.png',
  farm: '/images/icon-backpack.png',
};

const RADIUS_OPTIONS = [
  { value: 10, label: '10 miles' },
  { value: 25, label: '25 miles' },
  { value: 50, label: '50 miles' },
  { value: 100, label: '100 miles' },
];

export default function VenueSearchPage() {
  const [address, setAddress] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [searchText, setSearchText] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const performSearch = useCallback(async () => {
    if (!address.trim()) {
      setError('Please enter a school address or city to search near');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch('/api/discovery/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          radiusMiles,
          venueTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
          searchText: searchText.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Search failed (${response.status})`);
      }

      const data: SearchResult = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search venues');
      console.error('Discovery search error:', err);
    } finally {
      setLoading(false);
    }
  }, [address, radiusMiles, selectedTypes, searchText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const filteredVenues = results?.venues || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="relative bg-gradient-to-r from-[#F5C518]/20 via-white to-[#4ECDC4]/20 border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 overflow-hidden">
          <div className="absolute top-2 right-4 animate-bounce">
            <img src="/images/char-blue-square.png" alt="" className="w-10 h-10 opacity-60" />
          </div>
          <div className="absolute bottom-1 right-20 animate-pulse">
            <img src="/images/icon-compass.png" alt="" className="w-8 h-8 opacity-40" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#F5C518]/30 border-2 border-[#0A0A0A] flex items-center justify-center p-1.5 shadow-[2px_2px_0px_#0A0A0A]">
              <img src="/images/icon-venue.png" alt="" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#0A0A0A]">Discover Venues</h1>
              <p className="mt-1 text-gray-600">
                Find museums, zoos, science centers, and more near your school
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter school address or city (e.g., Chicago, IL)"
                className="w-full pl-10 pr-4 py-3 border-2 border-[#0A0A0A] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518]"
              />
            </div>

            <select
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(Number(e.target.value))}
              className="px-4 py-3 border-2 border-[#0A0A0A] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] font-medium"
            >
              {RADIUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button
              onClick={performSearch}
              disabled={loading || !address.trim()}
              className="px-6 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold rounded-xl border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[1px_1px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="mt-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-gray-600 hover:text-[#0A0A0A] flex items-center gap-1 font-medium"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              {showFilters ? 'Hide filters' : 'Show filters'}
            </button>

            {showFilters && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">Filter by name</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Filter results by name..."
                      className="w-full pl-9 pr-4 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">Venue types</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(VENUE_TYPE_LABELS).map(([type, label]) => (
                      <button
                        key={type}
                        onClick={() => toggleType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                          selectedTypes.includes(type)
                            ? 'bg-[#F5C518] border-[#0A0A0A] text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-[#0A0A0A]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-[2px_2px_0px_rgba(239,68,68,0.3)] font-medium">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Discovering venues near you...</p>
            <p className="text-gray-400 text-sm mt-1">Searching museums, zoos, science centers, and more</p>
          </div>
        )}

        {!loading && hasSearched && results && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-[#0A0A0A]">
                  {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''} found
                </h2>
                <span className="text-sm text-gray-500">
                  within {results.radius_miles} miles
                </span>
              </div>
              {results.total_raw > 0 && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                  {results.total_raw} raw results, {results.total_results} after dedup
                </span>
              )}
            </div>

            {filteredVenues.length === 0 ? (
              <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-12 text-center">
                <img src="/images/icon-compass.png" alt="" className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-[#0A0A0A] mb-2">No venues found</h3>
                <p className="text-gray-600">
                  Try increasing the search radius or searching a different location.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredVenues.map((venue, i) => (
                  <VenueCard key={venue.provider_place_id || i} venue={venue} />
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && !hasSearched && (
          <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-12 text-center">
            <img src="/images/icon-venue.png" alt="" className="w-20 h-20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#0A0A0A] mb-2">Ready to explore?</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Enter your school's address or city above and we'll find museums, zoos, science centers,
              historic sites, and other educational venues nearby.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['museum', 'zoo', 'aquarium', 'science_center', 'historic_site', 'botanical_garden'].map(type => (
                <span
                  key={type}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${VENUE_TYPE_COLORS[type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                >
                  {VENUE_TYPE_LABELS[type]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function VenueCard({ venue }: { venue: DiscoveredVenue }) {
  const typeColor = VENUE_TYPE_COLORS[venue.venue_type] || 'bg-gray-100 text-gray-700 border-gray-300';
  const typeLabel = VENUE_TYPE_LABELS[venue.venue_type] || venue.venue_type;
  const icon = VENUE_TYPE_ICONS[venue.venue_type] || '/images/icon-venue.png';

  const addressStr = [
    venue.address?.street,
    venue.address?.city,
    venue.address?.state,
    venue.address?.zipCode,
  ].filter(Boolean).join(', ');

  return (
    <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[#F5C518]/20 border-2 border-[#0A0A0A] flex items-center justify-center p-2 shadow-[2px_2px_0px_#0A0A0A]">
            <img src={icon} alt="" className="w-full h-full object-contain" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-[#0A0A0A] truncate">{venue.name}</h3>
                {addressStr && (
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{addressStr}</span>
                  </p>
                )}
              </div>

              <div className="flex-shrink-0 text-right">
                <div className="text-lg font-bold text-[#0A0A0A]">
                  {venue.distance_miles} mi
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  Score: {venue.score}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${typeColor}`}>
                {typeLabel}
              </span>

              {venue.website && (
                <a
                  href={venue.website.startsWith('http') ? venue.website : `https://${venue.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {venue.contact_phone && (
                <a
                  href={`tel:${venue.contact_phone}`}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-[#0A0A0A] font-medium"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {venue.contact_phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
