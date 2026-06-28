# BCAR Portal

The repository contains two independent applications:

- `frontend/` — Angular web application (port `4200`)
- `backend/` — Node.js/Express API with MongoDB (port `3000`)

## Setup

1. Install all dependencies: `npm run install:all`
2. Copy `backend/.env.example` to `backend/.env`
3. Start MongoDB locally, or set `MONGO_URI` to a MongoDB Atlas connection string
4. Start both applications: `npm start`

The Angular development server forwards `/api` requests to the backend. If MongoDB is unavailable, the API uses its in-memory demo store so the application can still be previewed.

## Useful commands

- `npm run start:frontend` — Angular only
- `npm run start:backend` — API only
- `npm run build` — production Angular build
- `npm test` — run frontend and backend tests

Each application can also be installed and run independently from its own folder.
