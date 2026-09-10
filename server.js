const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { pool, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_NAME = process.env.DB_NAME || 'pr-demo';

// Middleware: Request body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware: Static assets
app.use(express.static(path.join(__dirname, 'public')));

// Template engine setup: EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session management
app.use(
  session({
    name: 'prdemo_session',
    secret: process.env.SESSION_SECRET || 'pr-demo-super-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
      sameSite: 'lax',
    },
  })
);

// Auth guard middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/login');
}

// Routes
// 1. Root -> redirect based on session
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  return res.redirect('/login');
});

// 2. Sign Up - View
app.get('/signup', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  const error = req.query.error || null;
  res.render('signup', {
    error,
    username: req.query.username || '',
    name: req.query.name || '',
    dbName: DB_NAME,
  });
});

// 3. Sign Up - Process Registration (PostgreSQL Dynamic Storage)
app.post('/signup', async (req, res) => {
  const { username, name, password, confirmPassword } = req.body;

  if (!username || !password || !name) {
    return res.render('signup', {
      error: 'Please fill in all required fields.',
      username: username || '',
      name: name || '',
      dbName: DB_NAME,
    });
  }

  if (password !== confirmPassword) {
    return res.render('signup', {
      error: 'Passwords do not match.',
      username: username || '',
      name: name || '',
      dbName: DB_NAME,
    });
  }

  if (password.length < 6) {
    return res.render('signup', {
      error: 'Password must be at least 6 characters long.',
      username: username || '',
      name: name || '',
      dbName: DB_NAME,
    });
  }

  const normalizedUser = username.trim().toLowerCase();

  try {
    // Check if username already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = $1',
      [normalizedUser]
    );

    if (existing.rows.length > 0) {
      return res.render('signup', {
        error: `Username "${normalizedUser}" is already registered.`,
        username: normalizedUser,
        name: name || '',
        dbName: DB_NAME,
      });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into PostgreSQL
    await pool.query(
      'INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)',
      [normalizedUser, hashedPassword, name.trim(), 'Member']
    );

    console.log(`> [Database] User registered: "${normalizedUser}"`);
    return res.redirect(
      `/login?success=Account+created+successfully!+Please+sign+in.&username=${encodeURIComponent(
        normalizedUser
      )}`
    );
  } catch (err) {
    console.error('> [Database Error in /signup]:', err.message);
    return res.render('signup', {
      error: 'Database error: ' + err.message,
      username: normalizedUser,
      name: name || '',
      dbName: DB_NAME,
    });
  }
});

// 4. Login - View
app.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  const error = req.query.error || null;
  const success = req.query.success || null;
  const username = req.query.username || '';
  res.render('login', { error, success, username, dbName: DB_NAME });
});

// 5. Login - Process Authentication (Dynamic PostgreSQL Validation)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('login', {
      error: 'Please enter both username and password.',
      success: null,
      username: username || '',
      dbName: DB_NAME,
    });
  }

  const normalizedUser = username.trim().toLowerCase();

  try {
    // Fetch user from PostgreSQL
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = $1',
      [normalizedUser]
    );

    const user = result.rows[0];

    if (!user) {
      return res.render('login', {
        error: 'Invalid username or password. Please try again.',
        success: null,
        username: normalizedUser,
        dbName: DB_NAME,
      });
    }

    // Verify hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render('login', {
        error: 'Invalid username or password. Please try again.',
        success: null,
        username: normalizedUser,
        dbName: DB_NAME,
      });
    }

    // Initialize authenticated user session
    req.session.regenerate((err) => {
      if (err) {
        return res.render('login', {
          error: 'Session error, please try again.',
          success: null,
          username: normalizedUser,
          dbName: DB_NAME,
        });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        role: user.role || 'Member',
        loginTime: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      console.log(`> [Auth] User logged in successfully: "${user.username}"`);
      return res.redirect('/dashboard');
    });
  } catch (err) {
    console.error('> [Database Error in /login]:', err.message);
    return res.render('login', {
      error: 'Database error: ' + err.message,
      success: null,
      username: normalizedUser,
      dbName: DB_NAME,
    });
  }
});

// 6. Protected Dashboard (greets with "Hi welcome <username>")
app.get('/dashboard', requireAuth, (req, res) => {
  const user = req.session.user;
  res.render('dashboard', {
    username: user.username,
    user: user,
    dbName: DB_NAME,
  });
});

// 7. Logout
app.all('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie('prdemo_session');
      res.redirect('/login');
    });
  } else {
    res.redirect('/login');
  }
});

// 8. JSON Auth API endpoint
app.get('/api/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({
      authenticated: true,
      user: req.session.user,
    });
  }
  return res.status(401).json({
    authenticated: false,
    message: 'Not logged in',
  });
});

// Start Server and initialize DB table
async function startServer() {
  await initDb();

  app.listen(PORT, () => {
    console.log(`> PR-Demo server is running at http://localhost:${PORT}`);
    console.log(`> PostgreSQL Database: "${DB_NAME}"`);
    console.log(`> Dynamic Sign Up: http://localhost:${PORT}/signup`);
    console.log(`> Dynamic Login:   http://localhost:${PORT}/login`);
  });
}

startServer();
