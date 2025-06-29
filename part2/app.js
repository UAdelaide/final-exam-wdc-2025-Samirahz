const express = require('express');
const path = require('path');
const session = require('express-session');  // added this for session
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// session middleware
app.use(session({
  secret: 'dog-secret-key',
  resave: false,
  saveUninitialized: false
}));

// login route
const mysql = require('mysql2/promise');
let db;

// DB connection when server starts
(async () => {
  db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'DogWalkService'
  });
})();

// login endpoint
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await db.execute(`
      SELECT * FROM Users WHERE username = ? AND password_hash = ?
    `, [username, password]);

    if (rows.length === 1) {
      const user = rows[0];
      req.session.user = { id: user.user_id, role: user.role };
      res.json({ role: user.role });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// logout endpoint
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out' });
  });
});

// for dog's owner (task 15)
app.get('/api/users/my-dogs', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'owner') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const [rows] = await db.execute(`
      SELECT dog_id, name FROM Dogs WHERE owner_id = ?
    `, [req.session.user.id]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// added for task 16
app.get('/api/users/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user); // returns { id, role }
});

// Return all dogs - task 17
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Dogs');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});


// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;
