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

  // Log full error in development, sanitized in production
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

All request bodies are validated before reaching the service layer:

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

exports.listOrder = [
  param('id').isInt(),
  body('listed_price').isFloat({ min: 0.01 }),
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

module.exports = logger;
```

### Log Levels
| Level | When to Use |
|---|---|
| `error` | Failed transactions, DB connection loss, unhandled exceptions |
| `warn` | Lock timeouts, bid on already-assigned order, rate limit hit |
| `info` | Assignment created, bid accepted, driver went online |
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
// config/database.js
module.exports = {
  dialect: 'mysql',
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  pool: {
    min: 2,
    max: 10,
    acquire: 30000,  // ms to wait for connection
    idle: 10000      // ms before releasing idle connection
  }
};
```

### Naming Conventions
| Entity | Convention | Example |
|---|---|---|
| Table names | snake_case, plural | `driver_location_logs` |
| Column names | snake_case | `company_id`, `created_at` |
| Foreign keys | `{referenced_table_singular}_id` | `driver_id`, `order_id` |
| Indexes | `idx_{table}_{columns}` | `idx_orders_company_status` |

---

## 7. CORS & Security

```javascript
// config/cors.js
const cors = require('cors');

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = cors(corsOptions);
```

### Rate Limiting
```javascript
// middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Standard API: 100 requests per 15 minutes
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } }
});

// GPS pings: 20 per minute (1 every 3 seconds)
exports.locationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});
```

---

## 8. Health Check & Graceful Shutdown

### Health Endpoint
```javascript
// routes/health.js
router.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    return res.json({
      success: true,
      data: {
        status: 'healthy',
        uptime: process.uptime(),
        database: 'connected',
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    return res.status(503).json({
      success: true,
      data: { status: 'unhealthy', database: 'disconnected' }
    });
  }
});
```

### Graceful Shutdown
```javascript
// server.js
const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  
  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close WebSocket connections
  io.close(() => {
    logger.info('WebSocket server closed');
  });

  // Close database pool
  await sequelize.close();
  logger.info('Database connections closed');

  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

---

## 9. WebSocket Safety

### Connection Handshake
```javascript
// sockets/dispatchSocket.js
io.use((socket, next) => {
  const { userId, role, companyId } = socket.handshake.auth;
  
  if (!userId || !role) {
    return next(new Error('Authentication required'));
  }
  
  socket.userId = userId;
  socket.role = role;
  socket.companyId = companyId;
  next();
});
```

### Reconnection & Heartbeat
- Client auto-reconnects with exponential backoff
- Server detects stale sockets via `pingTimeout` (20 seconds)
- On reconnect, client re-joins all previous rooms

---

## 10. Git Workflow

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
