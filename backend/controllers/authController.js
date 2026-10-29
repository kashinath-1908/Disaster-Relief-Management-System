const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [rows] = await db.execute(
      'SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

const register = async (req, res) => {
  try {
    const { full_name, email, phone, password, address, role_id } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const [existing] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const allowedRoles = [3, 4]; // Volunteer, Donor
    const finalRoleId = allowedRoles.includes(parseInt(role_id)) ? parseInt(role_id) : 4;

    const hashed = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
      'INSERT INTO users (role_id, full_name, email, phone, password, address) VALUES (?, ?, ?, ?, ?, ?)',
      [finalRoleId, full_name.trim(), email.toLowerCase().trim(), phone || null, hashed, address || null]
    );

    const userId = result.insertId;

    // Auto-create volunteer/donor profile
    if (finalRoleId === 3) {
      await db.execute('INSERT INTO volunteers (user_id) VALUES (?)', [userId]);
    } else if (finalRoleId === 4) {
      await db.execute(
        'INSERT INTO donors (donor_name, email, phone, address) VALUES (?, ?, ?, ?)',
        [full_name.trim(), email.toLowerCase().trim(), phone || null, address || null]
      );
    }

    const [newUser] = await db.execute(
      'SELECT u.user_id, u.full_name, u.email, u.phone, u.status, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?',
      [userId]
    );

    const token = jwt.sign(
      { user_id: userId, role: newUser[0].role_name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: newUser[0],
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { login, register, getMe };
