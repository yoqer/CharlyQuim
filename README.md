# AI Feedback Widget

An AI-powered conversational widget for bug reporting, feedback collection, and documentation support.

## Project Structure

- **packages/widget** - Embeddable chat widget (vanilla TypeScript)
- **packages/api** - Backend API (Node.js + Express)
- **packages/admin** - Admin dashboard (Next.js) - Coming soon
- **packages/shared** - Shared types and utilities

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Development

```bash
# Install dependencies
npm install

# Start all services in development mode
npm run dev
```

## Features

### MVP
- Embeddable chat widget with text conversation
- AI-powered conversation processing
- Notion database integration
- Basic admin dashboard for configuration

### Roadmap
- Voice support
- Screenshot capture and annotation
- Multiple integration targets (Jira, Linear, GitHub)
- Advanced theming and customization

## Architecture

The widget loads as a lightweight script in the host application and communicates with the backend API via WebSocket for real-time chat. Conversations are processed by AI to extract structured data and populate configured databases (starting with Notion).
