/**
 * Express Application Setup
 *
 * Assembles all middleware, routes, and the global error handler.
 * Exported as a standalone module so server.js can attach Socket.io.
 */

const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { sequelize } = require('./models');
const corsMiddleware = require('./config/cors');
const { apiLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');
const requestIdentity = require('./middlewares/requestIdentity');
const { authMiddleware } = require('./middlewares/authMiddleware');
const maintenanceMode = require('./middlewares/maintenanceMode');
const routes = require('./routes');
const logger = require('./config/logger');

const app = express();

// ── Security ──
app.use(helmet());

// ── HTTP Request Logging ──
app.use((req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        logger.info(
            {
                method: req.method,
                path: req.originalUrl,
                statusCode: res.statusCode,
                durationMs: Number(durationMs.toFixed(2)),
                ip: req.ip,
            },
            'HTTP request',
        );
    });

    next();
});

// ── Body Parsers ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── CORS ──
app.use(corsMiddleware);

const PUBLIC_API_RULES = [
    { method: 'GET', pattern: /^\/api\/health\/?$/ },
    { method: 'POST', pattern: /^\/api\/auth\/login\/?$/ },
    { method: 'POST', pattern: /^\/api\/auth\/refresh\/?$/ },
    { method: 'POST', pattern: /^\/api\/auth\/logout\/?$/ },
    { method: 'POST', pattern: /^\/api\/companies\/?$/ },
    { method: 'POST', pattern: /^\/api\/companies\/login\/?$/ },
    { method: 'POST', pattern: /^\/api\/drivers\/signup\/?$/ },
    { method: 'GET', pattern: /^\/api\/location\/track\/[^/]+\/?$/ },
];

function isPublicApiRequest(req) {
    if (req.method === 'OPTIONS') {
        return true;
    }

    return PUBLIC_API_RULES.some(
        (rule) => req.method === rule.method && rule.pattern.test(req.originalUrl.split('?')[0]),
    );
}

// ── Root Status Page ──
app.get('/', async (req, res) => {
        let databaseConnected = false;
        try {
                await sequelize.authenticate();
                databaseConnected = true;
        } catch {
                databaseConnected = false;
        }

        const dbLabel = databaseConnected ? 'Connected' : 'Disconnected';
        const dbColor = databaseConnected ? '#22c55e' : '#ef4444';
        const statusCode = databaseConnected ? 200 : 503;
        const faviconDotColor = databaseConnected ? '%2322c55e' : '%23ef4444';
        const uptimeSeconds = Math.floor(process.uptime());
        const uptimeMinutes = Math.floor(uptimeSeconds / 60);

        res.type('html');
        res.set('Content-Security-Policy', "default-src 'self' 'unsafe-inline'");
        res.status(statusCode).send(`<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>dispatchCore Backend Status</title>
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%231c1a1a'/%3E%3Ccircle cx='32' cy='32' r='16' fill='${faviconDotColor}'/%3E%3C/svg%3E" />
        <style>
            :root {
                --background: #1c1a1a;
                --foreground: #e7e5e4;
                --muted-foreground: #78716c;
                --border: #222018;
                --primary: #fb923c;
                --card: #191717;
                --ok: #22c55e;
                --bad: #ef4444;
            }

            * { box-sizing: border-box; }

            body {
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                color: var(--foreground);
                font-family: Rajdhani, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif;
                background:
                    radial-gradient(circle at 20% 20%, rgba(92, 45, 14, 0.25), transparent 38%),
                    radial-gradient(circle at 78% 8%, rgba(251, 146, 60, 0.12), transparent 42%),
                    linear-gradient(180deg, #201d1b 0%, var(--background) 65%);
                overflow: hidden;
            }

            body::before {
                content: '';
                position: fixed;
                inset: 0;
                pointer-events: none;
                opacity: 0.25;
                background: radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.35) 100%);
            }

            .page {
                width: 100%;
                min-height: 100vh;
                padding: 40px 24px;
                position: relative;
                z-index: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            .content {
                width: min(980px, 100%);
            }

            .hero {
                text-align: center;
                margin-bottom: 24px;
            }

            .status-art {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 16px;
            }

            .digit {
                font-size: clamp(62px, 10vw, 96px);
                font-weight: 700;
                color: rgba(231, 229, 228, 0.82);
                letter-spacing: -0.04em;
                line-height: 1;
            }

            h1 {
                margin: 0;
                font-size: clamp(28px, 4vw, 44px);
                font-weight: 600;
                letter-spacing: -0.03em;
                color: var(--foreground);
            }

            .subtitle {
                margin: 8px auto 0;
                max-width: 640px;
                font-size: 18px;
                color: rgba(120, 113, 108, 0.92);
                line-height: 1.6;
            }

            .cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 12px;
                margin: 0 auto 16px;
            }

            .card {
                border-radius: 16px;
                border: 1px solid rgba(34, 32, 24, 0.95);
                background: rgba(20, 18, 16, 0.65);
                padding: 16px;
            }

            .label {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.09em;
                color: var(--muted-foreground);
            }

            .value {
                margin-top: 8px;
                font-size: 20px;
                font-weight: 700;
                color: var(--foreground);
            }

            .api-block {
                border-radius: 16px;
                border: 1px solid rgba(34, 32, 24, 0.95);
                background: rgba(20, 18, 16, 0.6);
                padding: 16px;
                width: 100%;
            }

            .api-title {
                margin: 0 0 8px;
                font-size: 18px;
                color: var(--foreground);
            }

            .api-list {
                margin: 0;
                padding-left: 20px;
                line-height: 1.9;
                color: #d6d3d1;
            }

            .actions {
                margin-top: 16px;
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 10px;
            }

            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                border: 1px solid rgba(231, 229, 228, 0.14);
                padding: 10px 16px;
                color: var(--foreground);
                text-decoration: none;
                font-size: 15px;
                transition: transform 0.25s ease, background-color 0.25s ease, border-color 0.25s ease;
            }

            .btn:hover {
                transform: scale(1.04);
                border-color: rgba(251, 146, 60, 0.6);
            }

            .btn-primary {
                background: var(--primary);
                color: #0c0a09;
                border-color: var(--primary);
                font-weight: 700;
            }

            .btn-secondary {
                background: rgba(28, 25, 23, 0.9);
            }

            .stamp {
                margin-top: 14px;
                font-size: 12px;
                color: var(--muted-foreground);
                text-align: center;
                font-family: "Space Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            }
        </style>
    </head>
    <body>
        <main class="page">
            <section class="content">
            <section class="hero">
                <div class="status-art">
                    <span class="digit">${String(statusCode)}</span>
                </div>
                <h1>${databaseConnected ? 'Backend ready' : 'Backend degraded'}</h1>
                <p class="subtitle">dispatchCore API status for Render deployment. This matches your frontend error-page visual language and updates in real time.</p>
            </section>

            <section class="cards">
                <article class="card">
                    <div class="label">Database</div>
                    <div class="value" style="color:${dbColor};">${dbLabel}</div>
                </article>
                <article class="card">
                    <div class="label">Environment</div>
                    <div class="value">${env.nodeEnv}</div>
                </article>
                <article class="card">
                    <div class="label">Uptime</div>
                    <div class="value">${uptimeMinutes} min</div>
                </article>
            </section>

            <div class="actions">
                <a class="btn btn-secondary" href="/api/health">Health Endpoint</a>
                <a class="btn btn-primary" href="/api">Open API Root</a>
            </div>

            <p class="stamp">Checked at ${new Date().toISOString()}</p>
            </section>
        </main>
    </body>
</html>`);
});

// ── Maintenance Mode (for controlled cutovers) ──
app.use('/api', maintenanceMode);

// ── Authentication Gate ──
app.use('/api', (req, res, next) => {
    if (isPublicApiRequest(req)) {
        return next();
    }

    return authMiddleware(req, res, next);
});

// ── Identity Context (trusted token claims on protected routes) ──
app.use('/api', requestIdentity);

// ── Rate Limiting (global) ──
app.use('/api', apiLimiter);

// ── API Routes ──
app.use('/api', routes);

// ── 404 Handler ──
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.originalUrl} not found`,
            status: 404,
        },
    });
});

// ── Global Error Handler (must be last) ──
app.use(errorHandler);

module.exports = app;
