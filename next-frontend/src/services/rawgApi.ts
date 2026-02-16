/**
 * Game Image & Search Service (TypeScript)
 * Uses CheapShark API (free, no key needed) + Steam CDN
 */

const CHEAPSHARK_BASE = 'https://www.cheapshark.com/api/1.0';

const imageCache = new Map<string, string | null>();
const searchCache = new Map<string, any>();

const getSteamImageUrl = (steamAppID: string | number) => {
  if (!steamAppID) return null;
  return `https://steamcdn-a.akamaihd.net/steam/apps/${steamAppID}/library_600x900_2x.jpg`;
};

const CURATED_COVERS: Record<string, string> = {
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

export const getGameCoverFromRAWG = async (gameName: string): Promise<string | null> => {
  if (!gameName) return null;
  const cacheKey = gameName.toLowerCase().trim();
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey)!;
  const curated = CURATED_COVERS[cacheKey];
  if (curated) { imageCache.set(cacheKey, curated); return curated; }
  for (const [key, url] of Object.entries(CURATED_COVERS)) {
    if (cacheKey.includes(key) || key.includes(cacheKey)) { imageCache.set(cacheKey, url); return url; }
  }
  try {
    const response = await fetch(`${CHEAPSHARK_BASE}/games?title=${encodeURIComponent(gameName)}&limit=1&exact=0`, { signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0 && data[0].steamAppID) {
        const steamUrl = getSteamImageUrl(data[0].steamAppID);
        imageCache.set(cacheKey, steamUrl);
        return steamUrl;
      }
    }
  } catch {}
  imageCache.set(cacheKey, null);
  return null;
};

export const batchGetGameCovers = async (gameNames: string[]): Promise<Map<string, string | null>> => {
  const results = new Map<string, string | null>();
  const uncached: string[] = [];
  for (const name of gameNames) {
    const key = name.toLowerCase().trim();
    if (imageCache.has(key)) { results.set(key, imageCache.get(key)!); continue; }
    const curated = CURATED_COVERS[key];
    if (curated) { imageCache.set(key, curated); results.set(key, curated); continue; }
    let found = false;
    for (const [ck, curl] of Object.entries(CURATED_COVERS)) {
      if (key.includes(ck) || ck.includes(key)) { imageCache.set(key, curl); results.set(key, curl); found = true; break; }
    }
    if (!found) uncached.push(name);
  }
  const batchSize = 4;
  for (let i = 0; i < uncached.length; i += batchSize) {
    const batch = uncached.slice(i, i + batchSize);
    await Promise.all(batch.map(async (name) => { const url = await getGameCoverFromRAWG(name); results.set(name.toLowerCase().trim(), url); }));
  }
  return results;
};

export interface GameSearchResult {
  id: string;
  gameID: string;
  name: string;
  genre: string;
  rating: string;
  metacritic: number | null;
  release_year: number | null;
  description: string;
  background_image: string | null;
  salePrice: string;
  normalPrice: string;
  isOnSale: boolean;
  savings: number;
  platforms: string[];
  steamAppID: string;
  slug: string;
}

export const searchPS5Games = async (query: string, limit = 20): Promise<GameSearchResult[]> => {
  const cacheKey = `search:${query.toLowerCase().trim()}:${limit}`;
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);
  try {
    const url = `${CHEAPSHARK_BASE}/deals?title=${encodeURIComponent(query)}&pageSize=${limit}&sortBy=Metacritic&desc=1&storeID=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`CheapShark error: ${response.status}`);
    const data = await response.json();
    const seenNames = new Set<string>();
    const games: GameSearchResult[] = [];
    for (const deal of data) {
      const nameKey = deal.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);
      const steamAppID = deal.steamAppID;
      games.push({
        id: `cs-${deal.gameID}`, gameID: deal.gameID, name: deal.title,
        genre: deal.metacriticScore && parseInt(deal.metacriticScore) >= 85 ? 'Highly Rated' : 'Game',
        rating: deal.metacriticScore ? (parseInt(deal.metacriticScore) / 10).toFixed(1) : 'N/A',
        metacritic: deal.metacriticScore ? parseInt(deal.metacriticScore) : null,
        release_year: deal.releaseDate && deal.releaseDate > 0 ? new Date(deal.releaseDate * 1000).getFullYear() : null,
        description: deal.isOnSale === '1' ? `💰 On Sale: $${deal.salePrice} (was $${deal.normalPrice}) • Save ${Math.round(parseFloat(deal.savings))}%` : `$${deal.normalPrice}`,
        background_image: steamAppID ? getSteamImageUrl(steamAppID) : (deal.thumb || null),
        salePrice: deal.salePrice, normalPrice: deal.normalPrice,
        isOnSale: deal.isOnSale === '1', savings: deal.savings ? Math.round(parseFloat(deal.savings)) : 0,
        platforms: steamAppID ? ['PC', 'PlayStation'] : ['PlayStation'],
        steamAppID, slug: deal.internalName,
      });
    }
    searchCache.set(cacheKey, games);
    return games;
  } catch { return []; }
};

export const getPopularPS5Games = async (limit = 20): Promise<GameSearchResult[]> => {
  const cacheKey = `popular:${limit}`;
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);
  try {
    const url = `${CHEAPSHARK_BASE}/deals?pageSize=${limit}&sortBy=Metacritic&desc=1&upperPrice=70&metacritic=75&storeID=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`CheapShark error: ${response.status}`);
    const data = await response.json();
    const seenNames = new Set<string>();
    const games: GameSearchResult[] = [];
    for (const deal of data) {
      const nameKey = deal.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);
      const steamAppID = deal.steamAppID;
      games.push({
        id: `cs-${deal.gameID}`, gameID: deal.gameID, name: deal.title,
        genre: deal.metacriticScore && parseInt(deal.metacriticScore) >= 85 ? 'Highly Rated' : 'Game',
        rating: deal.metacriticScore ? (parseInt(deal.metacriticScore) / 10).toFixed(1) : 'N/A',
        metacritic: deal.metacriticScore ? parseInt(deal.metacriticScore) : null,
        release_year: deal.releaseDate && deal.releaseDate > 0 ? new Date(deal.releaseDate * 1000).getFullYear() : null,
        description: deal.isOnSale === '1' ? `💰 On Sale: $${deal.salePrice} (was $${deal.normalPrice}) • Save ${Math.round(parseFloat(deal.savings))}%` : `$${deal.normalPrice}`,
        background_image: steamAppID ? getSteamImageUrl(steamAppID) : (deal.thumb || null),
        salePrice: deal.salePrice, normalPrice: deal.normalPrice,
        isOnSale: deal.isOnSale === '1', savings: deal.savings ? Math.round(parseFloat(deal.savings)) : 0,
        platforms: steamAppID ? ['PC', 'PlayStation'] : ['PlayStation'],
        steamAppID, slug: deal.internalName,
      });
    }
    searchCache.set(cacheKey, games);
    return games;
  } catch { return []; }
};

export const clearRAWGCache = () => { imageCache.clear(); searchCache.clear(); };
