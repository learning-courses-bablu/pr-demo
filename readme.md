# PR Demo - Node.js Authentication & Dashboard

A lightweight, robust Node.js / Express backend with session-based authentication, a modern responsive login page, and a protected dashboard displaying personalized greetings.

## Features
- **Express.js & EJS**: Server-side rendered views for instant UI updates with zero flash-of-unauthenticated-content.
- **Session Auth**: Secure HTTP-only cookies managed with `express-session`.
- **Protected Routes**: Middleware guard (`requireAuth`) securing `/dashboard`.
- **Modern UI Design**: Glassmorphic dark theme, gradient ambient glow, smooth focus transitions, responsive grid.
- **Demo Accounts**: Pre-configured credentials with one-click quick-fill buttons.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
# Start server
npm start

# Or with live reload
npm run dev
```
The server starts at: **http://localhost:3000**

---

## Demo Credentials

| Username | Password | Role |
| :--- | :--- | :--- |
| `bablu` | `password123` | Administrator |
| `admin` | `admin123` | Superuser |
| `guest` | `guest123` | Viewer |

---

## Routes & Endpoints

- `GET /` &rarr; Redirects to `/dashboard` (if logged in) or `/login`
- `GET /login` &rarr; Sign-in page with quick-fill buttons
- `POST /login` &rarr; Authenticates user and initiates session
- `GET /dashboard` &rarr; Protected dashboard showing **"Hi welcome &lt;username&gt;"**
- `GET /logout` &rarr; Clears session cookie and redirects to `/login`
- `GET /api/me` &rarr; Returns JSON representation of the current session