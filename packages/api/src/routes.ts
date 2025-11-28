import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Bot } from '@ai-feedback-widget/shared';

// In-memory storage for MVP (will be replaced with database)
const bots = new Map<string, Bot>();

// Create a default bot for testing
const defaultBot: Bot = {
  id: 'default',
  name: 'Default Support Bot',
  customInstructions: `You are a helpful support assistant. When users report bugs, ask them:
- What they were trying to do
- What they expected to happen
- What actually happened
- What browser/device they're using

Be conversational, friendly, and thorough.`,
  appearance: {
    primaryColor: '#3b82f6',
    position: 'bottom-right',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

bots.set(defaultBot.id, defaultBot);

export function setupRoutes(app: Express) {
  // Get bot configuration
  app.get('/api/bots/:botId', (req, res) => {
    const { botId } = req.params;
    const bot = bots.get(botId);

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    // Don't send sensitive data to the widget
    const publicBot = {
      id: bot.id,
      name: bot.name,
      appearance: bot.appearance,
    };

    res.json(publicBot);
  });

  // Create a new bot (admin endpoint - will need auth later)
  app.post('/api/bots', (req, res) => {
    const bot: Bot = {
      id: uuidv4(),
      name: req.body.name,
      customInstructions: req.body.customInstructions || '',
      appearance: {
        primaryColor: req.body.appearance?.primaryColor || '#3b82f6',
        position: req.body.appearance?.position || 'bottom-right',
        icon: req.body.appearance?.icon,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    bots.set(bot.id, bot);
    res.status(201).json(bot);
  });

  // List all bots (admin endpoint)
  app.get('/api/bots', (req, res) => {
    res.json(Array.from(bots.values()));
  });
}
