// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// Enable CORS for Ngrok and local development
app.use(cors({ origin: '*' }));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'community_health_secret_key_2026';
const db = new sqlite3.Database('./nutrition.db');

db.serialize(() => {
  // 1. Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    age INTEGER,
    height REAL,
    weight REAL,
    bmi REAL,
    target_calories INTEGER DEFAULT 2000,
    water_intake INTEGER DEFAULT 0
  )`);

  // 2. Multilingual Food Database Table
  db.run(`CREATE TABLE IF NOT EXISTS food_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    name_hi TEXT,
    name_mr TEXT,
    portion_type TEXT,
    calories INTEGER,
    carbs INTEGER,
    protein INTEGER,
    fats INTEGER
  )`);

  // 3. User Meal Logs Table
  db.run(`CREATE TABLE IF NOT EXISTS meal_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    meal_type TEXT,
    food_name TEXT,
    portion_count INTEGER,
    total_calories INTEGER,
    total_carbs INTEGER,
    total_protein INTEGER,
    total_fats INTEGER,
    logged_date TEXT DEFAULT (DATE('now', 'localtime')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // 4. Community Announcements Table
  db.run(`CREATE TABLE IF NOT EXISTS community_announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    date_posted TEXT DEFAULT (DATE('now', 'localtime'))
  )`);

  // Seed default food items
  db.get(`SELECT count(*) as count FROM food_items`, [], (err, row) => {
    if (row && row.count === 0) {
      const foods = [
        ['Roti / Chapati', 'रोटी / चपाती', 'पोळी / चपाती', '1 Piece', 80, 15, 3, 1],
        ['Rice', 'चावल / भात', 'भात', '1 Bowl', 130, 28, 2, 0],
        ['Dal (Lentil Soup)', 'दाल', 'वरण / आमटी', '1 Bowl', 100, 12, 6, 2],
        ['Paneer Sabzi', 'पनीर सब्जी', 'पनीर भाजी', '1 Bowl', 180, 6, 10, 14],
        ['Mix Veg Sabzi', 'मिक्स वेज सब्जी', 'मिक्स व्हेज भाजी', '1 Bowl', 120, 14, 4, 5],
        ['Poha', 'पोहा', 'पोहे', '1 Bowl', 250, 45, 5, 6],
        ['Upma', 'उपमा', 'उप्पीट', '1 Bowl', 200, 35, 4, 5],
        ['Idli', 'इडली', 'इडली', '2 Pieces', 120, 24, 4, 1],
        ['Dosa (Plain)', 'डोसा', 'डोसा', '1 Piece', 150, 29, 3, 3],
        ['Sambar', 'सांबर', 'सांबार', '1 Bowl', 90, 14, 3, 2],
        ['Moong Dal Chilla', 'मूंग दाल चिल्ला', 'मुगाचे धिरडे', '1 Piece', 110, 14, 6, 3],
        ['Apple', 'सेब', 'सफरचंद', '1 Medium', 95, 25, 0, 0],
        ['Banana', 'केला', 'केळी', '1 Medium', 105, 27, 1, 0],
        ['Curd / Yogurt', 'दही', 'दही', '1 Small Cup', 60, 4, 3, 3],
        ['Boiled Egg', 'उबला हुआ अंडा', 'उकडलेले अंडे', '1 Whole Egg', 78, 1, 6, 5],
        ['Chicken Curry', 'चिकन करी', 'चिकन रस्सा', '1 Bowl', 240, 8, 22, 14]
      ];
      const stmt = db.prepare(`INSERT INTO food_items (name, name_hi, name_mr, portion_type, calories, carbs, protein, fats) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      foods.forEach(f => stmt.run(f));
      stmt.finalize();
    }
  });

  // Seed default announcement
  db.get(`SELECT count(*) as count FROM community_announcements`, [], (err, row) => {
    if (row && row.count === 0) {
      db.run(`INSERT INTO community_announcements (title, description) 
              VALUES ('Local Health Drive', 'Free Health Checkup & Iron Screening Camp at Ward 4 Community Center this Saturday at 10:00 AM.')`);
    }
  });
});

// JWT Verification Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. Token missing.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
};

// --- API ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, age, height, weight, target_calories } = req.body;
  if (!name || !email || !password || !age || !height || !weight) {
    return res.status(400).json({ error: 'All input fields are required.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const parsedAge = parseInt(age);
  const parsedHeight = parseFloat(height);
  const parsedWeight = parseFloat(weight);
  const bmi = (parsedWeight / ((parsedHeight / 100) ** 2)).toFixed(1);

  db.run(
    `INSERT INTO users (name, email, password, age, height, weight, bmi, target_calories) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, email, hashedPassword, parsedAge, parsedHeight, parsedWeight, bmi, target_calories || 2000],
    function (err) {
      if (err) return res.status(400).json({ error: 'Email already exists.' });
      const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET);
      res.json({ message: 'Registration successful!', token });
    }
  );
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'User not found.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ message: 'Login successful!', token });
  });
});

app.get('/api/user', authenticateToken, (req, res) => {
  db.get(`SELECT id, name, email, age, height, weight, bmi, target_calories, water_intake FROM users WHERE id = ?`, [req.user.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
});

app.put('/api/user', authenticateToken, (req, res) => {
  const { name, age, height, weight, target_calories } = req.body;
  const parsedAge = parseInt(age);
  const parsedHeight = parseFloat(height);
  const parsedWeight = parseFloat(weight);
  const parsedTarget = parseInt(target_calories) || 2000;
  const bmi = (parsedWeight / ((parsedHeight / 100) ** 2)).toFixed(1);

  db.run(
    `UPDATE users SET name = ?, age = ?, height = ?, weight = ?, bmi = ?, target_calories = ? WHERE id = ?`,
    [name, parsedAge, parsedHeight, parsedWeight, bmi, parsedTarget, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Profile updated successfully', bmi });
    }
  );
});

app.get('/api/user/streak', authenticateToken, (req, res) => {
  db.all(
    `SELECT DISTINCT logged_date FROM meal_logs WHERE user_id = ? ORDER BY logged_date DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      let streak = 0;
      let checkDate = new Date();

      for (let i = 0; i < rows.length; i++) {
        const logDate = rows[i].logged_date;
        const expectedDate = checkDate.toISOString().split('T')[0];
        if (logDate === expectedDate) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      res.json({ streak });
    }
  );
});

app.post('/api/user/water', authenticateToken, (req, res) => {
  const { change } = req.body;
  db.run(`UPDATE users SET water_intake = MAX(0, water_intake + ?) WHERE id = ?`, [change, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get(`SELECT water_intake FROM users WHERE id = ?`, [req.user.id], (err, row) => {
      res.json(row);
    });
  });
});

app.get('/api/foods', (req, res) => {
  db.all(`SELECT * FROM food_items`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/meals/log', authenticateToken, (req, res) => {
  const { meal_type, food_id, custom_name, custom_calories, portion_count, carbs, protein, fats } = req.body;
  const today = new Date().toISOString().split('T')[0];

  if (food_id === 'custom') {
    if (!custom_name || !custom_calories) {
      return res.status(400).json({ error: 'Food name and estimated calories are required.' });
    }
    const total_calories = parseInt(custom_calories) * portion_count;
    const total_carbs = (carbs || 0) * portion_count;
    const total_protein = (protein || 0) * portion_count;
    const total_fats = (fats || 0) * portion_count;

    db.run(
      `INSERT INTO meal_logs (user_id, meal_type, food_name, portion_count, total_calories, total_carbs, total_protein, total_fats, logged_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, meal_type, custom_name, portion_count, total_calories, total_carbs, total_protein, total_fats, today],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        return res.status(200).json({ message: 'Custom meal logged successfully!' });
      }
    );
  } else {
    db.get(`SELECT * FROM food_items WHERE id = ?`, [food_id], (err, food) => {
      if (err || !food) return res.status(400).json({ error: 'Food item not found' });

      const total_calories = food.calories * portion_count;
      const total_carbs = food.carbs * portion_count;
      const total_protein = food.protein * portion_count;
      const total_fats = food.fats * portion_count;

      db.run(
        `INSERT INTO meal_logs (user_id, meal_type, food_name, portion_count, total_calories, total_carbs, total_protein, total_fats, logged_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, meal_type, food.name, portion_count, total_calories, total_carbs, total_protein, total_fats, today],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.status(200).json({ message: 'Meal logged successfully!' });
        }
      );
    });
  }
});

app.get('/api/meals/summary', authenticateToken, (req, res) => {
  const selectedDate = req.query.date || new Date().toISOString().split('T')[0];

  db.all(`SELECT * FROM meal_logs WHERE user_id = ? AND logged_date = ? ORDER BY id DESC`, [req.user.id, selectedDate], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const totals = rows.reduce(
      (acc, curr) => {
        acc.calories += curr.total_calories;
        acc.carbs += curr.total_carbs;
        acc.protein += curr.total_protein;
        acc.fats += curr.total_fats;
        return acc;
      },
      { calories: 0, carbs: 0, protein: 0, fats: 0 }
    );

    res.json({ logs: rows, totals, date: selectedDate });
  });
});

app.get('/api/meals/weekly-analytics', authenticateToken, (req, res) => {
  db.all(
    `SELECT logged_date as date, SUM(total_calories) as calories 
     FROM meal_logs 
     WHERE user_id = ? 
     GROUP BY logged_date 
     ORDER BY logged_date DESC LIMIT 7`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.reverse());
    }
  );
});

app.get('/api/announcements', (req, res) => {
  db.all(`SELECT * FROM community_announcements ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/announcements', authenticateToken, (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description required.' });
  }

  db.run(
    `INSERT INTO community_announcements (title, description) VALUES (?, ?)`,
    [title, description],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Announcement created successfully!', id: this.lastID });
    }
  );
});

app.use(express.static(path.join(__dirname, 'build')));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});