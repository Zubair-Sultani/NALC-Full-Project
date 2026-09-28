import express from 'express';
const router = express.Router();
import feeModel from '../models/fee-model.js';
import { authMiddleware, requireRole } from '../middleware/auth_middleware.js';

router.get('/', async (req, res) => {
  try {
    const fees = await feeModel.find().sort({ createdAt: -1 });
    res.json(fees);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', authMiddleware, requireRole('Administrator','Teacher'), async (req, res) => {
  try {
    const f = new feeModel(req.body);
    await f.save();
    res.status(201).json(f);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const f = await feeModel.findByIdAndDelete(req.params.id);
    if (!f) return res.status(404).json({ message: 'fee not found' });
    res.json({ message: 'deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
