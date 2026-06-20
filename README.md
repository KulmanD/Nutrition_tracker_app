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
