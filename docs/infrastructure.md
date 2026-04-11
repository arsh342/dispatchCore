# dispatchCore — Infrastructure Patterns

> Foundational conventions and patterns that every developer must follow. These are not features — they are engineering standards that ensure the codebase stays maintainable, debuggable, and resilient under load.

---

## 1. Environment Configuration

### `.env` Structure
```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=dispatch_core
DB_USER=root
DB_PASS=

# WebSocket
WS_CORS_ORIGIN=http://localhost:5173

# Map Tiles
MAPTILER_API_KEY=

# Deployment
FRONTEND_URL=http://localhost:5173

# JWT
JWT_ACCESS_SECRET=change-me-access-secret-at-least-32-chars
JWT_REFRESH_SECRET=change-me-refresh-secret-at-least-32-chars
```

### Startup Validation
Validate all required env vars on server boot using `Joi`. If any are missing, crash immediately with a clear message.

```javascript
// config/env.js
const Joi = require('joi');

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  PORT: Joi.number().default(5000),
  DB_HOST: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  // ... all required vars
}).unknown();

const { error, value } = schema.validate(process.env);
if (error) {
  console.error('Config validation error:', error.message);
  process.exit(1);
}
```

---

## 2. Standardized API Response Envelope

Every API response must follow this shape:

```javascript
// Success
{
  "success": true,
  "data": { /* payload */ },
  "meta": { "page": 1, "total": 50 }  // optional
}

// Error
{
  "success": false,
  "error": {
    "code": "ORDER_ALREADY_ASSIGNED",
    "message": "This order has already been assigned to another driver.",
    "status": 409
  }
}
```

### Response Helper
```javascript
// utils/response.js
exports.success = (res, data, meta = null, status = 200) => {
  return res.status(status).json({ success: true, data, meta });
};

exports.error = (res, code, message, status = 400) => {
  return res.status(status).json({
    success: false,
    error: { code, message, status }
  });
};
```

---

## 3. Centralized Error Handling

One global error middleware catches all unhandled errors:

```javascript
// middlewares/errorHandler.js
module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Something went wrong';

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  return res.status(status).json({
    success: false,
    error: { code, message, status }
  });
};
```

### Custom Error Classes
```javascript
// utils/errors.js
class AppError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}
```

---

## 4. Input Validation

All request bodies are validated before reaching the service layer. Six validator files cover all endpoints:

| Validator | Endpoints Covered |
|---|---|
| `authValidator.js` | Login |
| `orderValidator.js` | Create order, list order, assign order, get order |
| `bidValidator.js` | Place bid |
| `driverValidator.js` | Create driver, signup, verify, update, password, vehicle, register route, find nearby |
| `locationValidator.js` | GPS ping, public tracking |
| `superadminValidator.js` | Update settings |

### Example Validator
```javascript
// validators/orderValidator.js
const { body, param } = require('express-validator');

exports.createOrder = [
  body('pickup_lat').isFloat({ min: -90, max: 90 }),
  body('pickup_lng').isFloat({ min: -180, max: 180 }),
  body('delivery_lat').isFloat({ min: -90, max: 90 }),
  body('delivery_lng').isFloat({ min: -180, max: 180 }),
  body('priority').isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  body('weight_kg').optional().isFloat({ min: 0 }),
];
```

### Validation Middleware
```javascript
// middlewares/validate.js
const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array(),
        status: 400
      }
    });
  }
  next();
};
```

---

## 5. Structured Logging

Use `Winston` with consistent log levels and request context:

```javascript
// config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});
```

### Log Levels
| Level | When to Use |
|---|---|
| `error` | Failed transactions, DB connection loss, unhandled exceptions |
| `warn` | Lock timeouts, bid on already-assigned order, rate limit hit |
| `info` | Assignment created, bid accepted, driver went online, WebSocket connect/disconnect |
| `debug` | GPS ping received, WebSocket room join, query execution time |

---

## 6. Database Conventions

### Migrations over Sync
Never use `sequelize.sync()`. Use Sequelize CLI migrations:
```bash
npx sequelize-cli migration:generate --name create-orders
npx sequelize-cli db:migrate
npx sequelize-cli db:migrate:undo  # rollback
```

### Connection Pool Configuration
```javascript
// config/database.js (via models/index.js)
pool: {
  min: 2,
  max: 10,
  acquire: 30000,  // ms to wait for connection
  idle: 10000      // ms before releasing idle connection
}
```

### Naming Conventions
| Entity | Convention | Example |
|---|---|---|
| Table names | snake_case, plural | `driver_location_logs` |
| Column names | snake_case | `company_id`, `created_at` |
| Foreign keys | `{referenced_table_singular}_id` | `driver_id`, `order_id` |
| Indexes | `idx_{table}_{columns}` | `idx_orders_company_status` |
| Model global settings | `timestamps: true, underscored: true` | Auto `created_at`, `updated_at` |

---

## 7. CORS & Security

```javascript
// config/cors.js
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id', 'x-driver-id'],
};
```

`Authorization` is required for bearer-token fallback. Legacy `x-company-id` and `x-driver-id` are still accepted for backward compatibility on non-authenticated flows.

### Security Headers
Helmet.js is applied globally for XSS, clickjacking, and MIME-sniff protection.

### Rate Limiting
```javascript
// middlewares/rateLimiter.js
// Standard API: 100 requests per 15 minutes
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// GPS pings: 20 per minute (1 every 3 seconds)
exports.locationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});
```

---

## 8. Tenant Resolution

All company-scoped endpoints pass through `tenantResolver` middleware:

```javascript
// middlewares/tenantResolver.js
// Resolves company context from req.identity (normalized identity)
// req.identity is populated by requestIdentity middleware, prioritizing trusted JWT claims
// over client-supplied headers.
// Sets req.tenantId for downstream use.
// All Order/Assignment/Company queries filter by req.tenantId.
```

### Identity Model (Current)
Authentication is JWT-based with cookie-first transport and bearer fallback:

| Source | Purpose | Notes |
|---|---|---|
| `accessToken` (HttpOnly cookie) | Primary authenticated identity | Preferred in both local and production environments |
| `Authorization: Bearer <token>` | Fallback identity transport | Used when third-party cookies are blocked |
| `x-company-id` / `x-driver-id` | Legacy identity hints | Used only when trusted auth context is absent |

---

## 9. Frontend API Client

### HTTP Client
```typescript
// lib/api.ts
// Wraps fetch() with automatic:
// - Base URL injection (VITE_API_URL)
// - JSON content-type headers
// - credentials: 'include' for auth cookies
// - Authorization bearer fallback from stored access token
// - Response unwrapping (extracts data from { success, data, meta } envelope)
// - Error handling
```

### Data Fetching Pattern
Services are role-scoped with TypeScript interfaces:
```typescript
// services/driver/dashboard.ts
export async function fetchDriverStats(): Promise<DriverStats> { ... }
export async function fetchActiveDeliveries(): Promise<ActiveDelivery[]> { ... }
export async function fetchCompletedDeliveries(): Promise<ActiveDelivery[]> { ... }
export async function fetchEarningsChart(): Promise<EarningsChart[]> { ... }
```

Custom hooks compose services into reactive state:
```typescript
// hooks/driver/useDashboard.ts
export function useDriverStats() { ... }
export function useActiveDeliveries() { ... }
export function useCompletedDeliveries() { ... }
```

### Dashboard Auto-Refresh
Driver dashboards poll for data updates every 30 seconds to stay in sync with dispatcher-side changes:
```typescript
useEffect(() => {
  // Initial load
  load();
  // Auto-refresh every 30s
  const interval = setInterval(() => refresh(), 30_000);
  return () => clearInterval(interval);
}, []);
```

---

## 10. Health Check & Graceful Shutdown

### Health Endpoint
```
GET /api/health → { status: 'healthy', uptime, database: 'connected', timestamp }
```

### Graceful Shutdown
```javascript
// server.js
const shutdown = async (signal) => {
  // 1. Stop accepting new HTTP connections
  // 2. Close WebSocket connections
  // 3. Close database pool
  // 4. Exit
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

---

## 11. WebSocket Safety

### Room Management
Single socket handler file (`sockets/index.js`) manages all room joins:

| Event | Room Created |
|---|---|
| `join:company` | `company:{id}:dispatchers` |
| `join:marketplace` | `company:{id}:marketplace` |
| `join:driver` | `driver:{id}` |
| `join:tracking` | `order:{id}:tracking` |
| `join:messages` | `order:{id}:chat:{channel}` |

### GPS via WebSocket
High-frequency GPS pings are sent directly over WebSocket (`location:ping` event) as an alternative to the REST endpoint, reducing HTTP overhead.

### Reconnection & Heartbeat
- Client auto-reconnects with exponential backoff
- Server detects stale sockets via `pingTimeout` (20 seconds)
- On reconnect, client re-joins all previous rooms

---

## 12. Frontend Conventions

### Styling
- **Tailwind CSS v4** — utility-first CSS
- **CSS Custom Properties** — theme tokens (light/dark/system via `useTheme` hook; default: `system`)
- **No inline styles** — all styling through Tailwind classes
- **Settings pages** — use the shared settings layout and theme system. Current settings screens may still use some role-specific accent colors while the visual language is being standardized.
- **Dashboard pages** — may use role-specific accent colors for role branding

### Animations
- **Framer Motion** — page transitions via `<PageTransition>` wrapper
- **AnimatePresence** — exit animations on route changes
- **CSS transitions** — hover effects, micro-interactions

### Currency & Formatting
- All monetary values displayed in Indian Rupees (₹) via `formatINR()` in `lib/currency.ts`
- Distances calculated via Haversine formula in `lib/geo.ts`

### Component Patterns
- Sidebars are role-specific: `sidebar.tsx`, `driver-sidebar.tsx`, `employed-driver-sidebar.tsx`, `superadmin-sidebar.tsx`
- Theme toggle has been removed from sidebars; only `DriverSidebar` accepts an optional `userName` prop; the other three accept no props
- Pages are self-contained with their own data fetching via `useEffect`
- Loading states use `<LoadingPackage />` animated component
- Empty states use `<EmptyState />` component with icons

---

## 13. Git Workflow

### Branch Strategy
```
main          ← production-ready code
└── develop   ← integration branch
    ├── feature/order-crud
    ├── feature/bidding-engine
    ├── feature/websocket-rooms
    └── fix/assignment-race-condition
```

### Commit Format (Conventional Commits)
```
feat: add order creation endpoint
fix: prevent double assignment with serializable lock
docs: update API reference with bid endpoints
refactor: extract validation into middleware
```

### `.env.example`
Committed to repo (no secrets). Every new developer copies it:
```bash
cp .env.example .env
# Then fill in local values
```
