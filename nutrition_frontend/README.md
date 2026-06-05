# nutritrack frontend

assignment 3 react frontend for the nutrition / meal tracking app.

it uses create react app and connects to the assignment 2 express backend.

## run locally

1. start the backend from the main project folder:

```bash
npm start
```

2. start the frontend:

```bash
cd nutrition_frontend
npm install
npm start
```

- frontend: http://localhost:5173
- backend api base url: http://localhost:3000

## demo login

you can login with one of these mock users:

- denis@example.com / password123
- yael@example.com / password123

## pages

- `/login` - login with a mock user.
- `/dashboard` - shows daily nutrition totals and recent meals.
- `/meals` - shows meal history, lets you add a meal, select a meal, see its food items, and delete the selected meal.
- `/settings` - lets you edit profile nickname, profile email, and light/dark theme.

## main features

login:
- email and password validation
- loading and error message
- redirect after login

dashboard:
- nutrition cards
- recent meals from backend

meals:
- meals table from backend
- add meal manually
- add more than one food item
- select meal to see breakdown
- delete selected meal

settings:
- edit profile nickname
- edit profile email
- change light/dark theme

## backend endpoints used

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/users/me`
- `GET /api/settings`
- `PUT /api/settings`
- `GET /dashboard/today?userId=<userId>`
- `GET /meals?userId=<userId>`
- `POST /meals`
- `DELETE /meals/:id`

## optional checks

```bash
npm test
npm run build
```
