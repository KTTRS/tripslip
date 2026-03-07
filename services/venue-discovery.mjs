import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

const VENUE_TYPES = [
  'museum', 'aquarium', 'zoo', 'science_center', 'planetarium',
  'historic_site', 'botanical_garden', 'nature_area', 'farm',
];

const CATEGORY_BUNDLES = {
  museums: {
    categories: ['entertainment.museum'],
    venueType: 'museum',
  },
  zoos_aquariums: {
    categories: ['entertainment.zoo', 'entertainment.aquarium'],
    venueType: null,
  },
  science_planetarium: {
    categories: ['entertainment.planetarium', 'entertainment.culture.arts_centre'],
    venueType: null,
  },
  nature: {
    categories: ['leisure.park.nature_reserve', 'national_park', 'natural.protected_area', 'leisure.park.garden'],
    venueType: 'nature_area',
  },
  historic: {
    categories: ['heritage', 'tourism.attraction'],
    venueType: 'historic_site',
  },
  farms: {
    categories: ['commercial.food_and_drink.farm'],
    venueType: 'farm',
  },
};

const CATEGORY_MAP = {
  'entertainment.museum': 'museum',
  'entertainment.aquarium': 'aquarium',
  'entertainment.zoo': 'zoo',
  'entertainment.planetarium': 'planetarium',
  'entertainment.culture.arts_centre': 'science_center',
  'entertainment.culture': 'museum',
  'heritage': 'historic_site',
  'heritage.unesco': 'historic_site',
  'tourism.attraction': 'historic_site',
  'tourism.sights': 'historic_site',
  'leisure.park': 'nature_area',
  'leisure.park.nature_reserve': 'nature_area',
  'leisure.park.garden': 'botanical_garden',
  'national_park': 'nature_area',
  'natural.protected_area': 'nature_area',
  'commercial.food_and_drink.farm': 'farm',
};

const NAME_INDICATORS = {
  aquarium: 'aquarium',
  zoo: 'zoo',
  botanical: 'botanical_garden',
  garden: 'botanical_garden',
  arboretum: 'botanical_garden',
  planetarium: 'planetarium',
  observatory: 'planetarium',
  science: 'science_center',
  farm: 'farm',
  ranch: 'farm',
  historic: 'historic_site',
  heritage: 'historic_site',
  battlefield: 'historic_site',
  monument: 'historic_site',
};

function classifyVenueType(name, categories) {
  const lowerName = (name || '').toLowerCase();

  for (const [keyword, type] of Object.entries(NAME_INDICATORS)) {
    if (lowerName.includes(keyword)) return type;
  }

  if (categories && Array.isArray(categories)) {
    for (const cat of categories) {
      for (const [prefix, type] of Object.entries(CATEGORY_MAP)) {
        if (cat === prefix || cat.startsWith(prefix + '.')) return type;
      }
    }
  }

  return 'museum';
}

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[''""]/g, "'")
    .replace(/[^\w\s']/g, '')
    .replace(/\b(the|of|and|at|in|for|a|an)\b/g, '')
    .replace(/\b(museum|center|centre|park|garden|gardens)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stringSimilarity(a, b) {
  const s1 = normalizeName(a);
  const s2 = normalizeName(b);

  if (s1 === s2) return 100;

  const tokens1 = new Set(s1.split(' ').filter(Boolean));
  const tokens2 = new Set(s2.split(' ').filter(Boolean));
  const intersection = [...tokens1].filter(t => tokens2.has(t));
  const union = new Set([...tokens1, ...tokens2]);

  if (union.size === 0) return 0;
  return Math.round((intersection.length / union.size) * 100);
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function milesToMeters(miles) {
  return miles * 1609.34;
}

function metersToMiles(meters) {
  return meters / 1609.34;
}

export async function geocodeAddress(address, apiKey) {
  const query = typeof address === 'string' ? address : `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;

  const url = new URL('https://api.geoapify.com/v1/geocode/search');
  url.searchParams.set('text', query);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('limit', '1');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);

  const data = await res.json();
  const result = data.results?.[0];
  if (!result) throw new Error(`No geocoding result for: ${query}`);

  return { lat: result.lat, lon: result.lon, formatted: result.formatted };
}

export async function discoverNearbyVenues(lat, lon, radiusMiles, apiKey, options = {}) {
  const radiusMeters = milesToMeters(radiusMiles);
  const allResults = [];
  const selectedBundles = options.categories
    ? Object.entries(CATEGORY_BUNDLES).filter(([name]) => options.categories.includes(name))
    : Object.entries(CATEGORY_BUNDLES);

  for (const [bundleName, bundle] of selectedBundles) {
    try {
      const url = new URL('https://api.geoapify.com/v2/places');
      url.searchParams.set('categories', bundle.categories.join(','));
      url.searchParams.set('filter', `circle:${lon},${lat},${radiusMeters}`);
      url.searchParams.set('limit', '50');
      url.searchParams.set('apiKey', apiKey);

      const res = await fetch(url.toString());
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        console.error(`Geoapify error for ${bundleName}: ${res.status}`, errBody.substring(0, 200));
        continue;
      }

      const data = await res.json();
      const features = data.features || [];
      console.log(`  ${bundleName}: ${features.length} results`);

      for (const f of features) {
        const props = f.properties || {};
        const geom = f.geometry || {};
        const coords = geom.coordinates || [];

        if (!props.name) continue;

        allResults.push({
          provider: 'geoapify',
          provider_place_id: props.place_id,
          name: props.name,
          address_line1: props.address_line1,
          address_line2: props.address_line2,
          city: props.city,
          state: props.state,
          country: props.country,
          postcode: props.postcode,
          lat: coords[1],
          lon: coords[0],
          categories: props.categories || [],
          website: props.website,
          phone: props.contact?.phone,
          opening_hours: props.opening_hours,
          distance_meters: haversineDistance(lat, lon, coords[1], coords[0]),
          raw: props,
          bundle: bundleName,
        });
      }

      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      console.error(`Error discovering ${bundleName}:`, err.message);
    }
  }

  return allResults;
}

export function deduplicateVenues(venues) {
  const unique = [];

  for (const venue of venues) {
    if (!venue.name) continue;

    let isDuplicate = false;
    for (const existing of unique) {
      const nameSim = stringSimilarity(venue.name, existing.name);
      const closeEnough = venue.lat && existing.lat
        ? haversineDistance(venue.lat, venue.lon, existing.lat, existing.lon) < 200
        : false;

      if (nameSim > 85 && closeEnough) {
        isDuplicate = true;
        if (venue.website && !existing.website) {
          existing.website = venue.website;
        }
        break;
      }
    }

    if (!isDuplicate) {
      unique.push(venue);
    }
  }

  return unique;
}

export function normalizeToVenueRecord(raw, schoolLat, schoolLon) {
  const venueType = classifyVenueType(raw.name, raw.categories);
  const distanceMiles = metersToMiles(
    haversineDistance(schoolLat, schoolLon, raw.lat, raw.lon)
  );

  return {
    name: raw.name,
    venue_type: venueType,
    description: null,
    address: {
      street: raw.address_line1 || '',
      city: raw.city || '',
      state: raw.state || '',
      zipCode: raw.postcode || '',
    },
    contact_email: null,
    contact_phone: raw.phone || null,
    website: raw.website || null,
    lat: raw.lat,
    lon: raw.lon,
    distance_miles: Math.round(distanceMiles * 10) / 10,
    data_source: 'geoapify',
    provider_place_id: raw.provider_place_id,
    verified: false,
    claimed: false,
    rating: null,
    review_count: 0,
    categories: raw.categories || [],
    opening_hours: raw.opening_hours || null,
  };
}

export function rankVenues(venues, options = {}) {
  const { grade, subjects } = options;

  return venues.map(v => {
    let score = 0;

    const dist = v.distance_miles || 0;
    if (dist <= 10) score += 35;
    else if (dist <= 25) score += 35 * (1 - (dist - 10) / 15);
    else score += 5;

    if (v.website) score += 10;
    if (v.contact_phone) score += 5;
    if (v.description) score += 5;
    if (v.verified) score += 10;

    const typeBoost = {
      museum: 8, science_center: 10, zoo: 8, aquarium: 8,
      botanical_garden: 7, historic_site: 7, planetarium: 9,
      nature_area: 5, farm: 6,
    };
    score += typeBoost[v.venue_type] || 5;

    return { ...v, score: Math.round(score) };
  }).sort((a, b) => b.score - a.score);
}

export async function storeDiscoveredVenues(venues, schoolId) {
  const supabase = getSupabase();
  const stored = [];

  for (const venue of venues) {
    const { data: existing } = await supabase
      .from('venues')
      .select('id, name')
      .ilike('name', venue.name)
      .limit(1);

    if (existing?.length) {
      stored.push({ ...venue, id: existing[0].id, status: 'existing' });
      continue;
    }

    const { data, error } = await supabase
      .from('venues')
      .insert({
        name: venue.name,
        description: venue.description,
        address: venue.address,
        contact_email: venue.contact_email || `info@${(venue.name || 'venue').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        website: venue.website,
        verified: false,
        claimed: false,
        source: 'geoapify',
      })
      .select('id')
      .single();

    if (error) {
      console.error(`Error storing venue ${venue.name}:`, error.message);
      continue;
    }

    stored.push({ ...venue, id: data.id, status: 'created' });
  }

  return stored;
}

export async function searchVenuesLive(query, apiKey) {
  const { address, lat, lon, radiusMiles = 25, venueTypes, searchText } = query;

  let centerLat = lat;
  let centerLon = lon;

  if (!centerLat && address) {
    const geo = await geocodeAddress(address, apiKey);
    centerLat = geo.lat;
    centerLon = geo.lon;
  }

  if (!centerLat || !centerLon) {
    throw new Error('Location is required — provide address or lat/lon');
  }

  const rawResults = await discoverNearbyVenues(centerLat, centerLon, radiusMiles, apiKey);
  const deduplicated = deduplicateVenues(rawResults);
  const normalized = deduplicated.map(r => normalizeToVenueRecord(r, centerLat, centerLon));

  let filtered = normalized;
  if (venueTypes && venueTypes.length > 0) {
    filtered = filtered.filter(v => venueTypes.includes(v.venue_type));
  }
  if (searchText) {
    const q = searchText.toLowerCase();
    filtered = filtered.filter(v =>
      v.name.toLowerCase().includes(q) ||
      (v.venue_type || '').toLowerCase().includes(q) ||
      (v.address?.city || '').toLowerCase().includes(q)
    );
  }

  const ranked = rankVenues(filtered);

  return {
    center: { lat: centerLat, lon: centerLon },
    radius_miles: radiusMiles,
    total_raw: rawResults.length,
    total_results: ranked.length,
    venues: ranked,
  };
}

export async function runDiscoveryForSchool(schoolId, apiKey, options = {}) {
  const supabase = getSupabase();
  const radiusMiles = options.radiusMiles || 25;

  const { data: school, error: schoolErr } = await supabase
    .from('schools')
    .select('*')
    .eq('id', schoolId)
    .single();

  if (schoolErr || !school) throw new Error('School not found');

  console.log(`Running discovery for: ${school.name}`);

  let lat, lon;
  if (school.address) {
    const addr = typeof school.address === 'string' ? school.address : school.address;
    const geo = await geocodeAddress(addr, apiKey);
    lat = geo.lat;
    lon = geo.lon;
  } else {
    throw new Error('School has no address');
  }
  console.log(`Geocoded to: ${lat}, ${lon}`);

  console.log(`Searching within ${radiusMiles} miles...`);
  const rawResults = await discoverNearbyVenues(lat, lon, radiusMiles, apiKey);
  console.log(`Raw results: ${rawResults.length}`);

  const deduplicated = deduplicateVenues(rawResults);
  console.log(`After dedup: ${deduplicated.length}`);

  const normalized = deduplicated.map(r => normalizeToVenueRecord(r, lat, lon));
  const ranked = rankVenues(normalized, options);

  const stored = await storeDiscoveredVenues(ranked, schoolId);
  console.log(`Stored: ${stored.length} (${stored.filter(s => s.status === 'created').length} new, ${stored.filter(s => s.status === 'existing').length} existing)`);

  return {
    school: { id: school.id, name: school.name, lat, lon },
    radius_miles: radiusMiles,
    total_raw: rawResults.length,
    total_deduplicated: deduplicated.length,
    venues: stored,
  };
}
