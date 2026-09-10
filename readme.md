# PR Demo - PostgreSQL Authentication & Dashboard

A Node.js / Express backend with dynamic user registration, authentication, and a personalized dashboard powered by PostgreSQL (`pr-demo` database).

## Dynamic Database Authentication (PostgreSQL)

### 1. Environment Configuration (`.env`)
Configure your PostgreSQL credentials in `.env`:
```env
PORT=3000
SESSION_SECRET=pr-demo-super-secret-key-2026

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_pgadmin_postgres_password
DB_NAME=pr-demo
```

### 2. Automatic Schema Creation
On startup, `db.js` automatically creates the `users` table in `pr-demo` if it does not exist:
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'Member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## Routes & Endpoints

- `GET /` &rarr; Redirects to `/dashboard` (if logged in) or `/login`
- `GET /signup` &rarr; Dynamic registration form
- `POST /signup` &rarr; Hashes password with `bcryptjs` and stores user in PostgreSQL
- `GET /login` &rarr; Dynamic login form
- `POST /login` &rarr; Validates against `users` table with `bcryptjs.compare`
- `GET /dashboard` &rarr; Protected dashboard greeting with **"Hi welcome &lt;username&gt;"**
- `GET /logout` &rarr; Clears session and redirects to `/login`
- `GET /api/me` &rarr; JSON session status