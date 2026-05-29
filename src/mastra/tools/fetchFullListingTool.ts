import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { extractAppId } from '../../utils/appId.js';
import * as dotenv from 'dotenv';

dotenv.config();

type ReviewRecord = {
  rating?: number;
  review?: string;
  text?: string;
  content?: string;
};

function normalizeWhitespace(value: string) {
  return value.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function truncate(value: string, maxChars: number) {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, maxChars).trimEnd()}...`;
}

function getReviewText(review: ReviewRecord) {
  return review.review || review.text || review.content || '';
}

function summarizeReviews(reviewsValue: unknown) {
  const reviewsArray = Array.isArray(reviewsValue)
    ? reviewsValue
    : Array.isArray((reviewsValue as { data?: unknown })?.data)
      ? ((reviewsValue as { data?: ReviewRecord[] }).data ?? [])
      : Array.isArray((reviewsValue as { reviews?: unknown })?.reviews)
        ? ((reviewsValue as { reviews?: ReviewRecord[] }).reviews ?? [])
        : [];

  const texts = reviewsArray
    .map((review) => getReviewText(review as ReviewRecord).trim())
    .filter(Boolean);

  const themeMatchers: Array<[string, RegExp]> = [
    ['ads', /\bads?\b/i],
    ['premium', /\bpremium\b|\bsubscription\b/i],
    ['playlist management', /\bplaylist\b|\blibrary\b/i],
    ['queue and playback', /\bqueue\b|\bshuffle\b|\bplayback\b|\bplay\b/i],
    ['bugs and crashes', /\bbug\b|\bcrash\b|\bstop(ped)?\b|\bdoesn'?t work\b/i],
    ['recent updates', /\bupdate\b|\bchanges\b|\bnew update\b/i],
    ['search and discovery', /\bsearch\b|\bdiscover\b|\brecommend(ed|ations)?\b/i],
  ];

  const themes = themeMatchers
    .map(([label, matcher]) => {
      const count = texts.reduce((total, text) => total + (matcher.test(text) ? 1 : 0), 0);
      return { label, count };
    })
    .filter((theme) => theme.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 4)
    .map((theme) => theme.label);

  const sampleReviews = reviewsArray.slice(0, 3).map((review) => {
    const record = review as ReviewRecord;
    const text = truncate(normalizeWhitespace(getReviewText(record)), 240);

    return {
      rating: record.rating,
      snippet: text,
    };
  });

  return {
    reviewCount: reviewsArray.length,
    themes,
    sampleReviews,
  };
}

export const fetchFullListingTool = createTool({
  id: 'fetchFullListingTool',
  description: 'Fetches the full App Store listing including reviews and all markdown content for deep ASO audit. Only call this AFTER the user has confirmed the app metadata.',
  inputSchema: z.object({
    url: z.string().describe('The Apple App Store URL of the app'),
  }),
  outputSchema: z.object({
    appId: z.string(),
    listingMarkdownExcerpt: z.string(),
    reviewCount: z.number(),
    reviewThemes: z.array(z.string()),
    sampleReviews: z.array(
      z.object({
        rating: z.number().optional(),
        snippet: z.string(),
      })
    ),
  }),
  execute: async ({ url }) => {
    console.log(`[tool] fetchFullListingTool called for url=${url}`);
    const appId = extractAppId(url) ?? url;
    
    // 1. Scrape with FireCrawl
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlKey) {
      throw new Error("FIRECRAWL_API_KEY is not set.");
    }

    let markdown = "No markdown available";
    try {
      console.log(`[tool] fetchFullListingTool requesting Firecrawl...`);
      const fcRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          formats: ['markdown']
        })
      });
      if (!fcRes.ok) {
        console.error(`[tool] Firecrawl error: ${await fcRes.text()}`);
      } else {
        const fcData = await fcRes.json();
        if (fcData.success && fcData.data && fcData.data.markdown) {
          markdown = fcData.data.markdown;
        }
      }
    } catch (e) {
      console.error("[tool] Firecrawl request failed", e);
    }

    const listingMarkdownExcerpt = truncate(normalizeWhitespace(markdown), 4000);
    
    // 2. Fetch reviews from Appeeky /v1/apps/:id/reviews
    const appeekyKey = process.env.APPEEKY_API_KEY;
    let reviews: unknown = null;
    if (appeekyKey && appId) {
      try {
        console.log(`[tool] fetchFullListingTool requesting Appeeky reviews...`);
        const reviewsRes = await fetch(`https://api.appeeky.com/v1/apps/${appId}/reviews`, {
          headers: {
            'Authorization': `Bearer ${appeekyKey}`
          }
        });
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          reviews = reviewsData.data || reviewsData.reviews || reviewsData;
        }
      } catch (e) {
        console.error("[tool] Appeeky reviews request failed", e);
      }
    }

    const reviewSummary = summarizeReviews(reviews);

    console.log(`[tool] fetchFullListingTool returning data`);
    return {
      appId,
      listingMarkdownExcerpt,
      reviewCount: reviewSummary.reviewCount,
      reviewThemes: reviewSummary.themes,
      sampleReviews: reviewSummary.sampleReviews,
    };
  }
});
