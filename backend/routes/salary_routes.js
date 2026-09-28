import express from 'express';
const router = express.Router();
import salaryModel from '../models/salary-model.js';
import { authMiddleware, requireRole } from '../middleware/auth_middleware.js';

router.get('/', async (req, res) => {
  try {
    const items = await salaryModel.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const s = new salaryModel(req.body);
    s.net = (+s.amount || 0) + (+s.bonus || 0) - (+s.deduct || 0);
    await s.save();
    res.status(201).json(s);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const s = await salaryModel.findByIdAndDelete(req.params.id);
    if (!s) return res.status(404).json({ message: 'salary not found' });
    res.json({ message: 'deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
