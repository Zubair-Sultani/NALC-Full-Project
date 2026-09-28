import express from "express";
const router = express.Router();
import teacherModel from "../models/teacher-model.js";
import { authMiddleware, requireRole } from '../middleware/auth_middleware.js';
import multer from "multer";
import path from "path"
import fs from "fs"



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads")
    },
    filename: (req, file, cb) => {
        const newFilename = Date.now() + path.extname(file.originalname);
        cb(null, newFilename)
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true)
    } else {
        cb(new Error("Only images are allowed!"), false)
    }
}


const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5
    }
})



// Get All teacher 
router.get("/", async (req, res) => {
    try {

        const search = req.query.search || ''
        
        const query = {
            $or: [
                {firstName: {$regex: search, $options: "i"}},
                {lastName: {$regex: search, $options: "i"}},
            ]
            
        }

        const teachers = await teacherModel.find(query)
        res.json(teachers)
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})


// Get a single Students 
router.get("/:id", async (req, res) => {
    try {
        const teacher = await teacherModel.findById(req.params.id);
        if (!teacher) return res.status(404).json({ message: "teacher not found" });
        res.json(teacher);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
})


// Add new Students 
router.post("/", authMiddleware, requireRole('Administrator','Teacher'), upload.single("profilePic"), async (req, res) => {
    try {

        // const newTeacher = await teacherModel.create(req.body);
        const newTeacher = new teacherModel(req.body)

        if (req.file) {
            newTeacher.profilePic = req.file.filename;
        }
        await newTeacher.save()
        res.status(201).json(newTeacher);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
})


// Update a Students 
router.put("/:id", authMiddleware, requireRole('Administrator','Teacher'), upload.single("profilePic"), async (req, res) => {
    try {

        const existingTeacher = await teacherModel.findById(req.params.id)
        if (!existingTeacher) {
            if(req.file.filename){
                const filePath = path.join("./uploads", req.file.filename)
                fs.unlink(filePath, (err) => {
                    if (err) console.log("failed to delete image", err)
                })
            }
            return res.status(404).json({ message: "teacher not found" });
        }
        if (req.file) {
            if (existingTeacher.profilePic) {
                const filePath = path.join("./uploads", existingTeacher.profilePic)
                fs.unlink(filePath, (err) => {
                    if (err) console.log("failed to delete", err)
                })
            }
            req.body.profilePic = req.file.filename
        }

        const updatedTeacher = await teacherModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedTeacher) return res.status(404).json({ message: "teacher not found" });
        res.json(updatedTeacher);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
})


// Delete a Students 
router.delete("/:id", authMiddleware, requireRole('Administrator'), async (req, res) => {
    try {
        const teacher = await teacherModel.findByIdAndDelete(req.params.id);
        if (!teacher) return res.status(404).json({ message: "teacher not found" });

        if (teacher.profilePic) {
            const filePath = path.join("./uploads", teacher.profilePic)
            fs.unlink(filePath, (err) => {
                if (err) console.log("failed to delete", err)
            })
        }

        res.json({ message: "teacher deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

export default router