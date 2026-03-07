import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { MapPin, Search, ChevronDown, ExternalLink, Globe, Phone, Star, Users, Sparkles, GraduationCap, DollarSign, CheckCircle, ArrowRight } from 'lucide-react';

interface DiscoveredVenue {
  id: string | null;
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
  primary_photo_url: string | null;
  rating: number;
  review_count: number;
  verified: boolean;
  claimed: boolean;
  distance_miles: number;
  experience_count: number;
  subjects: string[];
  grade_levels: string[];
  price_min_cents: number | null;
  price_max_cents: number | null;
  capacity_min: number | null;
  capacity_max: number | null;
  wheelchair?: boolean;
  fee?: string | null;
  score: number;
  source: string;
}

interface SearchResult {
  center: { lat: number; lon: number };
  radius_miles: number;
  total_results: number;
  db_count: number;
  new_discovered: number;
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
  nature_area: 'Nature & Parks',
  farm: 'Farm',
};

const VENUE_TYPE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  museum: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  aquarium: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300', dot: 'bg-cyan-500' },
  zoo: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-500' },
  science_center: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', dot: 'bg-purple-500' },
  planetarium: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300', dot: 'bg-indigo-500' },
  historic_site: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' },
  botanical_garden: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  nature_area: { bg: 'bg-lime-50', text: 'text-lime-800', border: 'border-lime-300', dot: 'bg-lime-500' },
  farm: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
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
    if (e.key === 'Enter') performSearch();
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const filteredVenues = results?.venues || [];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="relative bg-gradient-to-r from-[#F5C518]/20 via-white to-[#4ECDC4]/15 border-2 border-[#0A0A0A] rounded-2xl shadow-[6px_6px_0px_#0A0A0A] p-8 overflow-hidden">
          <div className="absolute top-4 right-6 animate-float">
            <img src="/images/char-green-octagon.png" alt="" className="w-16 h-16 drop-shadow-lg" />
          </div>
          <div className="absolute bottom-2 right-24 animate-bounce-slow">
            <img src="/images/icon-compass.png" alt="" className="w-10 h-10 opacity-60 drop-shadow-md" />
          </div>
          <div className="absolute top-6 right-48 animate-wiggle">
            <img src="/images/icon-venue.png" alt="" className="w-8 h-8 opacity-40 drop-shadow-md" />
          </div>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#F5C518] border-2 border-[#0A0A0A] flex items-center justify-center p-2.5 shadow-[3px_3px_0px_#0A0A0A] animate-pulse-glow">
              <img src="/images/icon-venue.png" alt="" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-bold text-[#0A0A0A]">Discover Venues</h1>
              <p className="mt-1 text-gray-600 text-lg">
                Find museums, zoos, science centers, and more near your school
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] p-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter school address or city (e.g., Chicago, IL)"
                className="w-full pl-12 pr-4 py-3.5 border-2 border-[#0A0A0A] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] font-sans"
              />
            </div>

            <select
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(Number(e.target.value))}
              className="px-4 py-3.5 border-2 border-[#0A0A0A] rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] font-semibold font-sans"
            >
              {RADIUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button
              onClick={performSearch}
              disabled={loading || !address.trim()}
              className="px-8 py-3.5 bg-[#F5C518] text-[#0A0A0A] font-bold rounded-xl border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#0A0A0A] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_#0A0A0A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-base"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="mt-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-gray-600 hover:text-[#0A0A0A] flex items-center gap-1.5 font-semibold transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
              {showFilters ? 'Hide filters' : 'Show filters'}
            </button>

            {showFilters && (
              <div className="mt-4 pt-4 border-t-2 border-gray-100 space-y-4 animate-slide-up">
                <div>
                  <label className="block text-sm font-bold text-[#0A0A0A] mb-2 font-sans">Filter by name</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Filter results by name..."
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-[#F5C518] font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0A0A0A] mb-2 font-sans">Venue types</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(VENUE_TYPE_LABELS).map(([type, label]) => {
                      const colors = VENUE_TYPE_COLORS[type];
                      const isSelected = selectedTypes.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => toggleType(type)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                            isSelected
                              ? 'bg-[#F5C518] border-[#0A0A0A] text-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] -translate-x-[1px] -translate-y-[1px]'
                              : `${colors?.bg || 'bg-gray-50'} border-gray-200 ${colors?.text || 'text-gray-600'} hover:border-[#0A0A0A] hover:-translate-y-[1px]`
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-400 text-red-800 px-5 py-4 rounded-xl shadow-[3px_3px_0px_rgba(239,68,68,0.3)] font-semibold flex items-center gap-3">
            <span className="text-red-500 text-xl">⚠</span>
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#F5C518] border-t-[#0A0A0A] rounded-full animate-spin" />
              <img src="/images/icon-compass.png" alt="" className="absolute inset-0 m-auto w-8 h-8 animate-wiggle" />
            </div>
            <p className="text-[#0A0A0A] font-bold text-lg mt-6">Discovering venues near you...</p>
            <p className="text-gray-500 text-sm mt-1">Searching museums, zoos, science centers, and more</p>
            <div className="flex gap-3 mt-4">
              {['museum', 'zoo', 'science_center'].map((type, i) => (
                <span
                  key={type}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  {VENUE_TYPE_LABELS[type]}
                </span>
              ))}
            </div>
          </div>
        )}

        {!loading && hasSearched && results && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="font-display text-2xl font-bold text-[#0A0A0A]">
                  {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''} found
                </h2>
                <span className="text-sm text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                  within {results.radius_miles} mi
                </span>
                {results.db_count > 0 && (
                  <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-lg border border-green-200 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {results.db_count} in our database
                  </span>
                )}
                {results.new_discovered > 0 && (
                  <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 font-semibold flex items-center gap-1">
                    +{results.new_discovered} newly discovered
                  </span>
                )}
              </div>
            </div>

            {filteredVenues.length === 0 ? (
              <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] p-16 text-center">
                <div className="animate-float">
                  <img src="/images/icon-compass.png" alt="" className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" />
                </div>
                <h3 className="font-display text-2xl font-bold text-[#0A0A0A] mb-3">No venues found</h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto">
                  Try increasing the search radius or searching a different location.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredVenues.map((venue, i) => (
                  <VenueCard key={venue.id || `venue-${i}`} venue={venue} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && !hasSearched && (
          <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[6px_6px_0px_#0A0A0A] p-12 text-center relative overflow-hidden">
            <div className="absolute top-4 left-4 animate-float opacity-40">
              <img src="/images/char-yellow-star.png" alt="" className="w-12 h-12 drop-shadow-md" />
            </div>
            <div className="absolute bottom-4 right-4 animate-bounce-slow opacity-40">
              <img src="/images/char-pink-heart.png" alt="" className="w-12 h-12 drop-shadow-md" />
            </div>
            <div className="absolute top-8 right-12 animate-wiggle opacity-30">
              <img src="/images/icon-bus.png" alt="" className="w-8 h-8" />
            </div>
            <div className="animate-float mb-6">
              <img src="/images/icon-venue.png" alt="" className="w-24 h-24 mx-auto drop-shadow-xl" />
            </div>
            <h3 className="font-display text-3xl font-bold text-[#0A0A0A] mb-3">Ready to explore?</h3>
            <p className="text-gray-600 text-lg max-w-lg mx-auto leading-relaxed">
              Enter your school's address or city above and we'll discover museums, zoos, science centers,
              historic sites, and other educational venues nearby.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {Object.entries(VENUE_TYPE_LABELS).slice(0, 6).map(([type, label]) => {
                const colors = VENUE_TYPE_COLORS[type];
                return (
                  <span
                    key={type}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] ${colors?.bg || 'bg-gray-50'} ${colors?.text || 'text-gray-600'}`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function VenueCard({ venue, index }: { venue: DiscoveredVenue; index: number }) {
  const navigate = useNavigate();
  const typeColors = VENUE_TYPE_COLORS[venue.venue_type] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300', dot: 'bg-gray-500' };
  const typeLabel = VENUE_TYPE_LABELS[venue.venue_type] || venue.venue_type;
  const typeIcon = VENUE_TYPE_ICONS[venue.venue_type] || '/images/icon-venue.png';

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

  const hasDetailPage = venue.id && venue.source === 'database';

  const handleClick = () => {
    if (hasDetailPage) {
      navigate(`/venues/${venue.id}`);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const full = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.3;

    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(<Star key={i} className="w-4 h-4 text-[#F5C518] fill-[#F5C518]" />);
      } else if (i === full && hasHalf) {
        stars.push(
          <div key={i} className="relative w-4 h-4">
            <Star className="absolute w-4 h-4 text-gray-200 fill-gray-200" />
            <div className="absolute overflow-hidden" style={{ width: '50%' }}>
              <Star className="w-4 h-4 text-[#F5C518] fill-[#F5C518]" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-200 fill-gray-200" />);
      }
    }
    return stars;
  };

  return (
    <div
      onClick={handleClick}
      className={`group bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_#0A0A0A] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_#0A0A0A] transition-all duration-200 overflow-hidden ${hasDetailPage ? 'cursor-pointer' : ''} animate-slide-up`}
      style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s`, animationFillMode: 'both' }}
    >
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {venue.primary_photo_url ? (
          <img
            src={venue.primary_photo_url}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                const fallback = document.createElement('img');
                fallback.src = typeIcon;
                fallback.className = 'w-20 h-20 object-contain opacity-40';
                target.parentElement.appendChild(fallback);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <img src={typeIcon} alt="" className="w-20 h-20 object-contain opacity-30" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] ${typeColors.bg} ${typeColors.text}`}>
            {typeLabel}
          </span>
        </div>

        <div className="absolute top-3 right-3 flex gap-2">
          {venue.verified && (
            <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md">
              <CheckCircle className="w-3 h-3" />
              Verified
            </span>
          )}
          {venue.fee === 'free' && (
            <span className="bg-green-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-md">
              Free
            </span>
          )}
        </div>

        <div className="absolute bottom-3 right-3">
          <span className="bg-[#0A0A0A]/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-bold font-mono">
            {venue.distance_miles} mi
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display text-lg font-bold text-[#0A0A0A] leading-tight line-clamp-2 group-hover:text-[#C49E13] transition-colors">
            {venue.name}
          </h3>
        </div>

        {(venue.rating > 0 || venue.review_count > 0) && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">{renderStars(venue.rating)}</div>
            <span className="text-sm font-semibold text-[#0A0A0A]">{venue.rating > 0 ? venue.rating.toFixed(1) : '–'}</span>
            {venue.review_count > 0 && (
              <span className="text-xs text-gray-500 font-mono">({venue.review_count.toLocaleString()} reviews)</span>
            )}
          </div>
        )}

        {venue.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {venue.description}
          </p>
        )}

        <div className="flex items-center text-sm text-gray-500 mb-3 gap-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
          <span className="truncate">
            {[venue.address?.city, venue.address?.state].filter(Boolean).join(', ')}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {venue.price_min_cents != null && venue.price_max_cents != null && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-800 border border-green-200">
              <DollarSign className="w-3 h-3" />
              {formatPrice(venue.price_min_cents)}{venue.price_min_cents !== venue.price_max_cents ? ` – ${formatPrice(venue.price_max_cents)}` : ''}/student
            </span>
          )}

          {venue.experience_count > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
              <Sparkles className="w-3 h-3" />
              {venue.experience_count} experience{venue.experience_count !== 1 ? 's' : ''}
            </span>
          )}

          {venue.capacity_min != null && venue.capacity_max != null && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <Users className="w-3 h-3" />
              {venue.capacity_min}–{venue.capacity_max}
            </span>
          )}

          {venue.wheelchair && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200">
              ♿ Accessible
            </span>
          )}
        </div>

        {venue.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {venue.subjects.slice(0, 4).map(subject => (
              <span
                key={subject}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-[#F5C518]/15 text-[#0A0A0A] border border-[#F5C518]/30"
              >
                <GraduationCap className="w-3 h-3" />
                {subject}
              </span>
            ))}
            {venue.subjects.length > 4 && (
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-500">
                +{venue.subjects.length - 4} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 pt-3 border-t-2 border-gray-100">
          {venue.website && (
            <a
              href={venue.website.startsWith('http') ? venue.website : `https://${venue.website}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              Website
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {venue.contact_phone && (
            <a
              href={`tel:${venue.contact_phone}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#0A0A0A] transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              {venue.contact_phone}
            </a>
          )}

          <div className="flex-1" />

          {hasDetailPage && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#F5C518] group-hover:text-[#C49E13] transition-colors">
              View details
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
