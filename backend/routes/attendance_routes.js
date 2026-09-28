import express from 'express';
const router = express.Router();
import Attendance from '../models/attendance-model.js';
import { authMiddleware, requireRole } from '../middleware/auth_middleware.js';

// Students attendance
router.get('/students', async (req, res) => {
  try {
    if (req.query.date) {
      const rec = await Attendance.findOne({ date: req.query.date, kind: 'student' });
      return res.json(rec || null);
    }
    const list = await Attendance.find({ kind: 'student' }).sort({ date: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/students', authMiddleware, requireRole('Administrator','Teacher'), async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date) return res.status(400).json({ message: 'date required' });
    const rec = await Attendance.findOneAndUpdate({ date, kind: 'student' }, { records }, { upsert: true, new: true });
    res.json(rec);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Teachers attendance
router.get('/teachers', async (req, res) => {
  try {
    if (req.query.date) {
      const rec = await Attendance.findOne({ date: req.query.date, kind: 'teacher' });
      return res.json(rec || null);
    }
    const list = await Attendance.find({ kind: 'teacher' }).sort({ date: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/teachers', authMiddleware, requireRole('Administrator','Teacher'), async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date) return res.status(400).json({ message: 'date required' });
    const rec = await Attendance.findOneAndUpdate({ date, kind: 'teacher' }, { records }, { upsert: true, new: true });
    res.json(rec);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

export default router;
