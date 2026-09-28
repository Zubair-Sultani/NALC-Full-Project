import express from 'express';
const router = express.Router();
import noticeModel from '../models/notice-model.js';
import { authMiddleware, requireRole } from '../middleware/auth_middleware.js';

router.get('/', async (req, res) => {
  try {
    const items = await noticeModel.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const n = await noticeModel.findById(req.params.id);
    if (!n) return res.status(404).json({ message: 'notice not found' });
    res.json(n);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', authMiddleware, requireRole('Administrator','Teacher'), async (req, res) => {
  try {
    const n = new noticeModel(req.body);
    await n.save();
    res.status(201).json(n);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', authMiddleware, requireRole('Administrator','Teacher'), async (req, res) => {
  try {
    const n = await noticeModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!n) return res.status(404).json({ message: 'notice not found' });
    res.json(n);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const n = await noticeModel.findByIdAndDelete(req.params.id);
    if (!n) return res.status(404).json({ message: 'notice not found' });
    res.json({ message: 'deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
