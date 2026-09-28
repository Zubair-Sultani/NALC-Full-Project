import express from 'express';
import User from '../models/user-model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth_middleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

router.post('/register', async (req, res) => {
  const { username, password, role, name } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username and password required' });
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'username already taken' });
    const hash = await bcrypt.hash(password, 10);
    const u = new User({ username, passwordHash: hash, role: role || 'Student', name });
    await u.save();
    return res.status(201).json({ id: u._id, username: u.username, role: u.role, name: u.name });
  } catch (err) { return res.status(500).json({ message: err.message }); }
});

router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username and password required' });
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'invalid credentials' });
    if (role && user.role !== role) return res.status(401).json({ message: 'incorrect role for this user' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'invalid credentials' });
    const token = jwt.sign({ sub: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, user: { id: user._id, username: user.username, role: user.role, name: user.name } });
  } catch (err) { return res.status(500).json({ message: err.message }); }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const u = req.userDetails;
    if (!u) return res.status(404).json({ message: 'user not found' });
    return res.json({ id: u._id, username: u.username, role: u.role, name: u.name });
  } catch (err) { return res.status(500).json({ message: err.message }); }
});

export default router;
