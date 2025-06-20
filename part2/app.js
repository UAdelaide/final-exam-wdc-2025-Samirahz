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

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;