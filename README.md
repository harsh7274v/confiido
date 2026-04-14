# Confiido

Confiido is a full-stack career mentorship platform for connecting professionals with experts, booking sessions, sending real-time messages, and handling payments and notifications.

The repository is organized as a monorepo with a Next.js frontend and an Express + TypeScript backend.

## Project Structure

- `frontend/` - Next.js app router frontend
- `backend/` - Express API, MongoDB models, and background services
- `backend/api/` - serverless/API deployment variants used for platform-specific builds
- Root-level scripts - utility and diagnostic scripts used during development and deployment

## Features

- User authentication with JWT and Firebase support
- Expert discovery and booking flows
- Real-time messaging with Socket.IO
- Payments and transaction handling
- Email notifications and OTP flows
- Cloudinary file uploads
- Google Calendar integration
- Dashboard, rewards, reviews, analytics, and availability management

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- MongoDB connection string
- API keys for any services you plan to use, such as Firebase, Razorpay, Stripe, Cloudinary, or Google Calendar

## Local Setup

### 1. Install dependencies

Install dependencies separately for each app:

```bash
cd backend
npm install

cd ../frontend
npm install
```

If you want to use the root workspace tooling, also install from the repository root:

```bash
cd ..
npm install
```

### 2. Configure environment variables

Create a `.env` file in `backend/` based on `backend/env.example`.

Common backend variables include:

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `FIREBASE_*`
- `EMAIL_*`
- `CLOUDINARY_*`
- `STRIPE_*`
- `RAZORPAY_*`
- `GOOGLE_*`

For the frontend, create a `.env.local` file in `frontend/` and set at least:

- `NEXT_PUBLIC_API_URL` - backend base URL, usually `http://localhost:5003`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### 3. Run the apps

Start the backend first:

```bash
cd backend
npm run dev
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

By default, the backend listens on port `5003`, and the frontend runs on `http://localhost:3000`.

## Available Scripts

### Backend

From `backend/`:

- `npm run dev` - start the API with nodemon
- `npm run build` - compile TypeScript
- `npm run start` - run the compiled server
- `npm run test` - run Jest tests
- `npm run lint` - lint backend code

The backend also includes several utility scripts for seeding data, debugging auth, and testing integrations. Check `backend/package.json` for the full list.

### Frontend

From `frontend/`:

- `npm run dev` - start the Next.js dev server
- `npm run build` - build for production
- `npm run start` - run the production build
- `npm run lint` - lint the app

## API and Runtime Notes

- The frontend talks to the backend through `NEXT_PUBLIC_API_URL`.
- Socket.IO is used for live messaging and booking updates.
- The backend connects to MongoDB on startup and exposes REST routes under `/api`.
- CORS is configured to allow local development on `http://localhost:3000` and `http://localhost:3001`.

## Deployment

The backend includes Vercel/serverless-specific files and can be deployed in different environments. Make sure the backend environment variables are set correctly wherever you deploy, and point the frontend to the deployed API URL through `NEXT_PUBLIC_API_URL`.

## Troubleshooting

- If the frontend cannot reach the API, verify `NEXT_PUBLIC_API_URL` and ensure the backend is running.
- If authentication fails, confirm the JWT and Firebase environment variables are set correctly.
- If real-time messaging is disconnected, check that the backend CORS origin and Socket.IO URL match your local frontend URL.

## License

MIT
