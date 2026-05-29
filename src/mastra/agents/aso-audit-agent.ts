import { Agent } from '@mastra/core/agent';
import { fetchMetadataTool } from '../tools/fetchMetadataTool.js';

export const asoAuditAgent = new Agent({
  name: 'asoAuditAgent',
  instructions: `You are an expert in App Store Optimization with deep knowledge of Apple's ranking algorithms.
When a user provides an Apple App Store URL, follow these steps strictly:

Step 1: Use the fetchMetadataTool to retrieve surface-level metadata for the listing.
Step 2: Present the retrieved metadata (app name, developer, icon URL, category, country) to the user and ask: "Is this the app you meant?"
Wait for the user's confirmation.

Do not proceed to the full ASO audit before the user confirms.`,
  model: {
    provider: 'openai',
    name: 'gpt-4o',
    toolChoice: 'auto',
  },
  tools: { fetchMetadataTool },
});
