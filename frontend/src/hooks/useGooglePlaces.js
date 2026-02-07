/**
 * useGooglePlaces — Google Places Autocomplete Hook
 * Loads the Google Maps JavaScript API and provides place autocomplete + geocoding.
 * Falls back gracefully when no API key is configured.
 * 
 * Features:
 * - Dynamic Google Maps JS API loading (once, cached)
 * - AutocompleteService for place predictions
 * - PlacesService for lat/lng/address details
 * - Haversine distance utility
 * - Multi-type search (university, school, establishment)
 * - Keyword boosting for "college" queries
 * - Debounced search with session tokens
 * - Static map preview URL generator
 */
import { useState, useEffect, useRef, useCallback } from 'react';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

// ─────────────────────────────────────────
// Haversine formula — distance between two coordinates
// ─────────────────────────────────────────
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius km
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
// Static Map URL generator (no extra API needed — works with Maps JS key)
// ─────────────────────────────────────────
export function getStaticMapUrl(lat, lng, { zoom = 14, width = 400, height = 200, markerColor = 'red' } = {}) {
  if (!GOOGLE_MAPS_API_KEY || !lat || !lng) return null;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&maptype=roadmap&markers=color:${markerColor}%7C${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&style=feature:all|element:geometry|color:0x242f3e&style=feature:all|element:labels.text.stroke|color:0x242f3e&style=feature:all|element:labels.text.fill|color:0x746855&style=feature:road|element:geometry|color:0x38414e&style=feature:water|element:geometry|color:0x17263c`;
}

// ─────────────────────────────────────────
// Google Maps JS API script loader (singleton)
// ─────────────────────────────────────────
let scriptLoadPromise = null;

function loadGoogleMapsScript() {
  if (scriptLoadPromise) return scriptLoadPromise;
  if (window.google && window.google.maps && window.google.maps.places) {
    return Promise.resolve(true);
  }
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
    return Promise.resolve(false);
  }

  scriptLoadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Google Maps API failed to load');
      scriptLoadPromise = null; // allow retry
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * useGooglePlaces Hook
 * @param {Object} options
 * @param {string}   options.country  — ISO country code (e.g. 'in')
 * @param {string[]} options.types    — Google Place types to search
 * @param {string}   options.keyword  — optional keyword to boost queries (e.g. 'college')
 */
export default function useGooglePlaces({
  country = 'in',
  types = ['university'],
  keyword = '',
} = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const sessionToken = useRef(null);
  const debounceTimer = useRef(null);

  // ── Initialise on mount ──
  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsScript().then((loaded) => {
      if (cancelled) return;
      if (loaded && window.google?.maps?.places) {
        setIsLoaded(true);
        autocompleteService.current =
          new window.google.maps.places.AutocompleteService();
        sessionToken.current =
          new window.google.maps.places.AutocompleteSessionToken();
      }
    });
    return () => { cancelled = true; };
  }, []);

  // ── PlacesService needs a DOM element ──
  useEffect(() => {
    if (isLoaded && !placesService.current) {
      const div = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(div);
    }
  }, [isLoaded]);

  // ── Search with debounce (250ms) ──
  const searchPlaces = useCallback(
    (inputText) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (!inputText || inputText.length < 2) {
        setSuggestions([]);
        setIsSearching(false);
        return;
      }

      if (!isLoaded || !autocompleteService.current) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);

      // Boost the query with keyword if provided (helps find colleges)
      const query = keyword && !inputText.toLowerCase().includes(keyword.toLowerCase())
        ? `${inputText} ${keyword}`
        : inputText;

      debounceTimer.current = setTimeout(() => {
        // Build request — use 'establishment' for broader college results
        const request = {
          input: query,
          componentRestrictions: { country },
          sessionToken: sessionToken.current,
        };

        // Only add types if provided (empty array = any type)
        if (types && types.length > 0) {
          request.types = types;
        }

        autocompleteService.current.getPlacePredictions(
          request,
          (predictions, status) => {
            setIsSearching(false);
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              setSuggestions(
                predictions.map((p) => ({
                  placeId: p.place_id,
                  mainText:
                    p.structured_formatting?.main_text || p.description,
                  secondaryText:
                    p.structured_formatting?.secondary_text || '',
                  description: p.description,
                  // preserve matched substrings for highlighting
                  matchedSubstrings:
                    p.structured_formatting?.main_text_matched_substrings || [],
                  types: p.types || [],
                }))
              );
            } else {
              setSuggestions([]);
            }
          }
        );
      }, 250);
    },
    [isLoaded, country, types, keyword]
  );

  // ── Get full place details ──
  const getPlaceDetails = useCallback(
    (placeId) => {
      return new Promise((resolve) => {
        if (!isLoaded || !placesService.current) {
          resolve(null);
          return;
        }
        placesService.current.getDetails(
          {
            placeId,
            fields: [
              'geometry',
              'formatted_address',
              'name',
              'address_components',
              'types',
              'website',
              'formatted_phone_number',
              'rating',
              'user_ratings_total',
              'photos',
            ],
            sessionToken: sessionToken.current,
          },
          (place, status) => {
            // Refresh session token after a details call
            sessionToken.current =
              new window.google.maps.places.AutocompleteSessionToken();

            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              place
            ) {
              const lat = place.geometry?.location?.lat();
              const lng = place.geometry?.location?.lng();

              // Extract address components
              let city = '';
              let state = '';
              let district = '';
              let pincode = '';
              if (place.address_components) {
                for (const comp of place.address_components) {
                  if (comp.types.includes('locality'))
                    city = comp.long_name;
                  if (
                    comp.types.includes('administrative_area_level_2') &&
                    !city
                  )
                    district = comp.long_name;
                  if (comp.types.includes('administrative_area_level_1'))
                    state = comp.long_name;
                  if (comp.types.includes('postal_code'))
                    pincode = comp.long_name;
                }
              }

              // Get a photo URL if available
              let photoUrl = null;
              if (place.photos && place.photos.length > 0) {
                try {
                  photoUrl = place.photos[0].getUrl({ maxWidth: 600, maxHeight: 300 });
                } catch (e) { /* ignore */ }
              }

              resolve({
                name: place.name || '',
                address: place.formatted_address || '',
                lat,
                lng,
                city: city || district,
                district,
                state,
                pincode,
                website: place.website || '',
                phone: place.formatted_phone_number || '',
                rating: place.rating || null,
                totalRatings: place.user_ratings_total || 0,
                photoUrl,
                types: place.types || [],
                mapUrl: getStaticMapUrl(lat, lng),
              });
            } else {
              resolve(null);
            }
          }
        );
      });
    },
    [isLoaded]
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
