import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

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

const VENUE_TYPE_LABELS = {
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

const STOCK_IMAGES = {
  museum: 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=600&h=400&fit=crop',
  aquarium: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop',
  zoo: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=600&h=400&fit=crop',
  science_center: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&h=400&fit=crop',
  planetarium: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&h=400&fit=crop',
  historic_site: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600&h=400&fit=crop',
  botanical_garden: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&h=400&fit=crop',
  nature_area: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop',
  farm: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&h=400&fit=crop',
};

function classifyVenueType(name, categories) {
  const lowerName = (name || '').toLowerCase();
  for (const [keyword, type] of Object.entries(NAME_INDICATORS)) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(lowerName)) return type;
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

function milesToMeters(miles) { return miles * 1609.34; }
function metersToMiles(meters) { return meters / 1609.34; }

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

async function fetchWikipediaImage(wikidataId) {
  if (!wikidataId) return null;
  try {
    const res = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    const entity = data.entities?.[wikidataId];
    const imageFile = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (imageFile) {
      const encoded = encodeURIComponent(imageFile.replace(/ /g, '_'));
      const md5 = await computeMD5Prefix(imageFile.replace(/ /g, '_'));
      return `https://upload.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5[0]}${md5[1]}/${encoded}/600px-${encoded}`;
    }
    return null;
  } catch { return null; }
}

async function computeMD5Prefix(filename) {
  const crypto = await import('crypto');
  const hash = crypto.createHash('md5').update(filename).digest('hex');
  return hash;
}

async function fetchWikipediaDescription(title) {
  if (!title) return null;
  try {
    const cleanTitle = title.replace('en:', '');
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTitle)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      description: data.extract || null,
      image: data.thumbnail?.source || data.originalimage?.source || null,
    };
  } catch { return null; }
}

export async function discoverNearbyVenues(lat, lon, radiusMiles, apiKey) {
  const radiusMeters = milesToMeters(radiusMiles);
  const selectedBundles = Object.entries(CATEGORY_BUNDLES);

  const fetchBundle = async ([bundleName, bundle]) => {
    try {
      const url = new URL('https://api.geoapify.com/v2/places');
      url.searchParams.set('categories', bundle.categories.join(','));
      url.searchParams.set('filter', `circle:${lon},${lat},${radiusMeters}`);
      url.searchParams.set('limit', '50');
      url.searchParams.set('apiKey', apiKey);
      const res = await fetch(url.toString());
      if (!res.ok) return [];
      const data = await res.json();
      const features = data.features || [];
      console.log(`  ${bundleName}: ${features.length} results`);
      return features.filter(f => f.properties?.name).map(f => {
        const props = f.properties || {};
        const coords = f.geometry?.coordinates || [];
        return {
          provider: 'geoapify',
          provider_place_id: props.place_id,
          name: props.name,
          formatted: props.formatted,
          address_line1: props.address_line1,
          address_line2: props.address_line2,
          city: props.city,
          state: props.state,
          state_code: props.state_code,
          country: props.country,
          postcode: props.postcode,
          lat: coords[1],
          lon: coords[0],
          categories: props.categories || [],
          website: props.datasource?.raw?.website || props.website,
          phone: props.datasource?.raw?.phone || props.contact?.phone,
          opening_hours: props.datasource?.raw?.opening_hours,
          wikidata: props.datasource?.raw?.wikidata,
          wikipedia: props.datasource?.raw?.wikipedia,
          wheelchair: props.categories?.some(c => c.startsWith('wheelchair.yes')),
          fee: props.categories?.includes('fee') ? 'paid' : props.categories?.includes('no_fee') ? 'free' : null,
          operator: props.datasource?.raw?.operator,
          distance_meters: haversineDistance(lat, lon, coords[1], coords[0]),
          bundle: bundleName,
        };
      });
    } catch (err) {
      console.error(`Error discovering ${bundleName}:`, err.message);
      return [];
    }
  };

  const bundleResults = await Promise.all(selectedBundles.map(fetchBundle));
  return bundleResults.flat();
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
        if (venue.website && !existing.website) existing.website = venue.website;
        if (venue.wikidata && !existing.wikidata) existing.wikidata = venue.wikidata;
        if (venue.wikipedia && !existing.wikipedia) existing.wikipedia = venue.wikipedia;
        break;
      }
    }
    if (!isDuplicate) unique.push(venue);
  }
  return unique;
}

function rankVenues(venues) {
  return venues.map(v => {
    let score = 0;
    const dist = v.distance_miles || 0;
    if (dist <= 10) score += 35;
    else if (dist <= 25) score += 35 * (1 - (dist - 10) / 15);
    else score += 5;
    if (v.website) score += 10;
    if (v.contact_phone || v.phone) score += 5;
    if (v.description) score += 10;
    if (v.primary_photo_url) score += 5;
    if (v.verified) score += 10;
    const typeBoost = { museum: 8, science_center: 10, zoo: 8, aquarium: 8, botanical_garden: 7, historic_site: 7, planetarium: 9, nature_area: 5, farm: 6 };
    score += typeBoost[v.venue_type] || 5;
    return { ...v, score: Math.round(score) };
  }).sort((a, b) => b.score - a.score);
}

async function enrichWithWikipedia(venues) {
  const BATCH_SIZE = 10;
  const enriched = [...venues];

  for (let i = 0; i < enriched.length; i += BATCH_SIZE) {
    const batch = enriched.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (venue) => {
      if (venue.primary_photo_url && venue.description) return;

      if (venue.wikipedia) {
        const wiki = await fetchWikipediaDescription(venue.wikipedia);
        if (wiki) {
          if (!venue.description && wiki.description) venue.description = wiki.description;
          if (!venue.primary_photo_url && wiki.image) venue.primary_photo_url = wiki.image;
        }
      } else if (venue.wikidata && !venue.primary_photo_url) {
        const img = await fetchWikipediaImage(venue.wikidata);
        if (img) venue.primary_photo_url = img;
      }
    }));
  }

  return enriched;
}

async function storeVenuesInDB(venues) {
  const supabase = getSupabase();
  const results = [];

  for (const venue of venues) {
    try {
      const { data: existing } = await supabase
        .from('venues')
        .select('id, name, description, primary_photo_url, website, rating, review_count')
        .ilike('name', venue.name)
        .limit(1);

      if (existing?.length) {
        const ex = existing[0];
        const updates = {};
        if (!ex.description && venue.description) updates.description = venue.description;
        if (!ex.primary_photo_url && venue.primary_photo_url) updates.primary_photo_url = venue.primary_photo_url;
        if (!ex.website && venue.website) updates.website = venue.website;

        if (Object.keys(updates).length > 0) {
          await supabase.from('venues').update(updates).eq('id', ex.id);
        }

        results.push({ ...venue, id: ex.id, db_status: 'existing', rating: ex.rating, review_count: ex.review_count, description: ex.description || venue.description });
        continue;
      }

      const { data, error } = await supabase
        .from('venues')
        .insert({
          name: venue.name,
          description: venue.description || `${VENUE_TYPE_LABELS[venue.venue_type] || 'Venue'} located in ${venue.address?.city || 'the area'}${venue.address?.state ? ', ' + venue.address.state : ''}.`,
          address: venue.address,
          contact_email: `info@${(venue.name || 'venue').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30)}.org`,
          contact_phone: venue.phone || venue.contact_phone,
          website: venue.website,
          primary_photo_url: venue.primary_photo_url || STOCK_IMAGES[venue.venue_type] || null,
          verified: false,
          claimed: false,
          source: 'geoapify',
          rating: 0,
          review_count: 0,
        })
        .select('id')
        .single();

      if (error) {
        console.error(`Error storing ${venue.name}:`, error.message);
        results.push({ ...venue, id: null, db_status: 'error' });
        continue;
      }

      results.push({ ...venue, id: data.id, db_status: 'created' });
    } catch (err) {
      console.error(`Store error for ${venue.name}:`, err.message);
      results.push({ ...venue, id: null, db_status: 'error' });
    }
  }

  return results;
}

async function searchDBVenues(lat, lon, radiusMiles) {
  const supabase = getSupabase();

  const { data: venues, error } = await supabase
    .from('venues')
    .select(`
      id, name, description, address, website, contact_phone,
      primary_photo_url, rating, review_count, verified, claimed,
      capacity_min, capacity_max, source
    `)
    .limit(200);

  if (error || !venues) return [];

  const withinRadius = venues
    .map(v => {
      const addr = v.address;
      let vLat, vLon;
      if (addr?.lat && addr?.lng) { vLat = addr.lat; vLon = addr.lng; }
      else if (addr?.lat && addr?.lon) { vLat = addr.lat; vLon = addr.lon; }

      if (!vLat) return null;

      const distMeters = haversineDistance(lat, lon, vLat, vLon);
      const distMiles = metersToMiles(distMeters);
      if (distMiles > radiusMiles) return null;

      return { ...v, distance_miles: Math.round(distMiles * 10) / 10 };
    })
    .filter(Boolean);

  return withinRadius;
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

  console.log(`Searching near ${centerLat.toFixed(4)}, ${centerLon.toFixed(4)} within ${radiusMiles} mi`);

  const [dbVenues, rawResults] = await Promise.all([
    searchDBVenues(centerLat, centerLon, radiusMiles),
    discoverNearbyVenues(centerLat, centerLon, radiusMiles, apiKey),
  ]);

  console.log(`DB: ${dbVenues.length} cached | Geoapify: ${rawResults.length} discovered`);

  const deduplicated = deduplicateVenues(rawResults);
  const normalized = deduplicated.map(raw => {
    const venueType = classifyVenueType(raw.name, raw.categories);
    const distanceMiles = metersToMiles(raw.distance_meters);
    return {
      name: raw.name,
      venue_type: venueType,
      description: null,
      address: {
        street: raw.address_line1 || '',
        city: raw.city || '',
        state: raw.state_code || raw.state || '',
        zipCode: raw.postcode || '',
        lat: raw.lat,
        lon: raw.lon,
      },
      contact_phone: raw.phone || null,
      website: raw.website || null,
      primary_photo_url: null,
      lat: raw.lat,
      lon: raw.lon,
      distance_miles: Math.round(distanceMiles * 10) / 10,
      wikidata: raw.wikidata,
      wikipedia: raw.wikipedia,
      wheelchair: raw.wheelchair,
      fee: raw.fee,
      operator: raw.operator,
      provider_place_id: raw.provider_place_id,
      categories: raw.categories || [],
    };
  });

  const dbNameSet = new Set(dbVenues.map(v => normalizeName(v.name)));
  const newVenues = normalized.filter(v => !dbNameSet.has(normalizeName(v.name)));

  if (newVenues.length > 0) {
    console.log(`${newVenues.length} new venues to enrich and store...`);
    const enriched = await enrichWithWikipedia(newVenues);
    const storePromise = storeVenuesInDB(enriched);
    storePromise.then(stored => {
      const created = stored.filter(v => v.db_status === 'created').length;
      const updated = stored.filter(v => v.db_status === 'existing').length;
      console.log(`Stored: ${created} new, ${updated} updated (total DB grows)`);
    }).catch(err => {
      console.error('Background store error:', err.message);
    });
  } else {
    console.log(`All ${normalized.length} discovered venues already in DB`);
  }

  const supabase = getSupabase();
  const dbIds = dbVenues.map(v => v.id);
  let expMap = new Map();
  let pricingMap = new Map();

  if (dbIds.length > 0) {
    const { data: experienceData } = await supabase
      .from('experiences')
      .select('venue_id, id, title, subjects, grade_levels, duration_minutes')
      .in('venue_id', dbIds)
      .eq('active', true);

    (experienceData || []).forEach(exp => {
      if (!expMap.has(exp.venue_id)) expMap.set(exp.venue_id, []);
      expMap.get(exp.venue_id).push(exp);
    });

    const expIds = (experienceData || []).map(e => e.id);
    if (expIds.length > 0) {
      const { data: pricing } = await supabase
        .from('pricing_tiers')
        .select('experience_id, price_cents')
        .in('experience_id', expIds);
      (pricing || []).forEach(p => {
        if (!pricingMap.has(p.experience_id)) pricingMap.set(p.experience_id, []);
        pricingMap.get(p.experience_id).push(p.price_cents);
      });
    }
  }

  const dbVenueResults = dbVenues.map(v => {
    const exps = expMap.get(v.id) || [];
    const subjects = [...new Set(exps.flatMap(e => e.subjects || []))];
    const gradeLevels = [...new Set(exps.flatMap(e => e.grade_levels || []))];
    const allPrices = exps.flatMap(e => pricingMap.get(e.id) || []);
    const priceMin = allPrices.length > 0 ? Math.min(...allPrices) : null;
    const priceMax = allPrices.length > 0 ? Math.max(...allPrices) : null;

    return {
      id: v.id,
      name: v.name,
      venue_type: guessVenueTypeFromName(v.name),
      description: v.description,
      address: v.address,
      website: v.website,
      contact_phone: v.contact_phone,
      primary_photo_url: v.primary_photo_url,
      rating: Number(v.rating) || 0,
      review_count: v.review_count || 0,
      verified: v.verified || false,
      claimed: v.claimed || false,
      distance_miles: v.distance_miles,
      experience_count: exps.length,
      subjects,
      grade_levels: gradeLevels,
      price_min_cents: priceMin,
      price_max_cents: priceMax,
      capacity_min: v.capacity_min,
      capacity_max: v.capacity_max,
      source: 'database',
    };
  });

  const freshDiscoveryResults = newVenues.map(v => ({
    id: null,
    name: v.name,
    venue_type: v.venue_type,
    description: v.description || `${VENUE_TYPE_LABELS[v.venue_type] || 'Venue'} in ${v.address?.city || 'the area'}.`,
    address: v.address,
    website: v.website,
    contact_phone: v.contact_phone || v.phone,
    primary_photo_url: v.primary_photo_url || STOCK_IMAGES[v.venue_type] || null,
    rating: 0,
    review_count: 0,
    verified: false,
    claimed: false,
    distance_miles: v.distance_miles,
    experience_count: 0,
    subjects: [],
    grade_levels: [],
    price_min_cents: null,
    price_max_cents: null,
    capacity_min: null,
    capacity_max: null,
    wheelchair: v.wheelchair,
    fee: v.fee,
    source: 'discovered',
  }));

  let allVenues = [...dbVenueResults, ...freshDiscoveryResults];

  const seen = new Set();
  allVenues = allVenues.filter(v => {
    const key = normalizeName(v.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (venueTypes && venueTypes.length > 0) {
    allVenues = allVenues.filter(v => venueTypes.includes(v.venue_type));
  }
  if (searchText) {
    const q = searchText.toLowerCase();
    allVenues = allVenues.filter(v =>
      v.name.toLowerCase().includes(q) ||
      (v.venue_type || '').toLowerCase().includes(q) ||
      (v.description || '').toLowerCase().includes(q) ||
      (v.address?.city || '').toLowerCase().includes(q)
    );
  }

  const ranked = rankVenues(allVenues);

  return {
    center: { lat: centerLat, lon: centerLon },
    radius_miles: radiusMiles,
    total_results: ranked.length,
    db_count: dbVenues.length,
    new_discovered: newVenues.length,
    venues: ranked,
  };
}

function guessVenueTypeFromName(name) {
  return classifyVenueType(name, []);
}

export async function runDiscoveryForSchool(schoolId, apiKey, options = {}) {
  const supabase = getSupabase();
  const radiusMiles = options.radiusMiles || 25;
  const { data: school, error: schoolErr } = await supabase.from('schools').select('*').eq('id', schoolId).single();
  if (schoolErr || !school) throw new Error('School not found');

  const addr = typeof school.address === 'string' ? school.address : school.address;
  const geo = await geocodeAddress(addr, apiKey);

  const result = await searchVenuesLive({ lat: geo.lat, lon: geo.lon, radiusMiles }, apiKey);

  return {
    school: { id: school.id, name: school.name, ...geo },
    ...result,
  };
}
