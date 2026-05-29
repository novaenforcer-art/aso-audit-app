import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { asoAuditAgent } from './agents/aso-audit-agent.js';

export const mastra = new Mastra({
  agents: { asoAuditAgent },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
