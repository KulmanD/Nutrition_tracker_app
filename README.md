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
