# TraqCode Backend - Complete Project Structure

## ✅ Created Files

### Configuration Files
1. ✅ `package.json` - All dependencies and scripts
2. ✅ `tsconfig.json` - TypeScript configuration
3. ✅ `.env.example` - Environment variables template
4. ✅ `README.md` - Complete documentation

### Main Application
5. ✅ `src/index.ts` - Express server with MongoDB, Redis, routes, middleware

### Models (MongoDB Schemas)
6. ✅ `src/models/User.ts` - User model with authentication
7. ✅ `src/models/Subscription.ts` - Subscription tiers and limits
8. ✅ `src/models/Usage.ts` - Usage tracking per service

### Middleware
9. ✅ `src/middleware/auth.middleware.ts` - JWT authentication, role checks
10. ✅ `src/middleware/error.middleware.ts` - Global error handling
11. ✅ `src/middleware/rateLimiter.middleware.ts` - Redis-backed rate limiting
12. ✅ `src/middleware/usageLimit.middleware.ts` - Subscription limit enforcement

### Routes
13. ✅ `src/routes/auth.routes.ts` - Authentication endpoints
14. ✅ `src/routes/subscription.routes.ts` - Subscription management
15. ✅ `src/routes/usage.routes.ts` - Usage tracking and API proxies
16. ✅ `src/routes/user.routes.ts` - User management

### Controllers
17. ✅ `src/controllers/auth.controller.ts` - Auth logic (register, login, etc.)

### Utilities
18. ✅ `src/utils/logger.ts` - Winston logger

## 📁 Complete Directory Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts ✅
│   │   ├── subscription.controller.ts (TODO)
│   │   ├── usage.controller.ts (TODO)
│   │   └── user.controller.ts (TODO)
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts ✅
│   │   ├── error.middleware.ts ✅
│   │   ├── rateLimiter.middleware.ts ✅
│   │   └── usageLimit.middleware.ts ✅
│   │
│   ├── models/
│   │   ├── User.ts ✅
│   │   ├── Subscription.ts ✅
│   │   └── Usage.ts ✅
│   │
│   ├── routes/
│   │   ├── auth.routes.ts ✅
│   │   ├── subscription.routes.ts ✅
│   │   ├── usage.routes.ts ✅
│   │   └── user.routes.ts ✅
│   │
│   ├── services/ (optional - for future)
│   │   ├── stripe.service.ts
│   │   └── email.service.ts
│   │
│   ├── utils/
│   │   └── logger.ts ✅
│   │
│   ├── config/ (optional)
│   ├── types/ (optional)
│   │
│   └── index.ts ✅ (Main entry point)
│
├── logs/ (auto-created)
│   ├── combined.log
│   └── error.log
│
├── .env.example ✅
├── .gitignore (TODO)
├── package.json ✅
├── tsconfig.json ✅
├── README.md ✅
└── PROJECT_STRUCTURE.md ✅ (this file)
```

## 🔧 Remaining Controllers to Create

You still need to create these controllers to complete the backend:

### 1. Subscription Controller
**File**: `src/controllers/subscription.controller.ts`

**Required methods**:
- `getCurrentSubscription` - Get user's current subscription
- `getPlans` - Get available subscription plans
- `createCheckoutSession` - Create Stripe checkout
- `createPortalSession` - Create Stripe customer portal
- `cancelSubscription` - Cancel active subscription
- `resumeSubscription` - Resume canceled subscription
- `handleWebhook` - Process Stripe webhooks
- `getAllSubscriptions` - Admin: Get all subscriptions
- `getUserSubscription` - Admin: Get user subscription
- `updateSubscription` - Admin: Update subscription

### 2. Usage Controller
**File**: `src/controllers/usage.controller.ts`

**Required methods**:
- `getUserStats` - Get usage statistics
- `getDailyUsage` - Get today's usage
- `getServiceUsage` - Get usage for specific service
- `getUsageHistory` - Get historical usage
- `getRemainingQuota` - Get remaining requests
- `proxyTraqAuto` - Proxy to TraqAuto API with usage tracking
- `proxyClaude` - Proxy to Claude API with usage tracking
- `proxyGPT4` - Proxy to GPT-4 API with usage tracking
- `getAllUsage` - Admin: Get all usage
- `getUserUsageById` - Admin: Get user usage
- `resetUserUsage` - Admin: Reset usage

### 3. User Controller
**File**: `src/controllers/user.controller.ts`

**Required methods**:
- `getProfile` - Get current user profile
- `updateProfile` - Update user profile
- `deleteAccount` - Delete user account
- `getAllUsers` - Admin: Get all users
- `getUserById` - Admin: Get user by ID
- `updateUser` - Admin: Update user
- `deleteUser` - Admin: Delete user

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Services
```bash
# MongoDB
mongod

# Redis
redis-server
```

### 4. Run Backend
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🔑 Key Features Implemented

### Authentication System
- ✅ User registration with email
- ✅ Login with JWT tokens
- ✅ Email verification (tokens generated)
- ✅ Password reset flow (tokens generated)
- ✅ Refresh token support
- ✅ Protected routes middleware
- ✅ Role-based access control

### Subscription Management
- ✅ Three tiers: Free, Pro, Enterprise
- ✅ Usage limits per tier
- ✅ Stripe integration ready
- ✅ Automatic free subscription on signup
- ✅ Subscription status checking

### Usage Tracking
- ✅ Track requests per service (TraqAuto, Claude, GPT-4)
- ✅ Daily usage limits
- ✅ Redis caching for performance
- ✅ Usage metadata (tokens, response time, etc.)
- ✅ Automatic TTL (90 days retention)
- ✅ Usage statistics aggregation

### Security
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Redis-backed rate limiting
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Input validation ready
- ✅ Global error handling

## 📊 Subscription Tiers

| Feature | Free | Pro ($20/mo) | Enterprise ($50/mo) |
|---------|------|--------------|---------------------|
| TraqAuto | 50/day | Unlimited | Unlimited |
| Claude | ❌ | 100/day | Unlimited |
| GPT-4 | ❌ | 50/day | Unlimited |

## 🔗 API Endpoints

### Authentication
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh-token`
- `GET /api/v1/auth/verify-email/:token`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password/:token`
- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/update-password`
- `PATCH /api/v1/auth/update-profile`

### Subscriptions
- `GET /api/v1/subscriptions/current`
- `GET /api/v1/subscriptions/plans`
- `POST /api/v1/subscriptions/create-checkout-session`
- `POST /api/v1/subscriptions/create-portal-session`
- `POST /api/v1/subscriptions/cancel`
- `POST /api/v1/subscriptions/resume`
- `POST /api/v1/subscriptions/webhook`

### Usage
- `GET /api/v1/usage/stats`
- `GET /api/v1/usage/daily`
- `GET /api/v1/usage/service/:service`
- `GET /api/v1/usage/history`
- `GET /api/v1/usage/quota`
- `POST /api/v1/usage/api/traqauto`
- `POST /api/v1/usage/api/claude`
- `POST /api/v1/usage/api/gpt4`

### Users
- `GET /api/v1/users/profile`
- `PATCH /api/v1/users/profile`
- `DELETE /api/v1/users/account`

## 📝 Next Steps

1. **Create remaining controllers**:
   - subscription.controller.ts
   - usage.controller.ts
   - user.controller.ts

2. **Add optional services**:
   - stripe.service.ts (Stripe API wrapper)
   - email.service.ts (Email sending)

3. **Testing**:
   - Write unit tests
   - Write integration tests
   - Test Stripe webhooks

4. **Deployment**:
   - Configure production environment
   - Set up CI/CD
   - Deploy to cloud (AWS, GCP, Azure, etc.)

## 💡 Usage Examples

### Register a User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Check Subscription
```bash
curl -X GET http://localhost:5000/api/v1/subscriptions/current \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🛠️ Technologies Used

- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **Redis** - Caching and rate limiting
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Stripe** - Payments
- **Winston** - Logging
- **Helmet** - Security
- **CORS** - Cross-origin requests

## 📄 License

MIT
