/**
 * Authentication & User Management Controller
 */

const jwt = require('jsonwebtoken');
const { query, isMySQLConnected, mockDb } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_food_rescue_jwt_key_2026';

exports.login = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    let user = null;

    if (isMySQLConnected()) {
      const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows && rows.length > 0) user = rows[0];
    } else {
      user = mockDb.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase()) ||
             mockDb.users.find(u => role && u.role === role.toUpperCase()) ||
             mockDb.users[0];
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or user not found' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization_name: user.organization_name,
        phone: user.phone,
        address: user.address,
        city: user.city
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    if (isMySQLConnected()) {
      let sql = 'SELECT id, name, email, role, organization_name, organization_type, phone, address, city, latitude, longitude, is_verified FROM users';
      const params = [];
      if (role) {
        sql += ' WHERE role = ?';
        params.push(role.toUpperCase());
      }
      const users = await query(sql, params);
      return res.json({ success: true, count: users.length, data: users });
    }

    let users = mockDb.users;
    if (role) {
      users = users.filter(u => u.role.toLowerCase() === role.toLowerCase());
    }
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, role, organization_name, phone, address, city } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, and role are required.' });
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      role: role.toUpperCase(),
      organization_name: organization_name || name,
      phone: phone || '+1 555-0000',
      address: address || '123 Community Lane',
      city: city || 'Metropolis',
      latitude: 40.7128 + (Math.random() - 0.5) * 0.05,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.05,
      is_verified: true
    };

    if (isMySQLConnected()) {
      await query(
        `INSERT INTO users (name, email, password_hash, role, organization_name, phone, address, city, latitude, longitude, is_verified)
         VALUES (?, ?, 'dummy_hash', ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [newUser.name, newUser.email, newUser.role, newUser.organization_name, newUser.phone, newUser.address, newUser.city, newUser.latitude, newUser.longitude]
      );
    } else {
      mockDb.users.push(newUser);
    }

    res.status(201).json({ success: true, message: 'User registered successfully', user: newUser });
  } catch (err) {
    next(err);
  }
};
