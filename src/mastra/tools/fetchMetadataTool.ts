import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { extractAppId } from '../../utils/appId.js';

type MetadataResult = {
  appId: string;
  appName: string;
  developerName: string;
  iconUrl: string;
  category: string;
  country?: string;
  averageRating?: number;
};

const metadataCache = new Map<string, MetadataResult>();

export const fetchMetadataTool = createTool({
  id: 'fetchMetadataTool',
  description: 'Fetches surface-level metadata for an Apple App Store app. ONLY call this when the user has provided a valid App Store URL or numeric App ID. Do not guess or use placeholders.',
  inputSchema: z.object({
    urlOrId: z.string().describe('The Apple App Store URL or numeric App ID. Must be a valid URL or numeric ID (e.g. 123456789). Do not use this tool if you lack a URL or ID.'),
  }),
  outputSchema: z.object({
    appId: z.string(),
    appName: z.string(),
    developerName: z.string(),
    iconUrl: z.string(),
    category: z.string(),
    country: z.string().optional(),
    averageRating: z.number().optional()
  }),
  execute: async ({ urlOrId }) => {
    console.log(`[tool] fetchMetadataTool called with urlOrId=${urlOrId}`);
    const appId = extractAppId(urlOrId) ?? urlOrId;

    const cached = metadataCache.get(appId);
    if (cached) {
      console.log(`[tool] fetchMetadataTool cache hit appId=${appId}`);
      return cached;
    }
    
    // Check Appeeky key
    const appeekyKey = process.env.APPEEKY_API_KEY;
    
    if (appeekyKey) {
      try {
        console.log(`[tool] fetchMetadataTool requesting Appeeky appId=${appId}`);
        const res = await fetch(`https://api.appeeky.com/v1/apps/${appId}`, {
          headers: {
            'Authorization': `Bearer ${appeekyKey}`
          }
        });
        if (res.ok) {
          const payload = await res.json();
          const data = payload.data ?? payload;
          const appName = data.trackName || data.name || data.title;
          const developerName = data.artistName || data.developer || data.sellerName;
          const iconUrl = data.artworkUrl512 || data.artworkUrl100 || data.icon || data.iconUrl;
          const category = data.primaryGenreName || data.category || data.metadata?.primaryGenreName;
          const averageRating = data.averageUserRating || data.rating || data.metadata?.averageUserRating;

          if (!appName || !developerName || !iconUrl || !category) {
            console.log(`[tool] fetchMetadataTool Appeeky response missing required fields appId=${appId}; falling back to iTunes`);
          } else {
            console.log(`[tool] fetchMetadataTool Appeeky success appId=${appId}`);
            const result: MetadataResult = {
              appId,
              appName,
              developerName,
              iconUrl,
              category,
              country: data.country || data.metadata?.country || 'US',
              averageRating,
            };
            metadataCache.set(appId, result);
            return result;
          }
        }
        const appeekyBody = await res.text();
        console.log(`[tool] fetchMetadataTool Appeeky non-OK status=${res.status} appId=${appId} body=${appeekyBody}`);
      } catch (e) {
        console.error("Appeeky API failed, falling back to iTunes API", e);
      }
    }
    
    // Fallback securely to iTunes api
    console.log(`[tool] fetchMetadataTool requesting iTunes appId=${appId}`);
    const itunesRes = await fetch(`https://itunes.apple.com/lookup?id=${appId}`);
    if (!itunesRes.ok) {
      throw new Error(`iTunes API failed with status: ${itunesRes.status}`);
    }
    const itunesData = await itunesRes.json();
    if (itunesData.resultCount === 0) {
      throw new Error("App not found in App Store.");
    }
    
    const result = itunesData.results[0];
    console.log(`[tool] fetchMetadataTool iTunes success appId=${appId}`);
    const metadataResult: MetadataResult = {
      appId,
      appName: result.trackName,
      developerName: result.artistName,
      iconUrl: result.artworkUrl512 || result.artworkUrl100,
      category: result.primaryGenreName,
      country: result.country || 'US',
      averageRating: result.averageUserRating
    };
    metadataCache.set(appId, metadataResult);
    return metadataResult;
  }
});
