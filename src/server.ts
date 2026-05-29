import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { mastra } from './mastra/index.js';

import * as dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from 'public' directory
app.use(express.static(join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const agent = mastra.getAgent('asoAuditAgent');
    
    const response = await agent.generate([
      { role: 'user', content: `Can you analyze this App Store URL: ${url}` }
    ]);
    
    return res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Chatbot Server running on http://localhost:${PORT}`);
});
