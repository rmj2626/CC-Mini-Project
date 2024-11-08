const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mysql = require('mysql2');
const session = require('express-session'); // Import session middleware
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

// Setup session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,  // Use the strong secret key from the environment variables
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }   // Set 'secure: true' if using HTTPS
}));

// Middleware to make user info available in templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Create a connection to the RDS MySQL database
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ', err.stack);
    return;
  }
  console.log('Connected to RDS MySQL database');
});

// Login page route (GET)
app.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

// Enhanced Login route (POST)
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  
  const query = `SELECT * FROM users WHERE username = ?`;
  db.query(query, [username], (err, results) => {
    if (err) {
      return res.status(500).render("login", { title: "Login", error: "Database error" });
    }

    if (results.length > 0) {
      const user = results[0];
      // Compare the entered password with the hashed password
      bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
          // Correct password, store user session
          req.session.user = user;
          res.redirect("/home");
        } else {
          res.render("login", { title: "Login", error: "Incorrect password" });
        }
      });
    } else {
      res.render("login", { title: "Login", error: "User not found" });
    }
  });
});

// Signup page route (GET)
app.get("/signup", (req, res) => {
  res.render("signup", { title: "Sign Up" });
});

// Enhanced Signup route (POST)
app.post("/signup", (req, res) => {
  const { username, email, password } = req.body;

  // Check if the user already exists
  const checkQuery = `SELECT * FROM users WHERE username = ? OR email = ?`;
  db.query(checkQuery, [username, email], (err, results) => {
    if (err) {
      return res.status(500).render("signup", { title: "Sign Up", error: "Database error" });
    }

    if (results.length > 0) {
      res.render("signup", { title: "Sign Up", error: "User with this username or email already exists" });
    } else {
      // Hash the password before saving to the database
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).render("signup", { title: "Sign Up", error: "Error creating account" });
        }

        // Add the new user to the database with the hashed password
        const insertQuery = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
        db.query(insertQuery, [username, email, hashedPassword], (err, result) => {
          if (err) {
            return res.status(500).render("signup", { title: "Sign Up", error: "Database error" });
          }

          // After successful signup, log the user in
          const newUserQuery = `SELECT * FROM users WHERE id = ?`; 
          db.query(newUserQuery, [result.insertId], (err, userResult) => {
            if (err) {
              return res.status(500).render("signup", { title: "Sign Up", error: "Database error" });
            }

            req.session.user = userResult[0];
            res.redirect("/home");
          });
        });
      });
    }
  });
});

// Logout route (GET)
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Logout failed");
    }
    res.redirect("/login");
  });
});

// Other routes...
app.get("/", (req, res) => {
    res.render("login", { title: "Login" });
});

app.get("/thank-you", (req, res) => {
  res.render("thankyou", { title: "Thank You" });
});

// Home page route (GET)
app.get("/home", (req, res) => {
  res.render("index", { title: "Home" }); // Render the home page with the title
});

app.get("/user", (req, res) => {
    res.render("user", { title: "Profile", userProfile: { nickname: "RMJ" } });
});

app.get("/Store", (req, res) => {
    res.render("Store", { title: "Store Options" });
});

app.get("/SteamVC", (req, res) => {
    res.render("SteamVC", { title: "Steam Store" });
});

app.get("/EpicVC", (req, res) => {
    res.render("EpicVC", { title: "Epic Store" });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
