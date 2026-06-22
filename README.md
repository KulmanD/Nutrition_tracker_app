# Nutrition Tracker

A full stack web application for documenting meals and tracking daily nutrition.
Users can add meals manually or upload a meal photo. The backend analyzes the
photo, estimates the food items and nutrition values, and lets the user review
the result before saving it. The dashboard shows daily totals and updates live
with Socket.IO when meals change.

## Tech Stack

React, React Router, Fetch API and Socket.IO client are used in the frontend.

Node.js, Express and Socket.IO are used in the backend.

MySQL is used as the database, with Sequelize ORM models.

Gemini is used for image based food analysis when an API key is configured.
Without a key, the backend returns deterministic mock data so the upload flow can
still be tested.

## Ports

Backend API and Socket.IO: http://localhost:3000

Frontend: http://localhost:5173

## Project Structure

```text
Nutrition_tracker_app/
  frontend/
    src/                    React source code
    public/                 frontend public files
    package.json
    .env.example
  backend/
    src/                    Node.js and Express source code
    models/                 Sequelize ORM models
    migrations/             SQL schema files
    package.json
    .env.example
  docs/
    API_CONTRACT.md
  postman/
    NutritionTracker_A4.postman_collection.json
  screenshots/
    api/
    frontend/
  README.md
  .env.example
```

## Requirements

Node.js with npm is required.

MySQL server is required.

On macOS with Homebrew:

```bash
brew install mysql
brew services start mysql
```

On Windows, install MySQL Community Server from the official MySQL website.
During installation, include MySQL Server and MySQL Workbench. Keep the MySQL
username and password because they are needed in `backend/.env`.

## Backend Setup

Open a terminal from the project root:

```bash
cd backend
npm install
cp .env.example .env
npm run db:setup
npm start
```

The server should print:

```text
server running at http://localhost:3000
```

The default database user is `root` and the default password is empty. The
example file starts with `DB_PASSWORD=` for that reason.

If `npm run db:setup` shows `Access denied`, the local MySQL installation
probably uses a root password. Check the local MySQL password in MySQL Workbench
or with the MySQL terminal client. Then edit `backend/.env`, put the password in
`DB_PASSWORD`, and run `npm run db:setup` again.

## Frontend Setup

Open a second terminal from the project root:

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

Then open http://localhost:5173 in the browser.

## Environment Files

The submitted project includes example environment files only. The real local
files are created by copying the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend settings are read from `backend/.env`.

Frontend settings are read from `frontend/.env`.

The backend example file includes the database host, port, database name,
database user, database password, database logging flag, AI mode, AI provider,
Gemini API key and Gemini model name.

The frontend example file includes the backend API base URL and the frontend mock
mode flag.

For real Gemini image analysis, put the key only in local `backend/.env`:

```env
AI_MODE=real
AI_PROVIDER=gemini
GEMINI_API_KEY=your_real_gemini_api_key_here
```

If `GEMINI_API_KEY` is empty, the backend uses mock analysis data.

## Demo Login

```text
denis@example.com / test
yael@example.com / test
amit@example.com / test
```

## Database And ORM

The application stores data in the MySQL database named `nutrition_tracker`.

The Sequelize models are in `backend/models/orm/`.

The SQL schema files are in `backend/migrations/`.

Main tables:

```text
users
admins
foods
meals
meal_items
user_settings
```

The Settings page saves profile username, email and theme in the
`user_settings` table. For example, a changed profile email is stored in
`nutrition_tracker.user_settings.email`.

Relationships:

1. A user has many meals, and each meal belongs to a user.
2. A meal has many foods through `meal_items`.
3. A user has one admin profile when the user role is admin.
4. A user has one settings row.

## Main Features

Manual meal create, read, update and delete.

Daily dashboard with nutrition totals.

Settings page for profile email, username and theme.

Image upload for AI meal analysis.

Saving reviewed AI meal results into the database.

Socket.IO presence and live dashboard update events.

## API And Postman

The Postman collection is here:

```text
postman/NutritionTracker_A4.postman_collection.json
```

The frontend and backend contract for the AI and WebSocket features is here:

```text
docs/API_CONTRACT.md
```

All API responses use this envelope:

```json
{ "success": true, "data": {}, "error": null }
```

```json
{ "success": false, "data": null, "error": { "code": "", "message": "", "details": {} } }
```

Main API routes:

```text
POST /api/auth/login
POST /api/auth/logout
GET /api/users/me
GET /api/settings
PUT /api/settings
GET /users
GET /users/:id
POST /users
PUT /users/:id
DELETE /users/:id
GET /meals
GET /meals/:id
POST /meals
PUT /meals/:id
DELETE /meals/:id
POST /api/ai/analyze-image
POST /api/meals/from-ai
GET /dashboard/today
```

## WebSocket Feature

Socket.IO runs on the same backend server as the REST API. The frontend connects
after login, sends the logged in user to the server, and receives live presence
updates.

When a meal is created, the backend emits meal and dashboard update events. The
frontend uses those events to refresh the correct user dashboard.

To test this feature, open the app in two separate browser sessions, for example
one regular browser window and one private browser window.

## AI Feature

The AI feature is used from the Meals page. The user uploads a meal image, the
backend analyzes it, and the frontend shows detected foods for review.

The upload endpoint accepts the image in multipart form data using field name
`image`. If a Gemini key is configured, the backend calls Gemini. If no key is
configured, the backend returns mock analysis data.

## Useful Checks

Backend:

```bash
cd backend
npm run test:a4
```

Frontend:

```bash
cd frontend
npm run build
```

## Submission Artifacts

Postman collection:

```text
postman/NutritionTracker_A4.postman_collection.json
```

Screenshots:

```text
screenshots/
```

The screenshots should cover the database connected app, CRUD, ORM
relationships, WebSocket communication between two clients, AI input and output,
and database tables or migrations.

API contract:

```text
docs/API_CONTRACT.md
```

Demo video should be submitted with the Moodle upload.

The real `.env` files, real API keys, real passwords, `node_modules`, uploaded
images and frontend build output are not included in the submitted source.

## Known Limitations

The application is configured for local development, with the backend on port
3000 and the frontend on port 5173.

Authentication is simulated. The active user and role come from request headers
sent by the frontend, and login returns a fixed session token.

AI analysis uses Gemini when a key is configured. Without a key, the backend
returns deterministic mock analysis, so the detected foods are the same for
every image.

Uploaded meal images are stored on the local backend disk under
`backend/uploads/`.

Dashboard nutrition goals use fixed default values.

Newer endpoints are served under the `/api` prefix, while the original users,
meals and dashboard routes are served at the root path.
