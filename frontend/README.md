# Nutrition Tracker Frontend

React frontend for the Nutrition Tracker app.

## Run Locally

Start the backend first:

```bash
cd ../backend
npm install
cp .env.example .env
npm run db:setup
npm start
```

Then start the frontend:

```bash
cd ../frontend
npm install
cp .env.example .env
npm start
```

- Frontend: http://localhost:5173
- Backend API base URL: http://localhost:3000

## Demo Login

- denis@example.com / password123
- yael@example.com / password123
- amit@example.com / password123

## Pages

- `/login` - login with a demo user.
- `/dashboard` - daily nutrition totals, recent meals, and live updates.
- `/meals` - meal history, manual meal creation, AI meal review, and meal CRUD.
- `/settings` - profile nickname, profile email, and theme settings.

## Backend Endpoints Used

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/users/me`
- `GET /api/settings`
- `PUT /api/settings`
- `GET /dashboard/today?userId=<userId>`
- `GET /meals?userId=<userId>`
- `POST /meals`
- `PUT /meals/:id`
- `DELETE /meals/:id`
- `POST /api/ai/analyze-image`
- `POST /api/meals/from-ai`

## Optional Checks

```bash
CI=true npm test -- --watchAll=false
npm run build
```
