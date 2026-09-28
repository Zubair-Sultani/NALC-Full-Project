import express from "express";
const router = express.Router();
import courseModel from "../models/course-model.js";
import { authMiddleware, requireRole } from '../middleware/auth_middleware.js';

// Get All courses
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || '';
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};
    const courses = await courseModel.find(query);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single course
router.get("/:id", async (req, res) => {
  try {
    const course = await courseModel.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'course not found' });
    res.json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Create
router.post("/", authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const newCourse = new courseModel(req.body);
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update
router.put("/:id", authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const updated = await courseModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'course not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete
router.delete("/:id", authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const c = await courseModel.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ message: 'course not found' });
    res.json({ message: 'course deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
