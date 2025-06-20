const express = require('express');
const path = require('path');
const session = require('express-session');  // added this
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

//added this for logout:
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out' });
    });
});

// for dog's owner (task)

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;