# Nutrition Tracker

A full stack web application for documenting meals and tracking daily nutrition.
Users can add meals manually or upload a meal photo for AI-assisted food and
nutrition analysis. The dashboard shows daily totals and updates live through
WebSockets when meals change.

## Tech Stack

- Frontend: React, React Router, Fetch API, Socket.IO client.
- Backend: Node.js, Express, Socket.IO.
- Database: MySQL with Sequelize ORM models.
- AI: Gemini image analysis from the backend, with a deterministic mock fallback.

## Ports

- Backend REST API and Socket.IO: http://localhost:3000
- Frontend: http://localhost:5173

## Required Project Structure

```text
Nutrition_tracker_app/
  frontend/
    src/                    React source code
    public/                 static frontend assets
    package.json
    .env.example            frontend environment template
  backend/
    src/                    Node.js and Express source code
    models/                 Sequelize ORM models and mappings
    migrations/             SQL schema and migration files
    package.json
    .env.example            backend environment template
  docs/
    API_CONTRACT.md         frontend/backend API contract notes
  postman/
    NutritionTracker_A4.postman_collection.json
  screenshots/
    api/                    API and Postman screenshots
    frontend/               UI screenshots
  README.md
  .env.example              root copy of the backend environment template
```

## Prerequisites

- Node.js with npm
- A local MySQL server

On macOS with Homebrew:

```bash
brew install mysql
brew services start mysql
```

## Backend Setup

Run the backend from the `backend/` folder:

```bash
cd backend
npm install
cp .env.example .env
npm run db:setup
npm start
```

The default `backend/.env` assumes MySQL user `root` with an empty password. If
`npm run db:setup` fails with `Access denied`, test your local MySQL login:

```bash
mysql -u root
mysql -u root -p
```

If the second command is the one that works, put that password in
`backend/.env` as `DB_PASSWORD=your_password`.

The server should print:

```text
server running at http://localhost:3000
```

Backend scripts:

- `npm run db:migrate` applies SQL files from `backend/migrations/`
- `npm run db:seed` inserts demo users, foods, settings, and meals
- `npm run db:setup` runs migration and seed
- `npm run test:api` runs the backend API contract tests
- `npm run test:a4` runs setup, API tests, A4 coverage tests, and smoke checks
- `npm run smoke:backend` starts the backend and checks the root response envelope

## Frontend Setup

Run the frontend from the `frontend/` folder in a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

The frontend runs on http://localhost:5173 and calls the backend on port 3000 by
default.

Frontend scripts:

- `npm start` starts the React development server on port 5173
- `npm run build` creates a production build
- `CI=true npm test -- --watchAll=false` runs the React test suite once

## Environment Variables

Do not commit real `.env` files. Only `.env.example` templates are tracked.

Backend variables are read from `backend/.env`. Copy `backend/.env.example` to
`backend/.env`. The default MySQL password is empty for easier first run on a
fresh local install. If your MySQL user requires a password, update
`DB_PASSWORD` after checking the login with `mysql -u root -p`.

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_LOGGING`
- `AI_MODE`
- `AI_PROVIDER`
- `GEMINI_API_KEY`
- `GEMINI_IMAGE_MODEL`

With `AI_MODE=mock` or no Gemini key, image analysis returns deterministic mock
data. To use real Gemini analysis, keep `AI_MODE=real` and paste a real key only
in local `backend/.env`:

```env
AI_MODE=real
AI_PROVIDER=gemini
GEMINI_API_KEY=your_real_gemini_api_key_here
GEMINI_IMAGE_MODEL=gemini-3.5-flash
```

With a Gemini key and non-mock mode, the backend calls:

```text
https://generativelanguage.googleapis.com/v1beta/models/<GEMINI_IMAGE_MODEL>:generateContent
```

Frontend variables are read from `frontend/.env`:

- `REACT_APP_API_BASE_URL`, defaults to `http://localhost:3000`
- `REACT_APP_USE_MOCKS`, set to `true` only when the frontend should bypass the
  backend AI call and use local fixtures

## Demo Login

- `denis@example.com` / `password123`
- `yael@example.com` / `password123`
- `amit@example.com` / `password123`

## Database And ORM

The application uses MySQL through Sequelize, and data persists across backend
restarts.

Models in `backend/models/orm/`:

- `User`
- `Admin`
- `Food`
- `Meal`
- `MealItem`
- `UserSetting`

Relationships:

- One-to-many: a user has many meals, and each meal belongs to a user
- Many-to-many: meals and foods are joined through `MealItem`
- One-to-one: a user has one admin profile, and a user has one settings row

Schema files are in `backend/migrations/`.

## API Overview

All responses use the standard envelope:

```json
{ "success": true, "data": {}, "error": null }
```

```json
{ "success": false, "data": null, "error": { "code": "", "message": "", "details": {} } }
```

Authentication and current user:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/users/me`

Settings:

- `GET /api/settings`
- `PUT /api/settings`

Users:

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

Meals:

- `GET /meals`
- `GET /meals/:id`
- `POST /meals`
- `PUT /meals/:id`
- `DELETE /meals/:id`

AI:

- `POST /api/ai/analyze-image`
- `POST /api/meals/from-ai`

Dashboard:

- `GET /dashboard/today`

More details are documented in `docs/API_CONTRACT.md` and in the Postman
collection at `postman/NutritionTracker_A4.postman_collection.json`.

## WebSockets

Socket.IO runs on the backend origin and supports:

- `presence:join`
- `presence:updated`
- `meal:created`
- `dashboard:updated`

Opening the app in two browser sessions demonstrates live user presence and
dashboard updates after meal changes.

## AI Feature

The meal image endpoint accepts jpg, jpeg, png, and webp files up to 5 MB through
multipart form-data field `image`. Accepted images are stored under
`backend/uploads/`, which is git ignored.

The backend keeps the Gemini API key server-side. If Gemini is unavailable or no
key is configured, the endpoint falls back to deterministic mock data so the
upload and review workflow remains demonstrable.

## Submission Artifacts

- Postman collection: `postman/NutritionTracker_A4.postman_collection.json`
- API contract: `docs/API_CONTRACT.md`
- Screenshots: `screenshots/`
- Demo video: include separately with the Moodle submission if it is not inside
  the ZIP

Do not submit `node_modules`, real API keys, real passwords, or `.env` files.

## Known Limitations

- Authentication is simulated for the assignment. The active user and role are
  carried by headers, and login returns a fixed session token.
- Newer Assignment 4 endpoints use the `/api` prefix; original Assignment 3
  users, meals, and dashboard endpoints remain at their original paths.
- Uploaded files are stored on the local backend disk.
- Dashboard nutrition goals use fixed defaults.
