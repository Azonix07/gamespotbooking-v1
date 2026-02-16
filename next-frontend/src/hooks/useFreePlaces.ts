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
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
export interface PlaceSuggestion {
  placeId: string;
  osmId: number;
  osmType: string;
  mainText: string;
  secondaryText: string;
  description: string;
  placeType: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  name: string;
  importance: number;
}

export interface PlaceDetails extends PlaceSuggestion {
  website: string;
  phone: string;
  rating: number | null;
  totalRatings: number;
  photoUrl: string | null;
  mapUrl: string | null;
  osmLink: string | null;
}

interface MapUrlOptions {
  zoom?: number;
  width?: number;
  height?: number;
}

interface UseFreePlacesOptions {
  country?: string;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  [key: string]: string | undefined;
}

interface NominatimResult {
  place_id: number;
  osm_id: number;
  osm_type: string;
  display_name?: string;
  name?: string;
  type?: string;
  class?: string;
  lat: string;
  lon: string;
  importance?: number;
  address?: NominatimAddress;
  extratags?: {
    website?: string;
    phone?: string;
    [key: string]: string | undefined;
  };
}

// ─────────────────────────────────────────
// Haversine formula — distance between two coordinates (km)
// ─────────────────────────────────────────
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
// ─────────────────────────────────────────
export function getFreeMapUrl(
  lat: number | null | undefined,
  lng: number | null | undefined,
  options: MapUrlOptions = {}
): string | null {
  if (!lat || !lng) return null;
  const { zoom = 15, width = 400, height = 200 } = options;
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lng},red-pushpin&maptype=mapnik`;
}

// ─────────────────────────────────────────
// Get OpenStreetMap link for a location
// ─────────────────────────────────────────
export function getOSMLink(lat: number | null | undefined, lng: number | null | undefined): string | null {
  if (!lat || !lng) return null;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

// ─────────────────────────────────────────
// Get Google Maps directions link (free — just a URL, no API needed)
// ─────────────────────────────────────────
export function getDirectionsUrl(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
  return `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}`;
}

// ─────────────────────────────────────────
// Nominatim API helpers
// ─────────────────────────────────────────
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'GameSpotBooking/1.0 (college-event-booking)';

// Rate limiter — Nominatim requires max 1 request/second
let lastRequestTime = 0;
async function rateLimitedFetch(url: string): Promise<NominatimResult[]> {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - timeSinceLast));
  }
  lastRequestTime = Date.now();

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  });
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────
// Search for colleges using Nominatim
// ─────────────────────────────────────────
async function searchCollegesNominatim(query: string, country: string = 'in'): Promise<NominatimResult[]> {
  const educationKeywords = [
    'college', 'university', 'school', 'institute', 'academy',
    'polytechnic', 'iit', 'nit', 'iiit',
  ];
  const lowerQuery = query.toLowerCase();
  const hasKeyword = educationKeywords.some((kw) => lowerQuery.includes(kw));

  const queries: string[] = [];

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

  const allResults: NominatimResult[] = [];
  const seenIds = new Set<number>();

  for (const url of queries) {
    try {
      const results = await rateLimitedFetch(url);
      for (const r of results) {
        if (!seenIds.has(r.place_id)) {
          seenIds.add(r.place_id);
          allResults.push(r);
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('Nominatim search failed:', msg);
    }
  }

  return allResults;
}

// ─────────────────────────────────────────
// Parse Nominatim result into our standard format
// ─────────────────────────────────────────
function parseNominatimResult(result: NominatimResult): PlaceSuggestion {
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
  const city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || '';
  const district = addr.county || addr.state_district || '';
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
export default function useFreePlaces({ country = 'in' }: UseFreePlacesOptions = {}) {
  const [isLoaded] = useState(true); // Always loaded — no script to load!
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (abortController.current) abortController.current.abort();
    };
  }, []);

  // ── Search with debounce (500ms — respects Nominatim rate limit) ──
  const searchPlaces = useCallback(
    (inputText: string) => {
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
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          console.warn('Place search failed:', msg);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, 500);
    },
    [country]
  );

  // ── Get full place details ──
  const getPlaceDetails = useCallback(
    async (placeId: string, suggestion?: PlaceSuggestion): Promise<PlaceDetails | null> => {
      // If the suggestion already has lat/lng, we have everything
      if (suggestion && suggestion.lat && suggestion.lng) {
        return {
          ...suggestion,
          website: '',
          phone: '',
          rating: null,
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
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('Place details lookup failed:', msg);
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
    isLoaded,
    suggestions,
    isSearching,
    searchPlaces,
    getPlaceDetails,
    clearSuggestions,
  };
}
