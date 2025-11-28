# Admin Dashboard

A distinctive, modernist admin dashboard for managing AI Feedback Widgets.

## Design Philosophy

This dashboard breaks away from typical SaaS aesthetics with:

### Typography
- **Crimson Pro** (serif) - Bold, editorial-style headlines
- **JetBrains Mono** - Technical data and code snippets
- **Manrope** - Clean, geometric UI elements

### Color Palette
- **Ink** (#0a0e1a) - Deep background
- **Slate** (#1a1d29) - Surface elements
- **Cyan** (#00e5ff) - Primary electric accent
- **Lime** (#a3ff12) - Success states
- **Coral** (#ff6b6b) - Alerts and warnings

### Visual Elements
- Animated gradient mesh backgrounds
- Geometric grid patterns
- Hover glow effects
- Staggered entrance animations
- High-contrast, editor-inspired theme

## Features

- 📊 **Dashboard** - Stats overview with animated cards
- 🤖 **Bot Management** - Create and configure feedback widgets
- 💬 **Conversations** - Browse and analyze user interactions
- 🎨 **Customization** - Per-bot theming and behavior
- 🔗 **Integrations** - Notion database connections (coming soon)

## Development

```bash
# Install dependencies
npm install

# Run dev server (port 3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with font loading
│   ├── globals.css         # Global styles and design system
│   ├── page.tsx            # Dashboard home
│   ├── bots/
│   │   ├── page.tsx        # Bots list
│   │   └── [id]/
│   │       └── page.tsx    # Bot configuration
│   └── conversations/
│       └── page.tsx        # Conversations viewer
└── components/
    ├── Stats.tsx           # Animated stat cards
    ├── QuickActions.tsx    # Action shortcuts
    └── RecentConversations.tsx  # Conversation list

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Google Fonts** - Custom typography

## Design System

The design system is defined in `globals.css` with reusable component classes:

### Components
- `.card` - Content containers with hover effects
- `.btn` - Button variants (primary, secondary, ghost)
- `.input` / `.textarea` - Form inputs
- `.badge` - Status indicators

### Utilities
- `.mesh-gradient` - Atmospheric background
- `.grid-pattern` - Animated grid overlay
- `.text-gradient` - Gradient text effect

## Pages

### Dashboard (`/`)
Overview with:
- Key metrics (conversations, bugs, feedback, response time)
- Quick action shortcuts
- Recent conversation feed

### Bots (`/bots`)
- Grid view of all bots
- Per-bot status indicators
- Create new bot action

### Bot Config (`/bots/[id]`)
Configure:
- Bot name and instructions
- Primary color and position
- Notion integration
- Embed code snippet

### Conversations (`/conversations`)
- Filterable conversation list
- Detailed conversation viewer
- Metadata and analytics

## Customization

Colors are defined as CSS custom properties in `tailwind.config.ts`. To change the theme:

```typescript
colors: {
  'ink': '#0a0e1a',      // Background
  'cyan': '#00e5ff',     // Primary accent
  'lime': '#a3ff12',     // Success
  'coral': '#ff6b6b',    // Warning
  // ...
}
```

## Performance

- Staggered animations prevent layout shift
- Framer Motion optimizes for 60fps
- Static fonts loaded with `next/font`
- Minimal client-side JavaScript

## Future Enhancements

- [ ] Real-time updates via WebSocket
- [ ] Advanced conversation analytics
- [ ] Multi-user authentication
- [ ] Custom CSS theme editor
- [ ] Export conversation transcripts
- [ ] Integration marketplace
