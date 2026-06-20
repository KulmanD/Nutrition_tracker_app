# nutrition tracker

backend and frontend project for the nutrition tracker assignment.

## ports

- backend: http://localhost:3000
- frontend: http://localhost:5173

## run backend

```bash
npm install
npm start
```

## run frontend

```bash
cd nutrition_frontend
npm install
npm start
```

## tests

from the backend folder:

```bash
node --test tests/api.test.js
```

from the frontend folder:

```bash
cd nutrition_frontend
CI=true npm test -- --watchAll=false
npm run build
```

## assignment 4 database foundation

This repository still keeps the backend at the project root and the React app in
`nutrition_frontend/`. For Assignment 4, the ORM models live in `models/orm/`
and the schema files live in root `migrations/`; this is the root-backend
equivalent of the requested `backend/models/` and `backend/migrations/`
structure.

The Assignment 4 database layer now backs the main user, meal, settings, auth,
and dashboard routes. The legacy mock data files are still present in the repo,
but the active controllers use the ORM repositories for CRUD and dashboard
queries.

### database env

Copy `.env.example` to `.env` and update the MySQL credentials:

```bash
cp .env.example .env
```

Required variables:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_LOGGING`

### database scripts

Run migrations:

```bash
npm run db:migrate
```

Seed demo users, one admin profile, foods, and one meal dated with the local
current date:

```bash
npm run db:seed
```

Run both:

```bash
npm run db:setup
```

## assignment 4 websocket events

Socket.IO runs on the same backend origin as the REST API:

```text
http://localhost:3000
```

The server supports these Assignment 4 events:

- `presence:join` from client to server with `{ userId, fullName }`
- `presence:updated` from server to clients with `{ onlineUsers }`
- `meal:created` from server to clients after a meal is created
- `dashboard:updated` from server to clients after a meal changes today's dashboard data

The meal/dashboard events include `userId` so the frontend can ignore events for
other users.

## assignment 4 ai image analysis

The backend exposes the Assignment 4 image-analysis endpoint at:

```text
POST /api/ai/analyze-image
```

Send `multipart/form-data` with required file field `image` and optional
`mealDate`. The backend accepts `jpg`, `jpeg`, `png`, and `webp` files up to
5 MB, stores accepted images in `uploads/`, and returns the standard API
envelope.

AI environment variables:

- `AI_MODE=mock`
- `AI_PROVIDER=gemini`
- `GEMINI_API_KEY=`
- `GEMINI_IMAGE_MODEL=gemini-3.5-flash`

`GEMINI_IMAGE_MODEL` is configurable. The default is `gemini-3.5-flash`,
which was tested with Gemini `generateContent`, but if Google changes model
availability or your API key does not support that model, set
`GEMINI_IMAGE_MODEL` to another Gemini model that supports image input.

With `AI_MODE=mock` or no Gemini key, the endpoint returns a deterministic mock
analysis. With a Gemini key and non-mock mode, it calls:

```text
https://generativelanguage.googleapis.com/v1beta/models/<GEMINI_IMAGE_MODEL>:generateContent
```
