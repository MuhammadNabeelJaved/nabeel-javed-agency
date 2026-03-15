# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Production start
```

No test runner is configured. No lint scripts are defined.

## Architecture

Express 5 + Mongoose (MongoDB) REST API for an agency portfolio backend. Uses ES modules (`"type": "module"` in package.json). Entry point: `src/index.js` → `src/app.js`.

**API prefix:** `/api/v1/`
**Port:** `process.env.PORT || 8000`

### Request Lifecycle

```
Route → Middleware chain (Auth → Multer → Validation) → Controller → Model → DB
                                                              ↓
                                                       AppError thrown
                                                              ↓
                                               errorHandler middleware (src/middlewares/errorHandler.js)
```

### Directory Layout

- `src/models/usersModels/` — Mongoose schemas
- `src/controllers/usersControllers/` — Business logic
- `src/routes/userRoutes/` — Route definitions
- `src/middlewares/` — Auth, file upload, error handling
- `src/utils/` — `AppError`, `apiResponse`, `sendEmails`
- `src/database/database.js` — MongoDB connection

### Authentication

JWT-based with access tokens (15m) and refresh tokens (7d) stored in HTTP-only cookies.
- Refresh token endpoint: `POST /api/v1/users/refresh-token` (cookie or body `refreshToken`)

Two key middleware functions in `src/middlewares/Auth.js`:

- `userAuthenticated` — verifies token, attaches `req.user`
- `authorizeRoles(...roles)` — RBAC gate; roles are `admin`, `team`, `user`

### File Uploads

Multer writes to `src/public/uploads/` (temp), then `src/middlewares/Cloudinary.js` pushes to Cloudinary and deletes the local file. To delete an image, extract the `public_id` from the Cloudinary URL and call the destroy helper.

### Error Handling

Throw `new AppError(message, statusCode)` inside controllers — the global `errorHandler` catches it. `asyncHandler` wraps controller functions to forward async errors automatically. MongoDB-specific errors (CastError, duplicate key, ValidationError) are normalized inside `errorHandler`.

### Response Shape

```js
// Success
successResponse(res, statusCode, message, data)
// → { success: true, message, data, statusCode }

// Error (from errorHandler)
// → { success: false, message, errors? }
```

### Models

| Model | File | Notes |
|-------|------|-------|
| User | `User.model.js` | Roles, bcrypt password, email verification, refresh token, team profile nested schema, soft-delete via `deletedAt` |
| Project | `Project.model.js` | Client project requests; payment tracking (`totalCost`, `paidAmount`, virtual `dueAmount`); file attachments |
| Contact | `Contact.model.js` | Contact form submissions |
| Reviews | `Reviews.model.js` | Rating 1–5, refs to User & Project, status `pending/approved/rejected` |
| Services | `Services.model.js` | Slug, pricing plans, FAQs, category |
| Jobs | `Jobs.model.js` | Employment type, salary range, expiry logic |
| HomePageHero | `HomePageHero.js` | CMS for homepage hero (hero badge, title lines, subtitle, CTA buttons) |
| AdminProject | `AdminProject.model.js` | Admin portfolio projects; `techStack[]`, `isPublic` flag for public portfolio |
| CMS | `CMS.model.js` | Singleton CMS for logo, tech stack categories, Concept-to-Reality steps, Why-Choose-Us section |
| JobApplication | `JobApplication.model.js` | Job applicants; unique per (job, email); status workflow pending→hired |
| Client | `Client.model.js` | Agency clients with company, industry, account manager, revenue tracking |
| Notification | `Notification.model.js` | Per-user notifications with type enum, isRead, deep-link support |

### Environment Variables

Required in `.env`:

```
MONGO_URI=
DB_NAME=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
JWT_ACCESS_SECRET=
JWT_ACCESS_SECRET_EXPIRES_IN=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=
FROM_EMAIL=
PORT=
```
