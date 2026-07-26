# AI Model Arena — Backend

Production-ready Node.js backend for an AI Model Comparison Platform.

## Stack

- Node.js + Express.js + TypeScript
- PostgreSQL + Prisma ORM
- Zod, Axios, dotenv, cors, helmet, morgan

## Project structure

```
src/
  config/        # Environment and Prisma client
  controllers/   # HTTP request handlers
  routes/        # Route definitions
  services/      # Business logic
  middleware/    # Error handling, validation, etc.
  validators/    # Zod request schemas
  types/         # Shared TypeScript types
  utils/         # Helpers (asyncHandler, AppError)
prisma/          # Prisma schema and migrations
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Update `DATABASE_URL` and other values in `.env`.

### 3. Generate Prisma client

```bash
npm run prisma:generate
```

### 4. Run in development

```bash
npm run dev
```

### 5. Build and run production

```bash
npm run build
npm start
```

## API

### Health check

```http
GET /health
```

```json
{ "status": "ok" }
```

### Chat (n8n)

```http
POST /api/chat
Content-Type: application/json

{
  "prompt": "Explain Artificial Intelligence"
}
```

```json
{
  "success": true,
  "data": {}
}
```

`data` contains the JSON body returned by the n8n webhook.
Webhook selection is automatic:

| `NODE_ENV` | Webhook | Env var |
|------------|---------|---------|
| `development` | Test | `N8N_TEST_WEBHOOK_URL` |
| anything else | Production | `N8N_PRODUCTION_WEBHOOK_URL` |

Legacy `N8N_WEBHOOK_URL` is still accepted as a fallback if the new vars are unset.

If n8n is unreachable, the API responds with HTTP 500 and
`{ "success": false, "message": "Unable to connect to AI Engine" }`.


## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run Prisma migrations |
