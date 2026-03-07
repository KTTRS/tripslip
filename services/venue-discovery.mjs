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
    categories: ['tourism.museum'],
    venueType: 'museum',
  },
  zoos_aquariums: {
    categories: ['tourism.zoo', 'tourism.aquarium'],
    venueType: null,
  },
  nature: {
    categories: ['leisure.park', 'leisure.nature_reserve'],
    venueType: 'nature_area',
  },
  historic: {
    categories: ['historic', 'tourism.attraction'],
    venueType: 'historic_site',
  },
  farms: {
    categories: ['agriculture'],
    venueType: 'farm',
  },
};

const CATEGORY_MAP = {
  'tourism.museum': 'museum',
  'tourism.aquarium': 'aquarium',
  'tourism.zoo': 'zoo',
  'tourism.attraction': 'historic_site',
  'historic': 'historic_site',
  'leisure.park': 'nature_area',
  'leisure.nature_reserve': 'nature_area',
  'agriculture': 'farm',
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
        if (cat.startsWith(prefix)) return type;
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

export async function discoverNearbyVenues(lat, lon, radiusMiles, apiKey) {
  const radiusMeters = milesToMeters(radiusMiles);
  const allResults = [];

  for (const [bundleName, bundle] of Object.entries(CATEGORY_BUNDLES)) {
    try {
      const url = new URL('https://api.geoapify.com/v2/places');
      url.searchParams.set('categories', bundle.categories.join(','));
      url.searchParams.set('filter', `circle:${lon},${lat},${radiusMeters}`);
      url.searchParams.set('limit', '50');
      url.searchParams.set('apiKey', apiKey);

      const res = await fetch(url.toString());
      if (!res.ok) {
        console.error(`Geoapify error for ${bundleName}: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const features = data.features || [];
      console.log(`  ${bundleName}: ${features.length} results`);

      for (const f of features) {
        const props = f.properties || {};
        const geom = f.geometry || {};
        const coords = geom.coordinates || [];

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
          distance_meters: haversineDistance(lat, lon, coords[1], coords[0]),
          raw: props,
          bundle: bundleName,
        });
      }

      await new Promise(r => setTimeout(r, 200));
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
      const closeEnough = venue.distance_meters !== undefined && existing.distance_meters !== undefined
        ? Math.abs(venue.distance_meters - existing.distance_meters) < 500
        : haversineDistance(venue.lat, venue.lon, existing.lat, existing.lon) < 200;

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
        contact_email: venue.contact_email,
        website: venue.website,
        verified: false,
        claimed: false,
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

  const { lat, lon } = await geocodeAddress(school.address, apiKey);
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
