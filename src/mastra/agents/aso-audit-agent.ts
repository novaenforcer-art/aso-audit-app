import { Agent } from '@mastra/core/agent';
import { fetchMetadataTool } from '../tools/fetchMetadataTool.js';
import { fetchFullListingTool } from '../tools/fetchFullListingTool.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read from the public folder so it survives the build process
const skillPath = join(__dirname, '../public/aso-audit-skill.md');
const asoAuditInstructions = fs.readFileSync(skillPath, 'utf8');

export const asoAuditAgent = new Agent({
  id: 'aso-audit-agent',
  name: 'asoAuditAgent',
  instructions: asoAuditInstructions,
  model: 'nvidia/meta/llama-3.1-70b-instruct',
  tools: { fetchMetadataTool, fetchFullListingTool },
});
