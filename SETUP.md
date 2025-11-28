# Setup Guide

This guide will help you get the AI Feedback Widget running locally.

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all dependencies for all packages (shared, api, widget).

### 2. Configure the API

Create a `.env` file in `packages/api/`:

```bash
cp packages/api/.env.example packages/api/.env
```

Edit `packages/api/.env` and set your configuration:

```env
PORT=3000
NODE_ENV=development

# Database (optional for MVP - uses in-memory storage)
# DATABASE_URL=postgresql://user:password@localhost:5432/ai_feedback_widget

# OpenAI (optional for MVP - uses mock responses)
# OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Build the Shared Package

```bash
cd packages/shared
npm run build
cd ../..
```

### 4. Build the Widget

```bash
cd packages/widget
npm run build
cd ../..
```

This creates `packages/widget/dist/widget.js`.

### 5. Set Up Widget Serving

The API needs to serve the widget file. Create a symlink or copy:

```bash
mkdir -p packages/api/public
cp packages/widget/dist/widget.js packages/api/public/
```

Update `packages/api/src/index.ts` to serve static files:

```typescript
// Add this after your other middleware
app.use(express.static('public'));
```

### 6. Start the API Server

```bash
cd packages/api
npm run dev
```

The API will be running at `http://localhost:3000`.

### 7. Open the Demo

Open `demo/index.html` in your browser. You should see the chat widget button in the bottom-right corner!

## Development Workflow

### Terminal 1: Watch and rebuild widget

```bash
cd packages/widget
npm run dev
```

Then copy the built file whenever it changes:

```bash
# In another terminal
watch -n 1 cp packages/widget/dist/widget.js packages/api/public/
```

### Terminal 2: Run API with auto-reload

```bash
cd packages/api
npm run dev
```

### Terminal 3: Serve demo page

```bash
# Simple HTTP server
npx serve demo -p 8080
```

Then open `http://localhost:8080` in your browser.

## Testing the Widget

1. Click the chat button in the bottom-right
2. Select a conversation mode (Documentation / Bug Report / Feedback)
3. Type a message and press Enter or click Send
4. You should see a response from the bot

## Project Structure

```
ai-feedback-widget/
├── packages/
│   ├── shared/          # Shared TypeScript types
│   ├── widget/          # Embeddable chat widget
│   ├── api/             # Backend API + WebSocket server
│   └── admin/           # Admin dashboard (coming soon)
├── demo/                # Demo HTML page
└── README.md
```

## Next Steps

### Integrate OpenAI

1. Get an API key from [OpenAI](https://platform.openai.com/)
2. Add it to `packages/api/.env`:
   ```
   OPENAI_API_KEY=sk-...
   ```
3. Update `packages/api/src/websocket.ts` to use the OpenAI API instead of mock responses

### Set Up Database

The current implementation uses in-memory storage. To persist data:

1. Install PostgreSQL
2. Create a database:
   ```sql
   CREATE DATABASE ai_feedback_widget;
   ```
3. Update `DATABASE_URL` in `.env`
4. Create database schema (schema files coming soon)
5. Update the code to use database instead of in-memory Maps

### Add Notion Integration

1. Create a Notion integration at [Notion Integrations](https://www.notion.so/my-integrations)
2. Get your integration token
3. Share a database with your integration
4. Implement the Notion API calls in the backend

## Troubleshooting

### Widget not loading

- Check that the API is running (`http://localhost:3000/health` should return `{"status":"ok"}`)
- Check that `widget.js` is being served at `http://localhost:3000/widget.js`
- Check browser console for errors

### WebSocket connection fails

- Make sure the API is running
- Check that your browser allows WebSocket connections to `localhost`
- Look for errors in both browser console and API server logs

### CORS errors

- The API has CORS enabled for all origins in development
- If you're serving the demo from a different domain, you may need to update the CORS configuration

## Production Deployment

Coming soon: guides for deploying to:
- Vercel/Netlify (widget CDN)
- Railway/Render (API)
- PostgreSQL hosting
- Docker deployment
