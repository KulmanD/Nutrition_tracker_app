# Nutrition Tracker

A full stack web application for documenting meals and tracking daily nutrition.
A user can add a meal by hand or by uploading a photo of the meal. When a photo is
uploaded, the backend runs an AI image-analysis step that detects the foods and
estimates their nutrition. The user reviews and edits the detected items and then
saves the meal. The dashboard shows the day's totals and updates live over
WebSockets whenever a meal is saved.

## Tech stack

- Frontend: React, React Router, Fetch API, Socket.IO client.
- Backend: Node.js, Express, Socket.IO.
- Database: MySQL accessed through the Sequelize ORM.
- AI: image-based food and nutrition analysis through the backend.

## Ports

- backend and Socket.IO: http://localhost:3000
- frontend: http://localhost:5173

## Project structure

The backend lives at the repository root and the React app lives in
`nutrition_frontend/`. This is the root-backend equivalent of the assignment's
`backend/` and `frontend/` layout: the ORM models live in `models/orm/` and the
schema files live in the root `migrations/` folder, which correspond to the
requested `backend/models/` and `backend/migrations/`.

```text
Nutrition_tracker_app/
  server.js                 backend entry, REST and Socket.IO on port 3000
  routes/                   Express routers (auth, users, settings, meals, ai, dashboard)
  controllers/              request handlers
  repositories/             database access used by the controllers
  models/orm/               Sequelize models (User, Admin, Food, Meal, MealItem, UserSetting)
  migrations/               SQL schema files
  scripts/                  database migrate and seed scripts
  realtime/                 Socket.IO server setup
  services/                 AI image-analysis service
  middleware/               cors, logger, authorize, error handling
  utils/                    helpers (response envelope, local date helper)
  uploads/                  uploaded meal images (git ignored)
  docs/                     documentation, API contract, Postman collection, screenshots
  nutrition_frontend/       React application (src/components, src/pages, src/services)
```

## Prerequisites

- Node.js with npm
- a local MySQL server

On macOS, MySQL can be installed and started with Homebrew:

```bash
brew install mysql
brew services start mysql
```

## Installation and running

### Backend

From the project root, install dependencies, create the `.env` file, set up the
database, and start the server:

```bash
npm install
cp .env.example .env
npm run db:setup
npm start
```

The server should print:

```text
server running at http://localhost:3000
```

### Frontend

In a second terminal:

```bash
cd nutrition_frontend
npm install
npm start
```

The frontend runs on http://localhost:5173 and calls the backend on port 3000.

## Environment variables

### Backend

Backend variables are read from `.env` at the repository root. Copy `.env.example`
to `.env` and update the MySQL credentials.

Required database variables:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_LOGGING`

AI variables:

- `AI_MODE=mock`
- `AI_PROVIDER=gemini`
- `GEMINI_API_KEY=`
- `GEMINI_IMAGE_MODEL=gemini-3.5-flash`

`GEMINI_IMAGE_MODEL` is configurable. The default is `gemini-3.5-flash`, which was
tested with Gemini `generateContent`, but if Google changes model availability or
your API key does not support that model, set `GEMINI_IMAGE_MODEL` to another
Gemini model that supports image input.

With `AI_MODE=mock` or no Gemini key, the backend returns a deterministic mock
analysis. With a Gemini key and a non-mock mode, it calls:

```text
https://generativelanguage.googleapis.com/v1beta/models/<GEMINI_IMAGE_MODEL>:generateContent
```

### Frontend

Frontend variables are read from `nutrition_frontend/.env`. Copy
`nutrition_frontend/.env.example` to `nutrition_frontend/.env`. Create React App
only exposes variables that start with `REACT_APP_`, and the dev server must be
restarted after changing them.

- `REACT_APP_API_BASE_URL`: backend base URL, defaults to http://localhost:3000
- `REACT_APP_USE_MOCKS`: set to `true` to make the frontend AI calls return local
  fixtures instead of calling the backend, or `false` to use the real backend

The `.env` files are git ignored and are not committed. Only the `.env.example`
templates are tracked, and they hold placeholders, not real secrets.

## Database and ORM

The application uses MySQL through the Sequelize ORM, and data persists across
server restarts.

Models in `models/orm/`:

- `User`
- `Admin`
- `Food`
- `Meal`
- `MealItem` (junction table between meals and foods)
- `UserSetting`

Relationships:

- one-to-many: a user has many meals, and each meal belongs to a user
- many-to-many: a meal has many foods and a food belongs to many meals, joined
  through the `MealItem` junction table
- one-to-one: a user has one admin profile, and an admin belongs to a user

Database scripts:

- `npm run db:migrate` applies the SQL schema files in `migrations/`
- `npm run db:seed` inserts demo users, an admin profile, foods, and one meal
  dated with the local current date
- `npm run db:setup` runs both

The dashboard reads meals together with their meal items and foods through an ORM
include, which produces the JOIN used to calculate the daily totals.

## API endpoints

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

- `GET /meals` (optional `userId` and `date` query parameters)
- `GET /meals/:id`
- `POST /meals`
- `PUT /meals/:id`
- `DELETE /meals/:id`

AI:

- `POST /api/ai/analyze-image` (multipart form-data, file field `image`)
- `POST /api/meals/from-ai` (save a reviewed AI meal)

Dashboard:

- `GET /dashboard/today` (query parameter `userId`, optional `date`)

The frontend and backend contract for the AI and WebSocket features is in
`docs/API_CONTRACT.md`.

## WebSocket feature

Socket.IO runs on the same backend origin as the REST API
(http://localhost:3000). It supports these custom events:

- `presence:join` from client to server with `{ userId, fullName }`
- `presence:updated` from server to clients with `{ onlineUsers }`
- `meal:created` from server to clients after a meal is created
- `dashboard:updated` from server to clients after a meal changes today's data

The meal and dashboard events carry `userId`, and the frontend filters by the
logged-in user. With two browser tabs, adding a meal in one tab updates the other
tab's dashboard, and two different users (for example a normal window and an
incognito window) change the online count.

## AI feature

The AI feature is image-based food and nutrition analysis. The user uploads a
meal photo to `POST /api/ai/analyze-image` as `multipart/form-data` with the
required file field `image` and an optional `mealDate`. The backend accepts jpg,
jpeg, png, and webp files up to 5 MB, stores accepted images in `uploads/`, and
returns the detected foods with estimated grams and nutrition.

The user reviews and edits the detected items, then saves them with
`POST /api/meals/from-ai`, which stores the meal and its food items, sets the
owner from the `x-user-id` header, and emits the `meal:created` and
`dashboard:updated` events. The AI key stays on the backend and is never sent to
the frontend. When no key is configured, the backend returns a deterministic mock
analysis so the feature can be demonstrated offline.

## Tests

From the backend folder:

```bash
node --test tests/api.test.js
```

From the frontend folder:

```bash
cd nutrition_frontend
CI=true npm test -- --watchAll=false
npm run build
```

## Documentation

- `docs/API_CONTRACT.md`: the frontend and backend contract for the AI and
  WebSocket features.
- `docs/screenshots/`: screenshots of the running application.
- A demo video is included with the submission.

## Known limitations

- The application is configured for local development, with the backend on port
  3000 and the frontend on port 5173.
- Authentication is simulated: the active user and role come from the `x-user-id`
  and `x-user-role` request headers, and login returns a fixed session token.
- AI analysis uses Gemini when a key is configured. Without a key the backend
  returns a deterministic mock analysis, so the detected foods are the same for
  every image.
- Uploaded meal images are stored on the local server disk under `uploads/`.
- Dashboard nutrition goals use fixed default values.
- Newer endpoints are served under the `/api` prefix, while the original users,
  meals, and dashboard routes are served at the root path.
