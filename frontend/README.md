# Nutrition Tracker Frontend

This folder contains the React frontend for the Nutrition Tracker project.

The full project setup is explained in the root `README.md`. Use this file only
when working directly from the `frontend` folder.

## Run The Frontend

Start the backend first from the project root:

```bash
cd backend
npm install
cp .env.example .env
npm run db:setup
npm start
```

Then start the frontend in a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

Open the app here:

```text
http://localhost:5173
```

The frontend calls the backend here:

```text
http://localhost:3000
```

## Environment

The frontend reads local settings from `frontend/.env`.

The usual values are:

```env
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_USE_MOCKS=false
```

Restart `npm start` after changing this file.

## Demo Login

```text
denis@example.com / test00
yael@example.com / test00
amit@example.com / test00
```

## Pages

`/login` is used for demo login.

`/dashboard` shows daily nutrition totals, recent meals and live updates.

`/meals` shows meal history, manual meal CRUD and AI meal review.

`/settings` edits profile username, profile email and theme.

## Backend Routes Used

```text
POST /api/auth/login
POST /api/auth/logout
GET /api/users/me
GET /api/settings
PUT /api/settings
GET /dashboard/today
GET /meals
POST /meals
PUT /meals/:id
DELETE /meals/:id
POST /api/ai/analyze-image
POST /api/meals/from-ai
```

## Build Check

```bash
npm run build
```
