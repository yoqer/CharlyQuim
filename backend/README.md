# TraqCode Backend API

A complete backend API for TraqCode with subscription management, usage tracking, and AI service integration.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **Database**: MongoDB (users, subscriptions, usage tracking)
- **Cache**: Redis (rate limiting, caching)
- **Payment**: Stripe (subscription management)
- **Authentication**: JWT (JSON Web Tokens)

## Features

- ✅ User authentication (register, login, JWT)
- ✅ Email verification
- ✅ Password reset
- ✅ Subscription tiers (Free, Pro, Enterprise)
- ✅ Usage tracking per service
- ✅ Rate limiting (global and per-endpoint)
- ✅ Stripe integration (checkout, webhooks, portal)
- ✅ Usage limits enforcement
- ✅ Admin dashboard capabilities

## Subscription Tiers

### Free Tier ($0/month)
- TraqAuto: 50 requests/day
- Claude: Not available
- GPT-4: Not available

### Pro Tier ($20/month)
- TraqAuto: Unlimited
- Claude: 100 requests/day
- GPT-4: 50 requests/day

### Enterprise Tier ($50/month)
- TraqAuto: Unlimited
- Claude: Unlimited
- GPT-4: Unlimited

## Project Structure

```
backend/
├── src/
│   ├── controllers/       # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── subscription.controller.ts
│   │   ├── usage.controller.ts
│   │   └── user.controller.ts
│   ├── middleware/        # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   └── usageLimit.middleware.ts
│   ├── models/            # MongoDB schemas
│   │   ├── User.ts
│   │   ├── Subscription.ts
│   │   └── Usage.ts
│   ├── routes/            # API routes
│   │   ├── auth.routes.ts
│   │   ├── subscription.routes.ts
│   │   ├── usage.routes.ts
│   │   └── user.routes.ts
│   ├── services/          # Business logic
│   │   ├── stripe.service.ts
│   │   └── email.service.ts
│   ├── utils/             # Utilities
│   │   └── logger.ts
│   ├── config/            # Configuration
│   └── index.ts           # Application entry point
├── logs/                  # Application logs
├── .env.example           # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

### Prerequisites

- Node.js 18 or higher
- MongoDB 5.0 or higher
- Redis 6.0 or higher
- Stripe account (for payments)

### Setup

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   - Database URLs (MongoDB, Redis)
   - JWT secrets
   - Stripe keys and price IDs
   - API keys for TraqAuto, Claude, OpenAI

4. **Start MongoDB and Redis**
   ```bash
   # MongoDB
   mongod

   # Redis
   redis-server
   ```

5. **Run the application**

   Development mode:
   ```bash
   npm run dev
   ```

   Build and run production:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /logout` - Logout user
- `POST /refresh-token` - Refresh JWT token
- `GET /verify-email/:token` - Verify email
- `POST /forgot-password` - Request password reset
- `POST /reset-password/:token` - Reset password
- `GET /me` - Get current user
- `PATCH /update-password` - Update password
- `PATCH /update-profile` - Update profile

### Subscriptions (`/api/v1/subscriptions`)
- `GET /current` - Get current subscription
- `GET /plans` - Get available plans
- `POST /create-checkout-session` - Create Stripe checkout
- `POST /create-portal-session` - Create customer portal
- `POST /cancel` - Cancel subscription
- `POST /resume` - Resume canceled subscription
- `POST /webhook` - Stripe webhook handler

### Usage (`/api/v1/usage`)
- `GET /stats` - Get usage statistics
- `GET /daily` - Get daily usage
- `GET /service/:service` - Get service-specific usage
- `GET /history` - Get usage history
- `GET /quota` - Get remaining quota
- `POST /api/traqauto` - Proxy TraqAuto API
- `POST /api/claude` - Proxy Claude API
- `POST /api/gpt4` - Proxy GPT-4 API

### Users (`/api/v1/users`)
- `GET /profile` - Get user profile
- `PATCH /profile` - Update profile
- `DELETE /account` - Delete account
- `GET /` - Get all users (admin)
- `GET /:userId` - Get user by ID (admin)

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `MONGODB_URI` - MongoDB connection string
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `JWT_SECRET` - Secret for signing JWT tokens
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PRICE_ID_PRO` - Stripe price ID for Pro tier
- `STRIPE_PRICE_ID_ENTERPRISE` - Stripe price ID for Enterprise tier

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run typecheck` - Type check without building

### Testing

```bash
npm test
```

## Stripe Integration

### Setup Stripe

1. Create products and prices in Stripe Dashboard
2. Copy price IDs to `.env`:
   - `STRIPE_PRICE_ID_PRO`
   - `STRIPE_PRICE_ID_ENTERPRISE`

### Webhook Setup

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:5000/api/v1/subscriptions/webhook
   ```
3. Copy webhook secret to `.env` as `STRIPE_WEBHOOK_SECRET`

### Events Handled

- `checkout.session.completed` - Subscription created
- `customer.subscription.updated` - Subscription modified
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Payment successful
- `invoice.payment_failed` - Payment failed

## Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting (Redis-backed)
- JWT authentication
- Password hashing (bcrypt)
- Input validation
- MongoDB injection protection

## Logging

Winston logger with multiple transports:
- Console (development)
- File (`logs/combined.log`)
- Error file (`logs/error.log`)

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB and Redis
3. Set strong JWT secrets
4. Configure Stripe production keys
5. Set up webhook endpoint in Stripe Dashboard
6. Enable HTTPS
7. Configure proper CORS origins

## License

MIT
