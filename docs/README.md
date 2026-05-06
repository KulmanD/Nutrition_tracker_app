# Nutrition Tracker Backend API

This project is a mock backend API for an AI-assisted meal and nutrition tracking web application.

The final project idea is a web application that allows users to track daily nutrition, upload meal images, receive AI-based food item suggestions, edit the results, confirm meals, and view daily progress.

For Assignment 2, this backend uses mock data only. There is no MySQL connection and no real external AI API call.

## Technologies

- Node.js
- Express
- JSON mock data
- REST API
- Postman for testing

## How to install

```bash
npm install
```

## How to run

```bash
npm start
```

Server URL: `http://localhost:3000`

## API routes

- `GET /`
- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`
- `GET /meals`
- `GET /meals/:id`
- `POST /meals`
- `PUT /meals/:id`
- `DELETE /meals/:id`
- `POST /meals/analyze-image`
- `GET /dashboard/today?userId=1&date=2026-05-06`

## Authorization

Protected routes require the `x-user-role` header. Missing or invalid roles return `403`.

- Users create/update: `admin`, `manager`
- Users delete: `admin`
- Meals create/update/analyze-image: `admin`, `manager`, `user`
- Meals delete: `admin`

## Response format

Success:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Postman

The Postman collection is in `docs/nutrition_tracker_postman_collection.json`.
