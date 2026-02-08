/**
 * Game Image & Search Service
 * Uses CheapShark API (free, no key needed) for game search & metadata
 * Uses Steam CDN for high-quality game cover art
 * https://apidocs.cheapshark.com/
 */

const CHEAPSHARK_BASE = 'https://www.cheapshark.com/api/1.0';

// In-memory cache
const imageCache = new Map();
const searchCache = new Map();

/**
 * Get a high-quality Steam CDN image from a Steam App ID
 * Tries vertical library art first (600x900), falls back to header (460x215)
 */
const getSteamImageUrl = (steamAppID) => {
  if (!steamAppID) return null;
  // library_600x900 is the vertical cover art (best for cards)
  return `https://steamcdn-a.akamaihd.net/steam/apps/${steamAppID}/library_600x900_2x.jpg`;
};

const getSteamHeaderUrl = (steamAppID) => {
  if (!steamAppID) return null;
  return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamAppID}/header.jpg`;
};

/**
 * Curated high-quality cover images for popular PlayStation games
 * These are reliable CDN URLs that won't break
 */
const CURATED_COVERS = {
  'god of war ragnarök': 'https://steamcdn-a.akamaihd.net/steam/apps/2322010/library_600x900_2x.jpg',
  'god of war ragnarok': 'https://steamcdn-a.akamaihd.net/steam/apps/2322010/library_600x900_2x.jpg',
  'spider-man 2': 'https://steamcdn-a.akamaihd.net/steam/apps/2651280/library_600x900_2x.jpg',
  "marvel's spider-man 2": 'https://steamcdn-a.akamaihd.net/steam/apps/2651280/library_600x900_2x.jpg',
  'horizon forbidden west': 'https://steamcdn-a.akamaihd.net/steam/apps/2420110/library_600x900_2x.jpg',
  'the last of us part ii': 'https://steamcdn-a.akamaihd.net/steam/apps/2531310/library_600x900_2x.jpg',
  'the last of us part ii remastered': 'https://steamcdn-a.akamaihd.net/steam/apps/2531310/library_600x900_2x.jpg',
  'gran turismo 7': 'https://gmedia.playstation.com/is/image/SIEPDC/gran-turismo-7-store-art-packshot-01-en-04jan22?$1600px$',
  'call of duty: modern warfare iii': 'https://steamcdn-a.akamaihd.net/steam/apps/2519060/library_600x900_2x.jpg',
  'call of duty modern warfare iii': 'https://steamcdn-a.akamaihd.net/steam/apps/2519060/library_600x900_2x.jpg',
  'fifa 24': 'https://steamcdn-a.akamaihd.net/steam/apps/2195250/library_600x900_2x.jpg',
  'ea sports fc 24': 'https://steamcdn-a.akamaihd.net/steam/apps/2195250/library_600x900_2x.jpg',
  'nba 2k24': 'https://steamcdn-a.akamaihd.net/steam/apps/2338770/library_600x900_2x.jpg',
  'mortal kombat 1': 'https://steamcdn-a.akamaihd.net/steam/apps/1971870/library_600x900_2x.jpg',
  'resident evil 4 remake': 'https://steamcdn-a.akamaihd.net/steam/apps/2050650/library_600x900_2x.jpg',
  'resident evil 4': 'https://steamcdn-a.akamaihd.net/steam/apps/2050650/library_600x900_2x.jpg',
  'elden ring': 'https://steamcdn-a.akamaihd.net/steam/apps/1245620/library_600x900_2x.jpg',
  'hogwarts legacy': 'https://steamcdn-a.akamaihd.net/steam/apps/990080/library_600x900_2x.jpg',
  'tekken 8': 'https://steamcdn-a.akamaihd.net/steam/apps/1778820/library_600x900_2x.jpg',
  'red dead redemption 2': 'https://steamcdn-a.akamaihd.net/steam/apps/1174180/library_600x900_2x.jpg',
  'ghost of tsushima': 'https://steamcdn-a.akamaihd.net/steam/apps/2215430/library_600x900_2x.jpg',
  "ghost of tsushima director's cut": 'https://steamcdn-a.akamaihd.net/steam/apps/2215430/library_600x900_2x.jpg',
  'god of war': 'https://steamcdn-a.akamaihd.net/steam/apps/1593500/library_600x900_2x.jpg',
  'uncharted 4': 'https://steamcdn-a.akamaihd.net/steam/apps/1659420/library_600x900_2x.jpg',
  "uncharted: legacy of thieves collection": 'https://steamcdn-a.akamaihd.net/steam/apps/1659420/library_600x900_2x.jpg',
  'final fantasy xvi': 'https://steamcdn-a.akamaihd.net/steam/apps/2515020/library_600x900_2x.jpg',
  'final fantasy 16': 'https://steamcdn-a.akamaihd.net/steam/apps/2515020/library_600x900_2x.jpg',
  'cyberpunk 2077': 'https://steamcdn-a.akamaihd.net/steam/apps/1091500/library_600x900_2x.jpg',
  'gta v': 'https://steamcdn-a.akamaihd.net/steam/apps/271590/library_600x900_2x.jpg',
  'grand theft auto v': 'https://steamcdn-a.akamaihd.net/steam/apps/271590/library_600x900_2x.jpg',
  "assassin's creed valhalla": 'https://steamcdn-a.akamaihd.net/steam/apps/2208920/library_600x900_2x.jpg',
  'returnal': 'https://steamcdn-a.akamaihd.net/steam/apps/1649240/library_600x900_2x.jpg',
  "ratchet & clank: rift apart": 'https://steamcdn-a.akamaihd.net/steam/apps/1895880/library_600x900_2x.jpg',
  "demon's souls": 'https://gmedia.playstation.com/is/image/SIEPDC/demons-souls-remake-keyart-02-en-06oct20?$1600px$',
  'bloodborne': 'https://gmedia.playstation.com/is/image/SIEPDC/bloodborne-listing-thumb-01-ps4-us-12jun14?$1600px$',
  'the witcher 3': 'https://steamcdn-a.akamaihd.net/steam/apps/292030/library_600x900_2x.jpg',
  'the witcher 3: wild hunt': 'https://steamcdn-a.akamaihd.net/steam/apps/292030/library_600x900_2x.jpg',
  "baldur's gate 3": 'https://steamcdn-a.akamaihd.net/steam/apps/1086940/library_600x900_2x.jpg',
  'it takes two': 'https://steamcdn-a.akamaihd.net/steam/apps/1426210/library_600x900_2x.jpg',
  'dying light 2': 'https://steamcdn-a.akamaihd.net/steam/apps/534380/library_600x900_2x.jpg',
  'far cry 6': 'https://steamcdn-a.akamaihd.net/steam/apps/2369390/library_600x900_2x.jpg',
  'hades': 'https://steamcdn-a.akamaihd.net/steam/apps/1145360/library_600x900_2x.jpg',
  'stray': 'https://steamcdn-a.akamaihd.net/steam/apps/1332010/library_600x900_2x.jpg',
  'sifu': 'https://steamcdn-a.akamaihd.net/steam/apps/2138710/library_600x900_2x.jpg',
};

/**
 * Look up a cover image for a game by name
 * Priority: curated covers > CheapShark + Steam CDN > null
 * @param {string} gameName
 * @returns {Promise<string|null>}
 */
export const getGameCoverFromRAWG = async (gameName) => {
  if (!gameName) return null;

  const cacheKey = gameName.toLowerCase().trim();

  // 1. Check memory cache
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  // 2. Check curated covers
  const curated = CURATED_COVERS[cacheKey];
  if (curated) {
    imageCache.set(cacheKey, curated);
    return curated;
  }

  // 3. Also check partial matches in curated covers
  for (const [key, url] of Object.entries(CURATED_COVERS)) {
    if (cacheKey.includes(key) || key.includes(cacheKey)) {
      imageCache.set(cacheKey, url);
      return url;
    }
  }

  // 4. Try CheapShark API to find steamAppID
  try {
    const response = await fetch(
      `${CHEAPSHARK_BASE}/games?title=${encodeURIComponent(gameName)}&limit=1&exact=0`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0 && data[0].steamAppID) {
        const steamUrl = getSteamImageUrl(data[0].steamAppID);
        imageCache.set(cacheKey, steamUrl);
        return steamUrl;
      }
    }
  } catch (err) {
    console.warn(`CheapShark lookup failed for "${gameName}":`, err.message);
  }

  imageCache.set(cacheKey, null);
  return null;
};

/**
 * Batch fetch cover images for multiple games
 * @param {string[]} gameNames
 * @returns {Promise<Map<string, string>>}
 */
export const batchGetGameCovers = async (gameNames) => {
  const results = new Map();
  const uncached = [];

  for (const name of gameNames) {
    const key = name.toLowerCase().trim();
    if (imageCache.has(key)) {
      results.set(key, imageCache.get(key));
    } else {
      // Check curated first (sync, fast)
      const curated = CURATED_COVERS[key];
      if (curated) {
        imageCache.set(key, curated);
        results.set(key, curated);
      } else {
        // Check partial match in curated
        let found = false;
        for (const [ck, curl] of Object.entries(CURATED_COVERS)) {
          if (key.includes(ck) || ck.includes(key)) {
            imageCache.set(key, curl);
            results.set(key, curl);
            found = true;
            break;
          }
        }
        if (!found) uncached.push(name);
      }
    }
  }

  // Fetch uncached in parallel (limit concurrency to 4)
  const batchSize = 4;
  for (let i = 0; i < uncached.length; i += batchSize) {
    const batch = uncached.slice(i, i + batchSize);
    const promises = batch.map(async (name) => {
      const url = await getGameCoverFromRAWG(name);
      results.set(name.toLowerCase().trim(), url);
    });
    await Promise.all(promises);
  }

  return results;
};

/**
 * Search games using CheapShark API (free, no key needed)
 * Returns game data with Steam CDN images
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const searchPS5Games = async (query, limit = 20) => {
  const cacheKey = `search:${query.toLowerCase().trim()}:${limit}`;

  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  try {
    // Use CheapShark deals endpoint for richer data (metacritic, sale prices)
    const url = `${CHEAPSHARK_BASE}/deals?title=${encodeURIComponent(query)}&pageSize=${limit}&sortBy=Metacritic&desc=1&storeID=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!response.ok) throw new Error(`CheapShark error: ${response.status}`);

    const data = await response.json();

    // Deduplicate by game title (CheapShark returns multiple deals per game)
    const seenNames = new Set();
    const games = [];

    for (const deal of data) {
      const nameKey = deal.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);

      const steamAppID = deal.steamAppID;
      const backgroundImage = steamAppID
        ? getSteamImageUrl(steamAppID)
        : (deal.thumb || null);

      games.push({
        id: `cs-${deal.gameID}`,
        gameID: deal.gameID,
        name: deal.title,
        genre: deal.metacriticScore && parseInt(deal.metacriticScore) >= 85 ? 'Highly Rated' : 'Game',
        rating: deal.metacriticScore ? (parseInt(deal.metacriticScore) / 10).toFixed(1) : 'N/A',
        metacritic: deal.metacriticScore ? parseInt(deal.metacriticScore) : null,
        release_year: deal.releaseDate && deal.releaseDate > 0 ? new Date(deal.releaseDate * 1000).getFullYear() : null,
        description: deal.isOnSale === '1'
          ? `💰 On Sale: $${deal.salePrice} (was $${deal.normalPrice}) • Save ${Math.round(parseFloat(deal.savings))}%`
          : `$${deal.normalPrice}`,
        background_image: backgroundImage,
        salePrice: deal.salePrice,
        normalPrice: deal.normalPrice,
        isOnSale: deal.isOnSale === '1',
        savings: deal.savings ? Math.round(parseFloat(deal.savings)) : 0,
        platforms: steamAppID ? ['PC', 'PlayStation'] : ['PlayStation'],
        steamAppID: steamAppID,
        slug: deal.internalName,
      });
    }

    searchCache.set(cacheKey, games);
    return games;
  } catch (err) {
    console.error('CheapShark search error:', err.message);
    return [];
  }
};

/**
 * Get popular/trending games (no search query needed)
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const getPopularPS5Games = async (limit = 20) => {
  const cacheKey = `popular:${limit}`;

  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  try {
    // Get top-rated deals sorted by metacritic
    const url = `${CHEAPSHARK_BASE}/deals?pageSize=${limit}&sortBy=Metacritic&desc=1&upperPrice=70&metacritic=75&storeID=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!response.ok) throw new Error(`CheapShark error: ${response.status}`);

    const data = await response.json();

    const seenNames = new Set();
    const games = [];

    for (const deal of data) {
      const nameKey = deal.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);

      const steamAppID = deal.steamAppID;
      const backgroundImage = steamAppID
        ? getSteamImageUrl(steamAppID)
        : (deal.thumb || null);

      games.push({
        id: `cs-${deal.gameID}`,
        gameID: deal.gameID,
        name: deal.title,
        genre: deal.metacriticScore && parseInt(deal.metacriticScore) >= 85 ? 'Highly Rated' : 'Game',
        rating: deal.metacriticScore ? (parseInt(deal.metacriticScore) / 10).toFixed(1) : 'N/A',
        metacritic: deal.metacriticScore ? parseInt(deal.metacriticScore) : null,
        release_year: deal.releaseDate && deal.releaseDate > 0 ? new Date(deal.releaseDate * 1000).getFullYear() : null,
        description: deal.isOnSale === '1'
          ? `💰 On Sale: $${deal.salePrice} (was $${deal.normalPrice}) • Save ${Math.round(parseFloat(deal.savings))}%`
          : `$${deal.normalPrice}`,
        background_image: backgroundImage,
        salePrice: deal.salePrice,
        normalPrice: deal.normalPrice,
        isOnSale: deal.isOnSale === '1',
        savings: deal.savings ? Math.round(parseFloat(deal.savings)) : 0,
        platforms: steamAppID ? ['PC', 'PlayStation'] : ['PlayStation'],
        steamAppID: steamAppID,
        slug: deal.internalName,
      });
    }

    searchCache.set(cacheKey, games);
    return games;
  } catch (err) {
    console.error('Popular games fetch error:', err.message);
    return [];
  }
};

/**
 * Clear all caches
 */
export const clearRAWGCache = () => {
  imageCache.clear();
  searchCache.clear();
};
