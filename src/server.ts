import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { mastra } from './mastra/index.js';
import util from 'util';

import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseCookies(cookieHeader: string | undefined) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    cookies[name] = decodeURIComponent(value);
  }
  return cookies;
}

const app = express();
app.use(cors());
app.use(express.json());

type ThreadState = {
  lastAppStoreUrl?: string;
};

const threadState = new Map<string, ThreadState>();

async function isConfirmationMessage(
  agent: ReturnType<typeof mastra.getAgent>,
  message: string,
  appStoreUrl: string
) {
  const response = await agent.generate(
    [
      'Classify whether the user is confirming that the previously shown App Store listing is the correct app.',
      `Previously shown App Store listing: ${appStoreUrl}`,
      `User message: ${message}`,
      '',
      'Return exactly one token:',
      'CONFIRM - if the user is affirming, approving, or saying this is the correct app.',
      'NOT_CONFIRM - if the user is rejecting it, uncertain, asking a question, changing apps, or doing anything else.',
    ].join('\n'),
    {
      instructions: 'You are an intent classifier. Do not call tools. Do not explain your answer.',
      toolChoice: 'none',
      memory: undefined,
      maxSteps: 1,
      temperature: 0,
    }
  );

  return response.text.trim().toUpperCase().startsWith('CONFIRM');
}

function buildFinalAuditPrompt(appStoreUrl: string) {
  return [
    'FINAL AUDIT MODE.',
    `The user already confirmed this App Store listing: ${appStoreUrl}.`,
    'Your only job is to produce the ASO audit now.',
    'Do not ask any follow-up questions or ask for confirmation again.',
    'Do not mention missing tools or raw JSON.',
    `1. Call fetchMetadataTool EXACTLY ONCE using urlOrId: ${appStoreUrl}`,
    `2. Call fetchFullListingTool EXACTLY ONCE using url: ${appStoreUrl}`,
    '3. Wait for the data from both tools, then return the report in this order:',
    '1. ASO Score Card',
    '2. Quick Wins',
    '3. High-Impact Changes',
    '4. Strategic Recommendations',
    '5. Competitor Comparison',
  ].join('\n');
}

function isStillAskingForConfirmation(reply: string) {
  return /is this the app you meant\??|provide the url|need the url|please provide the url/i.test(reply);
}

// Serve static files from 'public' directory
app.use(express.static(join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  const { message, threadId: providedThreadId } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  console.log(`[api] /api/chat received message=${message} providedThreadId=${providedThreadId}`);

  // Determine canonical threadId for this session:
  const cookieHeader = req.headers.cookie;
  const cookies = parseCookies(cookieHeader);
  const cookieThreadId = cookies['threadId'];
  let threadId = cookieThreadId || providedThreadId || randomUUID();

  // If client didn't send the cookie, set it so future requests reuse the same threadId.
  if (!cookieThreadId) {
    res.cookie('threadId', threadId, { httpOnly: true, sameSite: 'lax' });
    if (providedThreadId && providedThreadId !== threadId) {
      console.log(`[api] no cookie present — using provided threadId and setting cookie: ${threadId}`);
    } else {
      console.log(`[api] no cookie present — generated and set threadId=${threadId}`);
    }
  } else if (providedThreadId && providedThreadId !== cookieThreadId) {
    // Prefer cookie-stored threadId when it conflicts with body.
    console.log(`[api] provided threadId (${providedThreadId}) differs from cookie threadId (${cookieThreadId}); using cookie value`);
    threadId = cookieThreadId;
  }
  try {
    const agent = mastra.getAgent('asoAuditAgent');
    const state = threadId ? (threadState.get(threadId) ?? {}) : {};
    const normalizedMessage = message.trim();
    const appStoreUrlMatch = normalizedMessage.match(/https?:\/\/[\S]+/i);
    const detectedAppStoreUrl = appStoreUrlMatch?.[0];
    const isConfirmation = state.lastAppStoreUrl
      ? await isConfirmationMessage(agent, normalizedMessage, state.lastAppStoreUrl)
      : false;

    if (detectedAppStoreUrl && threadId) {
      threadState.set(threadId, {
        ...state,
        lastAppStoreUrl: detectedAppStoreUrl,
      });
    }

    const prompt =
      isConfirmation && state.lastAppStoreUrl
        ? buildFinalAuditPrompt(state.lastAppStoreUrl)
        : normalizedMessage;

    console.log('[api] invoking asoAuditAgent.generate(...)');
    const response = await agent.generate(prompt, {
      memory: isConfirmation ? undefined : threadId ? { thread: threadId } : undefined,
    });

    // console.log('[api] raw agent response:', util.inspect(response, { depth: 4 }));

    let replyText = response?.text;

    if (isConfirmation && state.lastAppStoreUrl && isStillAskingForConfirmation(replyText)) {
      console.log('[api] retrying asoAuditAgent.generate(...) in strict audit mode');
      const retryResponse = await agent.generate(buildFinalAuditPrompt(state.lastAppStoreUrl), {
        memory: undefined,
      });
      // console.log('[api] raw retry agent response:', util.inspect(retryResponse, { depth: 4 }));
      replyText = retryResponse?.text;
    }

    if (detectedAppStoreUrl && threadId && !isConfirmation) {
      threadState.set(threadId, {
        ...state,
        lastAppStoreUrl: detectedAppStoreUrl,
      });
    }

    console.log('[api] asoAuditAgent.generate(...) completed');
    
    return res.json({ reply: replyText, threadId });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Chatbot Server running on http://localhost:${PORT}`);
});
