const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, subject, attendance, marks } = req.body;
    const normalizedRole = role ? role.toLowerCase() : role;
    const isStudent = normalizedRole === 'student';
    const hasAttendance = attendance !== undefined && attendance !== null;
    const initialAttendance = isStudent && !hasAttendance ? 80 : attendance;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: normalizedRole,
      subject,
      attendance: initialAttendance,
      marks,
      attendanceVerified: isStudent ? (initialAttendance !== undefined && initialAttendance !== null) : true
    });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    console.log('Generated token with secret:', process.env.JWT_SECRET ? 'from env' : 'fallback');
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { username: user.username, role: user.role, subject: user.subject }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Special case for admin login
    if (username === 'admin' && password === 'admin') {
      const token = jwt.sign(
        { userId: 'admin', username: 'admin', role: 'admin' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: { username: 'admin', role: 'admin' }
      });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username email role subject attendance attendanceVerified createdAt');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin only)
router.put('/users/:id', async (req, res) => {
  try {
    const { username, email, role, subject, attendance, marks } = req.body;
    const updateData = { username, email, role, subject };
    if (attendance !== undefined) {
      updateData.attendance = attendance;
      updateData.attendanceVerified = true;
    }
    if (marks !== undefined) {
      updateData.marks = marks;
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all teachers (for student feedback dropdown)
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }, 'username _id subject');
    console.log('Found teachers:', teachers); // Debug log
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
