const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory demo user credentials
const USERS = {
  bablu: {
    username: 'bablu',
    password: 'password123',
    name: 'Bablu Rawath',
    role: 'Administrator',
  },
  admin: {
    username: 'admin',
    password: 'admin123',
    name: 'System Admin',
    role: 'Superuser',
  },
  guest: {
    username: 'guest',
    password: 'guest123',
    name: 'Demo Guest',
    role: 'Viewer',
  },
};

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

// 2. Login view
app.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  const error = req.query.error || null;
  const username = req.query.username || '';
  res.render('login', { error, username });
});

// 3. Login submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('login', {
      error: 'Please enter both username and password.',
      username: username || '',
    });
  }

  const normalizedUser = username.trim().toLowerCase();
  const account = USERS[normalizedUser];

  if (account && account.password === password) {
    // Regenerate session ID on login to protect against session fixation
    req.session.regenerate((err) => {
      if (err) {
        return res.render('login', {
          error: 'Session error, please try again.',
          username: normalizedUser,
        });
      }

      req.session.user = {
        username: account.username,
        name: account.name,
        role: account.role,
        loginTime: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      return res.redirect('/dashboard');
    });
  } else {
    return res.render('login', {
      error: 'Invalid username or password. Please try again.',
      username: normalizedUser,
    });
  }
});

// 4. Protected Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
  const user = req.session.user;
  res.render('dashboard', {
    username: user.username,
    user: user,
  });
});

// 5. Logout
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

// 6. JSON Auth API endpoint (useful for frontend checks)
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

// Start server
app.listen(PORT, () => {
  console.log(`> PR-Demo server is running at http://localhost:${PORT}`);
  console.log(`> Login credentials:`);
  console.log(`   - bablu / password123`);
  console.log(`   - admin / admin123`);
  console.log(`   - guest / guest123`);
});
