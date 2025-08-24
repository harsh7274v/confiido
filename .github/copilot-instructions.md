# Copilot Instructions for Lumina (Confiido) Codebase

## Big Picture Architecture
- **Monorepo Structure**: Contains `frontend` (Next.js app) and `backend` (Node.js/Express API with TypeScript).
- **Data Flow**: Frontend communicates with backend via REST API endpoints (see `backend/src/routes/`). User authentication uses JWT tokens stored in localStorage.
- **Database**: Backend uses MongoDB (see `backend/src/models/`).
- **Real-time Features**: Socket.io is used for messaging and notifications (see `backend/src/services/socketService.ts`).
- **File Uploads**: Cloudinary integration for media (see backend services).
- **Payments**: Stripe integration is present but may require further setup.

## Developer Workflows
- **Backend**
  - Start dev server: `npm run dev` in `backend/` (uses nodemon, see `nodemon.json`).
  - Environment setup: Copy `env.example` to `.env` and fill in secrets.
  - Test scripts: See `backend/src/scripts/` for data seeding and avatar updates.
- **Frontend**
  - Start dev server: `npm run dev` in `frontend/`.
  - Main entry: `frontend/app/page.tsx`.
  - API base URL: Use `NEXT_PUBLIC_API_URL` env variable for backend endpoint.

## Project-Specific Patterns & Conventions
- **User Profile Update**: Frontend must send profile updates as `{ userdata: ... }` in the request body to `/api/users/profile` (see `EditProfilePopupUser.tsx` and backend route logic).
- **Authentication**: JWT token required in `Authorization` header for protected routes.
- **Error Handling**: Centralized in `backend/src/middleware/errorHandler.ts`.
- **Role-Based Access**: Backend enforces roles for certain endpoints (see middleware).
- **Frontend UI**: Uses custom UI components in `frontend/app/components/ui/`.
- **Date Handling**: Dates are stored as strings in profile data.

## Integration Points
- **Cloudinary**: For file uploads (see backend config/services).
- **Stripe**: For payments (see backend services, may need API keys).
- **Socket.io**: For real-time messaging (see backend and frontend usage).
- **Nodemailer**: For email notifications (see backend services).

## Key Files & Directories
- `backend/src/routes/` — API endpoints
- `backend/src/models/` — Mongoose models
- `backend/src/services/` — Business logic (dashboard, mailer, socket, etc.)
- `frontend/app/components/` — React components
- `frontend/app/config/firebase.ts` — Firebase config (if used)
- `frontend/app/contexts/AuthContext.tsx` — Auth context for frontend

## Example: User Profile Update
```tsx
// Frontend: Send PUT request to update profile
await fetch('/api/users/profile', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ userdata: profile })
});
```

## Additional Notes
- Always check for required environment variables in `.env` and `env.example`.
- For new features, follow the existing service/controller pattern in backend.
- For UI, use Tailwind CSS and custom components for consistency.

---

If any section is unclear or missing, please provide feedback to improve these instructions.
