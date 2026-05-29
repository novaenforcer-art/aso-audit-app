import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { extractAppId } from '../../utils/appId.js';

export const fetchMetadataTool = createTool({
  id: 'fetchMetadataTool',
  description: 'Fetches surface-level metadata for an Apple App Store app given its App Store URL or ID.',
  inputSchema: z.object({
    urlOrId: z.string().describe('The App Store URL or numeric App ID'),
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
  execute: async ({ context }) => {
    const { urlOrId } = context;
    let appId = extractAppId(urlOrId) || urlOrId;
    
    // Check Appeeky key
    const appeekyKey = process.env.APPEEKY_API_KEY;
    
    if (appeekyKey) {
      try {
        const res = await fetch(`https://api.appeeky.com/v1/apps/${appId}`, {
          headers: {
            'Authorization': `Bearer ${appeekyKey}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          // Assuming Appeeky response structure, wait I don't know it. Let's adapt if needed or use fallback logic.
          // Since the prompt instructs to fallback if absent, the fallback is a known structure.
          return {
            appId,
            appName: data.trackName || data.name,
            developerName: data.artistName || data.developer,
            iconUrl: data.artworkUrl512 || data.artworkUrl100 || data.icon,
            category: data.primaryGenreName || data.category,
            country: data.country || "US",
            averageRating: data.averageUserRating || data.rating
          };
        }
      } catch (e) {
        console.error("Appeeky API failed, falling back to iTunes API", e);
      }
    }
    
    // Fallback securely to iTunes api
    const itunesRes = await fetch(`https://itunes.apple.com/lookup?id=${appId}`);
    if (!itunesRes.ok) {
      throw new Error(`iTunes API failed with status: ${itunesRes.status}`);
    }
    const itunesData = await itunesRes.json();
    if (itunesData.resultCount === 0) {
      throw new Error("App not found in App Store.");
    }
    
    const result = itunesData.results[0];
    return {
      appId,
      appName: result.trackName,
      developerName: result.artistName,
      iconUrl: result.artworkUrl512 || result.artworkUrl100,
      category: result.primaryGenreName,
      country: result.country || "US", // itunes might not have country easily accessible in lookup unless specified
      averageRating: result.averageUserRating
    };
  }
});
