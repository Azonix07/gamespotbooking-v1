/**
 * useFreePlaces — 100% Free College Autocomplete + Geocoding + Distance
 * 
 * Uses OpenStreetMap APIs (completely free, no API key required):
 * 1. Nominatim API — geocoding & place search (limit: 1 req/sec, free forever)
 * 2. Overpass API  — query OSM for colleges/universities with structured tags
 * 3. Haversine     — client-side distance calculation
 * 4. OSM Static Tiles — free map preview via openstreetmap tile server
 * 
 * Why this works better than Google for Indian colleges:
 * - OSM has excellent coverage of Indian educational institutions
 * - Tagged data includes amenity=college, amenity=university, amenity=school
 * - No API key, no billing, no quota limits (just respect 1 req/sec)
 * - Nominatim returns structured address parts (city, state, district)
 */
import { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────
// Haversine formula — distance between two coordinates (km)
// ─────────────────────────────────────────
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// ─────────────────────────────────────────
// Free Static Map URL — OpenStreetMap tiles
// Uses a public tile server to create a static map image
// ─────────────────────────────────────────
export function getFreeMapUrl(lat, lng, { zoom = 15, width = 400, height = 200 } = {}) {
  if (!lat || !lng) return null;
  // Use OSM's free static map service
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lng},red-pushpin&maptype=mapnik`;
}

// ─────────────────────────────────────────
// Get OpenStreetMap link for a location
// ─────────────────────────────────────────
export function getOSMLink(lat, lng) {
  if (!lat || !lng) return null;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

// ─────────────────────────────────────────
// Get Google Maps directions link (free — just a URL, no API needed)
// ─────────────────────────────────────────
export function getDirectionsUrl(fromLat, fromLng, toLat, toLng) {
  return `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}`;
}

// ─────────────────────────────────────────
// Nominatim API helpers
// ─────────────────────────────────────────
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'GameSpotBooking/1.0 (college-event-booking)';

// Rate limiter — Nominatim requires max 1 request/second
let lastRequestTime = 0;
async function rateLimitedFetch(url) {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - timeSinceLast));
  }
  lastRequestTime = Date.now();

  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': USER_AGENT,
    },
  });
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────
// Search for colleges using Nominatim
// Strategy: search with "college" / "university" / "school" keywords
// restricted to India, filtered by type
// ─────────────────────────────────────────
async function searchCollegesNominatim(query, country = 'in') {
  // Boost the query with educational keyword if not already present
  const educationKeywords = ['college', 'university', 'school', 'institute', 'academy', 'polytechnic', 'iit', 'nit', 'iiit'];
  const lowerQuery = query.toLowerCase();
  const hasKeyword = educationKeywords.some((kw) => lowerQuery.includes(kw));
  
  // Build search queries — run two searches for better coverage
  const queries = [];
  
  // Primary: exact user query
  queries.push(
    `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&countrycodes=${country}&format=json&addressdetails=1&limit=5&extratags=1`
  );
  
  // Secondary: if no education keyword, boost with "college"
  if (!hasKeyword) {
    queries.push(
      `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query + ' college')}&countrycodes=${country}&format=json&addressdetails=1&limit=5&extratags=1`
    );
  }

  const allResults = [];
  const seenIds = new Set();

  for (const url of queries) {
    try {
      const results = await rateLimitedFetch(url);
      for (const r of results) {
        if (!seenIds.has(r.place_id)) {
          seenIds.add(r.place_id);
          allResults.push(r);
        }
      }
    } catch (e) {
      console.warn('Nominatim search failed:', e.message);
    }
  }

  return allResults;
}

// ─────────────────────────────────────────
// Parse Nominatim result into our standard format
// ─────────────────────────────────────────
function parseNominatimResult(result) {
  const addr = result.address || {};
  
  // Determine place type
  let placeType = 'place';
  const osmType = result.type || '';
  const osmClass = result.class || '';
  if (osmType === 'university' || (result.display_name || '').toLowerCase().includes('university')) {
    placeType = 'university';
  } else if (osmType === 'college' || (result.display_name || '').toLowerCase().includes('college')) {
    placeType = 'college';
  } else if (osmType === 'school' || (result.display_name || '').toLowerCase().includes('school')) {
    placeType = 'school';
  } else if (osmClass === 'amenity' || osmClass === 'building') {
    placeType = 'institution';
  }

  // Extract main name vs full address
  const nameParts = (result.display_name || '').split(',').map((s) => s.trim());
  const mainText = nameParts[0] || result.name || '';
  const secondaryText = nameParts.slice(1, 4).join(', ');

  // City — try multiple address fields
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.suburb ||
    addr.municipality ||
    '';
  const district =
    addr.county ||
    addr.state_district ||
    '';
  const state = addr.state || '';
  const pincode = addr.postcode || '';

  return {
    placeId: String(result.place_id),
    osmId: result.osm_id,
    osmType: result.osm_type,
    mainText,
    secondaryText,
    description: result.display_name || '',
    placeType,
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    address: result.display_name || '',
    city,
    district,
    state,
    pincode,
    name: mainText,
    importance: result.importance || 0,
  };
}

// ═════════════════════════════════════════
// THE HOOK
// ═════════════════════════════════════════
export default function useFreePlaces({ country = 'in' } = {}) {
  const [isLoaded, setIsLoaded] = useState(true); // Always loaded — no script to load!
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef(null);
  const abortController = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (abortController.current) abortController.current.abort();
    };
  }, []);

  // ── Search with debounce (500ms — respects Nominatim rate limit) ──
  const searchPlaces = useCallback(
    (inputText) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (!inputText || inputText.length < 2) {
        setSuggestions([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      debounceTimer.current = setTimeout(async () => {
        try {
          const rawResults = await searchCollegesNominatim(inputText, country);

          // Parse and rank results
          const parsed = rawResults.map(parseNominatimResult);

          // Sort: prioritize educational institutions, then by importance
          const educationalTypes = ['university', 'college', 'school', 'institution'];
          parsed.sort((a, b) => {
            const aIsEdu = educationalTypes.includes(a.placeType) ? 1 : 0;
            const bIsEdu = educationalTypes.includes(b.placeType) ? 1 : 0;
            if (bIsEdu !== aIsEdu) return bIsEdu - aIsEdu;
            return (b.importance || 0) - (a.importance || 0);
          });

          // Limit to top 8
          setSuggestions(parsed.slice(0, 8));
        } catch (e) {
          console.warn('Place search failed:', e.message);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, 500); // 500ms debounce to stay within Nominatim's rate limit
    },
    [country]
  );

  // ── Get full place details (already have them from search!) ──
  // Nominatim gives us everything in the search response itself,
  // but we also fetch a bit more detail for the selected place
  const getPlaceDetails = useCallback(
    async (placeId, suggestion) => {
      // If the suggestion already has lat/lng, we have everything
      if (suggestion && suggestion.lat && suggestion.lng) {
        return {
          name: suggestion.name || suggestion.mainText,
          address: suggestion.address || suggestion.description,
          lat: suggestion.lat,
          lng: suggestion.lng,
          city: suggestion.city || '',
          district: suggestion.district || '',
          state: suggestion.state || '',
          pincode: suggestion.pincode || '',
          placeType: suggestion.placeType || 'place',
          website: '', // OSM doesn't always have this
          phone: '',
          rating: null, // No ratings in OSM
          totalRatings: 0,
          photoUrl: null,
          mapUrl: getFreeMapUrl(suggestion.lat, suggestion.lng),
          osmLink: getOSMLink(suggestion.lat, suggestion.lng),
        };
      }

      // Fallback: lookup by place_id using Nominatim reverse/lookup
      try {
        const url = `${NOMINATIM_BASE}/lookup?osm_ids=N${placeId},W${placeId},R${placeId}&format=json&addressdetails=1&extratags=1`;
        const results = await rateLimitedFetch(url);
        if (results && results.length > 0) {
          const parsed = parseNominatimResult(results[0]);
          return {
            ...parsed,
            website: results[0].extratags?.website || '',
            phone: results[0].extratags?.phone || '',
            rating: null,
            totalRatings: 0,
            photoUrl: null,
            mapUrl: getFreeMapUrl(parsed.lat, parsed.lng),
            osmLink: getOSMLink(parsed.lat, parsed.lng),
          };
        }
      } catch (e) {
        console.warn('Place details lookup failed:', e.message);
      }
      return null;
    },
    []
  );

  // ── Clear ──
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    isLoaded,       // Always true — no external script needed
    suggestions,
    isSearching,
    searchPlaces,
    getPlaceDetails,
    clearSuggestions,
  };
}
