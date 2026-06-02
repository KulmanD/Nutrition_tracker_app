# NutriTrack Frontend

Assignment 3 React frontend for the nutrition / meal tracking application.

The frontend was created with Create React App and connects to the existing Assignment 2 Express backend.

## Run Locally

1. Start the backend from the repository root:

```bash
npm start
```

2. Start the frontend from this folder:

```bash
cd nutrition_frontend
npm install
npm start
```

The frontend start script uses port `3001`, so it opens at:

- Frontend: http://localhost:3001
- Backend API base URL: http://localhost:3000

## Demo Login

- Email: `denis@example.com`
- Password: `password123`

## Pages

- `/login` - login form with client-side validation
- `/dashboard` - daily nutrition summary cards and meals table
- `/meals` - dynamic table of meals from the backend
- `/settings` - editable username, email, and theme preference

## Backend Endpoints Used

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/users/me`
- `GET /api/settings`
- `PUT /api/settings`
- `GET /dashboard/today?userId=1`
- `GET /meals?userId=1`

The backend already had `/meals` and `/dashboard/today`. Minimal mock endpoints were added for the Assignment 3 login, current user, and settings requirements.

## Test / Build

```bash
npm run build
```

Optional test runner:

```bash
npm test
```

## Submission Notes

Do not include `node_modules` in the final zip. Screenshots should include Login, Dashboard, Table/Meals, and Settings.

Screenshot files are included in `screenshots/`:

- `login.png`
- `dashboard.png`
- `meals-table.png`
- `settings.png`
